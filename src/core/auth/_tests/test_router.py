"""
End-to-end tests for the authentication router (core/auth/router.py).

These drive the HTTP surface of the credential lifecycle: registration,
password login, the `/me` identity endpoint, refresh-token rotation, logout,
and the guarantees that keep tokens honest (access-only enforcement, inactive
users locked out).

Note on transports: `/me` authenticates via the `HTTPBearer` scheme (the
Authorization header only), while register/login *also* drop an httpOnly
access cookie used by the feature routes' PrincipalResolver. Tests that hit
`/me` therefore pass the bearer explicitly.
"""

import pytest

from core.auth.cookies import ACCESS_COOKIE_NAME

VALID_PASSWORD = "supersecret123"


def _bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _register(client, email: str = "farmer@example.com", **extra) -> dict:
    resp = await client.post(
        "/v1/auth/register",
        json={"email": email, "password": VALID_PASSWORD, **extra},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


# --- Registration ---------------------------------------------------------


@pytest.mark.asyncio
async def test_register_issues_tokens_and_sets_cookie(api_client):
    resp = await api_client.post(
        "/v1/auth/register",
        json={
            "email": "New@Example.com",
            "password": VALID_PASSWORD,
            "display_name": "New Farmer",
        },
    )
    assert resp.status_code == 200, resp.text

    body = resp.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 15 * 60

    # The httpOnly access cookie rides alongside the JSON tokens.
    assert api_client.cookies.get(ACCESS_COOKIE_NAME)


@pytest.mark.asyncio
async def test_register_duplicate_email_rejected(api_client):
    await _register(api_client, email="dupe@example.com")

    # Same address, different case — email is normalised to lower-case, so the
    # second registration must still be treated as a duplicate.
    resp = await api_client.post(
        "/v1/auth/register",
        json={"email": "Dupe@example.com", "password": VALID_PASSWORD},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Email already registered"


@pytest.mark.asyncio
async def test_first_user_is_administrator_others_are_authenticated(api_client):
    first = await _register(api_client, email="first@example.com")
    second = await _register(api_client, email="second@example.com")

    # The first registrant holds the all-access administrator role and can
    # reach the admin API; a later registrant holds only the baseline
    # "authenticated" role and is denied both admin and gated farm routes.
    admin_hdr = _bearer(first["access_token"])
    user_hdr = _bearer(second["access_token"])

    assert (await api_client.get("/v1/authz/roles", headers=admin_hdr)).status_code == 200
    assert (await api_client.get("/v1/authz/roles", headers=user_hdr)).status_code == 403
    denied = await api_client.post(
        "/v1/fields/", json={"name": "North"}, headers=user_hdr
    )
    assert denied.status_code == 403

    # Confirm the exact role assignments via the admin's view.
    users = (await api_client.get("/v1/authz/users", headers=admin_hdr)).json()
    by_email = {u["email"]: u for u in users}
    assert [r["name"] for r in by_email["first@example.com"]["roles"]] == ["administrator"]
    assert [r["name"] for r in by_email["second@example.com"]["roles"]] == ["authenticated"]


# --- Password login -------------------------------------------------------


@pytest.mark.asyncio
async def test_login_password_success(api_client):
    await _register(api_client, email="login@example.com")

    resp = await api_client.post(
        "/v1/auth/login/password",
        json={"email": "login@example.com", "password": VALID_PASSWORD},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert api_client.cookies.get(ACCESS_COOKIE_NAME)


@pytest.mark.asyncio
async def test_login_wrong_password_rejected(api_client):
    await _register(api_client, email="pw@example.com")

    resp = await api_client.post(
        "/v1/auth/login/password",
        json={"email": "pw@example.com", "password": "wrong-password"},
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_unknown_email_rejected(api_client):
    resp = await api_client.post(
        "/v1/auth/login/password",
        json={"email": "ghost@example.com", "password": VALID_PASSWORD},
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_disabled_account_rejected(api_client):
    await _register(api_client, email="disabled@example.com")

    from core.storage.database import DB

    DB.get_connection().execute(
        "UPDATE v1.users SET is_active = FALSE WHERE email = ?",
        ["disabled@example.com"],
    )

    resp = await api_client.post(
        "/v1/auth/login/password",
        json={"email": "disabled@example.com", "password": VALID_PASSWORD},
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Account is disabled"


# --- /me -------------------------------------------------------------------


@pytest.mark.asyncio
async def test_me_returns_current_user(api_client):
    tokens = await _register(
        api_client, email="me@example.com", display_name="Me Myself"
    )

    resp = await api_client.get("/v1/auth/me", headers=_bearer(tokens["access_token"]))
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["email"] == "me@example.com"
    assert body["display_name"] == "Me Myself"
    assert body["is_active"] is True


@pytest.mark.asyncio
async def test_me_surfaces_roles_and_permissions(api_client):
    # First registrant is the administrator, so /me exposes that role and the
    # full effective permission set for client-side feature gating.
    tokens = await _register(api_client, email="admin-me@example.com")

    resp = await api_client.get("/v1/auth/me", headers=_bearer(tokens["access_token"]))
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert [r["name"] for r in body["roles"]] == ["administrator"]
    assert "roles.manage" in body["permissions"]
    assert "fields.view" in body["permissions"]
    # Legacy permission names are gone after the remap.
    assert "create_field" not in body["permissions"]


@pytest.mark.asyncio
async def test_me_requires_authentication(api_client):
    resp = await api_client.get("/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_rejects_refresh_token_as_access(api_client):
    tokens = await _register(api_client, email="typeconfusion@example.com")

    # The refresh token is a valid JWT but carries type="refresh"; it must not
    # be accepted as a bearer access credential.
    resp = await api_client.get(
        "/v1/auth/me", headers=_bearer(tokens["refresh_token"])
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid or expired token"


@pytest.mark.asyncio
async def test_me_rejects_inactive_user_with_valid_token(api_client):
    tokens = await _register(api_client, email="deactivated@example.com")

    from core.storage.database import DB

    DB.get_connection().execute(
        "UPDATE v1.users SET is_active = FALSE WHERE email = ?",
        ["deactivated@example.com"],
    )

    # Token signature is still valid, but the user is now inactive.
    resp = await api_client.get("/v1/auth/me", headers=_bearer(tokens["access_token"]))
    assert resp.status_code == 401
    assert resp.json()["detail"] == "User not found or inactive"


# --- Refresh --------------------------------------------------------------


@pytest.mark.asyncio
async def test_refresh_rotates_and_revokes_old_token(api_client):
    tokens = await _register(api_client, email="refresh@example.com")
    old_refresh = tokens["refresh_token"]

    rotated = await api_client.post(
        "/v1/auth/refresh", json={"refresh_token": old_refresh}
    )
    assert rotated.status_code == 200, rotated.text
    new_tokens = rotated.json()
    assert new_tokens["refresh_token"] != old_refresh
    assert new_tokens["access_token"]

    # The new access token authenticates.
    me = await api_client.get(
        "/v1/auth/me", headers=_bearer(new_tokens["access_token"])
    )
    assert me.status_code == 200

    # Replaying the old (now-rotated) refresh token must fail.
    replay = await api_client.post(
        "/v1/auth/refresh", json={"refresh_token": old_refresh}
    )
    assert replay.status_code == 401


@pytest.mark.asyncio
async def test_refresh_invalid_token_rejected(api_client):
    resp = await api_client.post(
        "/v1/auth/refresh", json={"refresh_token": "not-a-real-token"}
    )
    assert resp.status_code == 401


# --- Logout ---------------------------------------------------------------


@pytest.mark.asyncio
async def test_logout_revokes_refresh_and_clears_cookie(api_client):
    tokens = await _register(api_client, email="logout@example.com")
    assert api_client.cookies.get(ACCESS_COOKIE_NAME)

    logout = await api_client.post(
        "/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]}
    )
    assert logout.status_code == 204

    # Cookie is cleared from the jar.
    assert api_client.cookies.get(ACCESS_COOKIE_NAME) is None

    # The revoked refresh token can no longer mint access tokens.
    replay = await api_client.post(
        "/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert replay.status_code == 401
