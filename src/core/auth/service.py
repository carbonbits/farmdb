import hashlib
import json
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from config.settings import settings
from core.auth.models import PasskeyInfo, User, UserPublic
from core.service import Service
from core.storage.database import db


class AuthService(Service):
    def __init__(self):
        super().__init__()
        self._ph = PasswordHasher()
        self._challenges: dict[str, bytes] = {}

    @property
    def service_signature(self) -> str:
        return "auth_svc"

    # User management
    def create_user(
        self, email: str, password: Optional[str] = None, display_name: Optional[str] = None
    ) -> User:
        conn = db()
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        conn.execute(
            """
            INSERT INTO v1.users
                (id, email, display_name, is_active, is_verified, created_at, updated_at)
            VALUES (?, ?, ?, TRUE, FALSE, ?, ?)
            """,
            [user_id, email.lower(), display_name, now, now],
        )

        if password:
            self.set_password(user_id, password)

        return self.get_user_by_id(user_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        conn = db()
        result = conn.execute(
            """
            SELECT id, email, display_name, is_active, is_verified, created_at, updated_at
            FROM v1.users WHERE email = ?
            """,
            [email.lower()],
        ).fetchone()

        if not result:
            return None

        return User(
            id=result[0],
            email=result[1],
            display_name=result[2],
            is_active=result[3],
            is_verified=result[4],
            created_at=result[5],
            updated_at=result[6],
        )

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        conn = db()
        result = conn.execute(
            """
            SELECT id, email, display_name, is_active, is_verified, created_at, updated_at
            FROM v1.users WHERE id = ?
            """,
            [user_id],
        ).fetchone()

        if not result:
            return None

        return User(
            id=result[0],
            email=result[1],
            display_name=result[2],
            is_active=result[3],
            is_verified=result[4],
            created_at=result[5],
            updated_at=result[6],
        )

    def user_to_public(self, user: User) -> UserPublic:
        return UserPublic(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
        )

    # Password management
    def set_password(self, user_id: str, password: str) -> None:
        conn = db()
        password_hash = self._ph.hash(password)
        cred_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        # Upsert password credential
        existing = conn.execute(
            "SELECT id FROM v1.password_credentials WHERE user_id = ?", [user_id]
        ).fetchone()

        if existing:
            conn.execute(
                """
                UPDATE v1.password_credentials
                SET password_hash = ?, updated_at = ?
                WHERE user_id = ?
                """,
                [password_hash, now, user_id],
            )
        else:
            conn.execute(
                """
                INSERT INTO v1.password_credentials
                    (id, user_id, password_hash, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                [cred_id, user_id, password_hash, now, now],
            )

    def verify_password(self, user_id: str, password: str) -> bool:
        conn = db()
        result = conn.execute(
            "SELECT password_hash FROM v1.password_credentials WHERE user_id = ?",
            [user_id],
        ).fetchone()

        if not result:
            return False

        try:
            self._ph.verify(result[0], password)
            # Rehash if needed
            if self._ph.check_needs_rehash(result[0]):
                self.set_password(user_id, password)
            return True
        except VerifyMismatchError:
            return False

    # Passkey management
    def generate_passkey_registration_options(self, user: User) -> dict:
        conn = db()

        # Get existing credentials for exclusion
        existing_creds = conn.execute(
            "SELECT credential_id FROM v1.passkey_credentials WHERE user_id = ?",
            [user.id],
        ).fetchall()

        exclude_credentials = [PublicKeyCredentialDescriptor(id=row[0]) for row in existing_creds]

        options = generate_registration_options(
            rp_id=settings.webauthn_rp_id,
            rp_name=settings.webauthn_rp_name,
            user_id=user.id.encode(),
            user_name=user.email,
            user_display_name=user.display_name or user.email,
            exclude_credentials=exclude_credentials,
            authenticator_selection=AuthenticatorSelectionCriteria(
                resident_key=ResidentKeyRequirement.PREFERRED,
                user_verification=UserVerificationRequirement.PREFERRED,
            ),
        )

        # Store challenge for verification
        self._challenges[user.id] = options.challenge

        # Helper to get value from enum or return string as-is
        def enum_val(v):
            return v.value if hasattr(v, "value") else v

        return {
            "challenge": bytes_to_base64url(options.challenge),
            "rp": {"id": options.rp.id, "name": options.rp.name},
            "user": {
                "id": bytes_to_base64url(options.user.id),
                "name": options.user.name,
                "displayName": options.user.display_name,
            },
            "pubKeyCredParams": [
                {"type": enum_val(p.type), "alg": enum_val(p.alg)}
                for p in options.pub_key_cred_params
            ],
            "timeout": options.timeout,
            "excludeCredentials": [
                {"type": "public-key", "id": bytes_to_base64url(c.id)} for c in exclude_credentials
            ],
            "authenticatorSelection": {
                "residentKey": enum_val(options.authenticator_selection.resident_key),
                "userVerification": enum_val(options.authenticator_selection.user_verification),
            },
            "attestation": enum_val(options.attestation),
        }

    def verify_passkey_registration(
        self, user: User, credential: dict, friendly_name: Optional[str] = None
    ) -> PasskeyInfo:
        conn = db()
        challenge = self._challenges.pop(user.id, None)
        if not challenge:
            raise ValueError("No registration challenge found")

        # Build credential response for verification
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=settings.webauthn_rp_id,
            expected_origin=settings.webauthn_origin,
        )

        cred_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        # Helper to get value from enum or return string as-is
        def enum_val(v):
            return v.value if hasattr(v, "value") else v

        # Helper to convert aaguid to string (may be bytes or already string)
        def aaguid_to_str(v):
            if v is None:
                return None
            if isinstance(v, bytes):
                return bytes_to_base64url(v)
            return str(v)

        # Store passkey credential
        transports_json = json.dumps(credential.get("response", {}).get("transports", []))
        device_type = (
            enum_val(verification.credential_device_type)
            if verification.credential_device_type
            else None
        )

        conn.execute(
            """
            INSERT INTO v1.passkey_credentials (
                id, user_id, credential_id, public_key, sign_count,
                device_type, backed_up, transports, aaguid, friendly_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                cred_id,
                user.id,
                verification.credential_id,
                verification.credential_public_key,
                verification.sign_count,
                device_type,
                verification.credential_backed_up,
                transports_json,
                aaguid_to_str(verification.aaguid),
                friendly_name,
                now,
            ],
        )

        return PasskeyInfo(
            id=cred_id,
            friendly_name=friendly_name,
            device_type=device_type,
            backed_up=verification.credential_backed_up,
            created_at=now,
            last_used_at=None,
        )

    def generate_passkey_authentication_options(self, email: Optional[str] = None) -> dict:
        conn = db()
        allow_credentials = []

        if email:
            user = self.get_user_by_email(email)
            if user:
                creds = conn.execute(
                    """
                    SELECT credential_id, transports
                    FROM v1.passkey_credentials WHERE user_id = ?
                    """,
                    [user.id],
                ).fetchall()

                for row in creds:
                    transports = json.loads(row[1]) if row[1] else []
                    allow_credentials.append(
                        PublicKeyCredentialDescriptor(id=row[0], transports=transports)
                    )

        options = generate_authentication_options(
            rp_id=settings.webauthn_rp_id,
            allow_credentials=allow_credentials if allow_credentials else None,
            user_verification=UserVerificationRequirement.PREFERRED,
        )

        # Store challenge using a temporary key
        challenge_key = secrets.token_urlsafe(16)
        self._challenges[challenge_key] = options.challenge

        # Helper to get value from enum or return string as-is
        def enum_val(v):
            return v.value if hasattr(v, "value") else v

        result = {
            "challenge": bytes_to_base64url(options.challenge),
            "timeout": options.timeout,
            "rpId": settings.webauthn_rp_id,
            "userVerification": enum_val(options.user_verification),
            "_challenge_key": challenge_key,
        }

        if allow_credentials:
            result["allowCredentials"] = [
                {
                    "type": "public-key",
                    "id": bytes_to_base64url(c.id),
                    "transports": c.transports,
                }
                for c in allow_credentials
            ]

        return result

    def verify_passkey_authentication(self, credential: dict, challenge_key: str) -> User:
        conn = db()
        challenge = self._challenges.pop(challenge_key, None)
        if not challenge:
            raise ValueError("No authentication challenge found")

        # Get the credential from DB
        raw_id = base64url_to_bytes(credential["rawId"])
        db_cred = conn.execute(
            """
            SELECT pc.id, pc.user_id, pc.public_key, pc.sign_count
            FROM v1.passkey_credentials pc
            WHERE pc.credential_id = ?
            """,
            [raw_id],
        ).fetchone()

        if not db_cred:
            raise ValueError("Credential not found")

        cred_id, user_id, public_key, current_sign_count = db_cred

        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=settings.webauthn_rp_id,
            expected_origin=settings.webauthn_origin,
            credential_public_key=public_key,
            credential_current_sign_count=current_sign_count,
        )

        # Update sign count and last used
        now = datetime.now(timezone.utc)
        conn.execute(
            "UPDATE v1.passkey_credentials SET sign_count = ?, last_used_at = ? WHERE id = ?",
            [verification.new_sign_count, now, cred_id],
        )

        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        return user

    def list_user_passkeys(self, user_id: str) -> list[PasskeyInfo]:
        conn = db()
        results = conn.execute(
            """
            SELECT id, friendly_name, device_type, backed_up, created_at, last_used_at
            FROM v1.passkey_credentials
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            [user_id],
        ).fetchall()

        return [
            PasskeyInfo(
                id=row[0],
                friendly_name=row[1],
                device_type=row[2],
                backed_up=row[3],
                created_at=row[4],
                last_used_at=row[5],
            )
            for row in results
        ]

    def delete_passkey(self, user_id: str, passkey_id: str) -> bool:
        conn = db()
        result = conn.execute(
            "DELETE FROM v1.passkey_credentials WHERE id = ? AND user_id = ?",
            [passkey_id, user_id],
        )
        return result.rowcount > 0

    # JWT management
    def create_tokens(self, user: User) -> tuple[str, str, int]:
        now = datetime.now(timezone.utc)
        access_expires = now + timedelta(minutes=settings.jwt_access_token_expire_minutes)
        refresh_expires = now + timedelta(days=settings.jwt_refresh_token_expire_days)

        access_payload = {
            "sub": user.id,
            "email": user.email,
            "type": "access",
            "exp": access_expires,
            "iat": now,
        }

        refresh_payload = {
            "sub": user.id,
            "type": "refresh",
            "exp": refresh_expires,
            "iat": now,
            "jti": str(uuid.uuid4()),
        }

        access_token = jwt.encode(
            access_payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
        )
        refresh_token = jwt.encode(
            refresh_payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
        )

        # Store refresh token hash
        conn = db()
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        token_id = str(uuid.uuid4())

        conn.execute(
            """
            INSERT INTO v1.refresh_tokens (id, user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            [token_id, user.id, token_hash, refresh_expires, now],
        )

        return access_token, refresh_token, settings.jwt_access_token_expire_minutes * 60

    def verify_access_token(self, token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(
                token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
            )
            if payload.get("type") != "access":
                return None
            return payload
        except jwt.PyJWTError:
            return None

    def refresh_tokens(self, refresh_token: str) -> Optional[tuple[str, str, int]]:
        try:
            payload = jwt.decode(
                refresh_token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
            )

            if payload.get("type") != "refresh":
                return None

            # Verify token exists and is not revoked
            conn = db()
            token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
            result = conn.execute(
                "SELECT id, revoked FROM v1.refresh_tokens WHERE token_hash = ?",
                [token_hash],
            ).fetchone()

            if not result or result[1]:
                return None

            # Revoke old token
            conn.execute("UPDATE v1.refresh_tokens SET revoked = TRUE WHERE id = ?", [result[0]])

            # Get user and create new tokens
            user = self.get_user_by_id(payload["sub"])
            if not user or not user.is_active:
                return None

            return self.create_tokens(user)

        except jwt.PyJWTError:
            return None

    def revoke_refresh_token(self, refresh_token: str) -> bool:
        conn = db()
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        result = conn.execute(
            "UPDATE v1.refresh_tokens SET revoked = TRUE WHERE token_hash = ? AND revoked = FALSE",
            [token_hash],
        )
        return result.rowcount > 0

    def revoke_all_user_tokens(self, user_id: str) -> int:
        conn = db()
        result = conn.execute(
            "UPDATE v1.refresh_tokens SET revoked = TRUE WHERE user_id = ? AND revoked = FALSE",
            [user_id],
        )
        return result.rowcount
