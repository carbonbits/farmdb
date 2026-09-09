"""
A master key for testing the API locally.

The key is an ordinary API key — `fdb_` prefixed, sha256-hashed in
v1.api_keys, resolved by the same PrincipalResolver as every other credential.
What makes it a master key is who it belongs to: a user holding
"administrator", the system role that carries every permission in the catalog.

That is the whole point of doing it this way. There is no bypass anywhere in
the request path, nothing to strip before production, and the key can be
revoked or listed like any other. A token that short-circuited the permission
check would be a second, unaudited way into every endpoint, living in the same
code that serves real traffic.

The command refuses to run outside dev. Treat that as a guardrail rather than a
security boundary: anyone who can run this CLI can already reach the database,
and could set ENVIRONMENT=dev. It is here to stop an absent-minded `farmdb
apikey master` against a production .env, not a determined operator.
"""

import typer

app = typer.Typer()

# EmailStr rejects both "dev@localhost" (no dot) and ".local" (special-use).
# example.com is reserved by IANA for exactly this and accepted by the validator.
DEFAULT_EMAIL = "dev@example.com"
DEFAULT_NAME = "master key (dev)"


@app.command("master")
def master(
    email: str = typer.Option(DEFAULT_EMAIL, help="User the key belongs to."),
    name: str = typer.Option(DEFAULT_NAME, help="Label shown when listing keys."),
) -> None:
    """Mint an all-permissions API key for local testing. Dev only."""
    from config.settings import settings

    if not settings.is_dev:
        typer.echo(
            f"✗ Refusing to mint a master key with environment="
            f"{settings.environment.value}. This is a development tool.",
            err=True,
        )
        raise typer.Exit(1)

    from core.auth.apikeys.store import ApiKeyStore
    from core.auth.service import AuthService
    from core.storage.database import DB

    DB.connect()

    try:
        conn = DB.get_connection()

        admin_role = conn.execute(
            "SELECT id FROM v1.roles WHERE name = 'administrator'"
        ).fetchone()

        if admin_role is None:
            typer.echo(
                "✗ No 'administrator' role. Run `farmdb migration apply` first.",
                err=True,
            )
            raise typer.Exit(1)

        admin_role_id = admin_role[0]

        auth = AuthService()
        user = auth.get_user_by_email(email)

        if user is None:
            # No password: this user signs in with the key, not the login form.
            user = auth.create_user(email=email, display_name="Local development")
            typer.echo(f"Created user {email}")
        else:
            typer.echo(f"Using existing user {email}")

        granted = _ensure_administrator(conn, user.id, admin_role_id)

        if granted:
            typer.echo("Granted the administrator role")

        added = _sync_all_permissions(conn, admin_role_id)

        if added:
            typer.echo(
                f"Granted {added} permission(s) to administrator that post-date "
                "the catalog seed"
            )

        generated = ApiKeyStore().create(user_id=user.id, name=name)
    finally:
        DB.disconnect()

    typer.echo("\n✓ Master key — shown once, it is only stored hashed:\n")
    typer.echo(f"  {generated.key}\n")
    typer.echo("Use it as a bearer token:\n")
    typer.echo(
        f'  curl -H "Authorization: Bearer {generated.key}" \\\n'
        f"    http://localhost:{settings.api_port}/v1/maps/collections\n"
    )
    typer.echo(f"Revoke it from the API, or by id {generated.info.id}.")


def _ensure_administrator(conn, user_id: str, admin_role_id: str) -> bool:
    """Give the user the administrator role. True if it had to be granted.

    create_user only makes the *first* registrant an administrator; on a
    database that already has one, a fresh dev user would land on the baseline
    "authenticated" role and the key would be able to do nothing at all.
    """
    from ulid import ULID

    held = conn.execute(
        "SELECT 1 FROM v1.user_roles WHERE user_id = ? AND role_id = ?",
        [user_id, admin_role_id],
    ).fetchone()

    if held is not None:
        return False

    conn.execute(
        "INSERT INTO v1.user_roles (id, user_id, role_id) VALUES (?, ?, ?)",
        [str(ULID()), user_id, admin_role_id],
    )

    return True


def _sync_all_permissions(conn, admin_role_id: str) -> int:
    """Grant administrator every permission in the catalog. Returns how many were missing.

    Migration 0011 granted the catalog as it stood then. A permission added by a
    later feature — a new map layer's keys, say — is not automatically on the
    role, so a "master" key would 403 on exactly the new endpoint being tested.
    """
    from ulid import ULID

    missing = conn.execute(
        """
        SELECT p.id FROM v1.permissions p
        WHERE NOT EXISTS (
            SELECT 1 FROM v1.role_permissions rp
            WHERE rp.permission_id = p.id AND rp.role_id = ?
        )
        """,
        [admin_role_id],
    ).fetchall()

    for (permission_id,) in missing:
        conn.execute(
            "INSERT INTO v1.role_permissions (id, role_id, permission_id) "
            "VALUES (?, ?, ?)",
            [str(ULID()), admin_role_id, permission_id],
        )

    return len(missing)
