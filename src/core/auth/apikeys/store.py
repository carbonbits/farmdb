"""
Open-core API key store: DuckDB-backed, sha256-hashed keys.
"""

from __future__ import annotations

import hashlib
import secrets
from typing import Optional

from ulid import ULID
from wireup import injectable

from core.auth.apikeys.base import (
    API_KEY_PREFIX,
    ApiKeyInfo,
    ApiKeyStore,
    GeneratedApiKey,
)
from core.storage.database import db


def _generate_key() -> tuple[str, str, str]:
    """Return (plaintext, prefix, key_hash) for a fresh key."""
    plaintext = f"{API_KEY_PREFIX}{secrets.token_urlsafe(32)}"
    prefix = plaintext[:10]
    key_hash = hashlib.sha256(plaintext.encode()).hexdigest()
    return plaintext, prefix, key_hash


@injectable(as_type=ApiKeyStore)
class DuckDBApiKeyStore(ApiKeyStore):
    def create(self, user_id: str, name: str) -> GeneratedApiKey:
        plaintext, prefix, key_hash = _generate_key()
        key_id = str(ULID())

        db().execute(
            """
            INSERT INTO v1.api_keys (id, user_id, name, prefix, key_hash)
            VALUES (?, ?, ?, ?, ?)
            """,
            [key_id, user_id, name, prefix, key_hash],
        )

        return GeneratedApiKey(key=plaintext, info=self._fetch(key_id))

    def verify(self, plaintext: str) -> Optional[str]:
        key_hash = hashlib.sha256(plaintext.encode()).hexdigest()
        row = (
            db()
            .execute(
                "SELECT id, user_id, revoked FROM v1.api_keys WHERE key_hash = ?",
                [key_hash],
            )
            .fetchone()
        )

        if not row or row[2]:
            return None

        db().execute("UPDATE v1.api_keys SET last_used_at = now() WHERE id = ?", [row[0]])
        return row[1]

    def list_for_user(self, user_id: str) -> list[ApiKeyInfo]:
        rows = (
            db()
            .execute(
                """
            SELECT id, name, prefix, created_at, last_used_at, revoked
            FROM v1.api_keys
            WHERE user_id = ?
            ORDER BY created_at
            """,
                [user_id],
            )
            .fetchall()
        )
        return [self._row_to_info(row) for row in rows]

    def revoke(self, user_id: str, key_id: str) -> bool:
        row = (
            db()
            .execute(
                """
            UPDATE v1.api_keys SET revoked = TRUE
            WHERE id = ? AND user_id = ? AND NOT revoked
            RETURNING id
            """,
                [key_id, user_id],
            )
            .fetchone()
        )
        return row is not None

    def _fetch(self, key_id: str) -> ApiKeyInfo:
        row = (
            db()
            .execute(
                """
            SELECT id, name, prefix, created_at, last_used_at, revoked
            FROM v1.api_keys WHERE id = ?
            """,
                [key_id],
            )
            .fetchone()
        )
        return self._row_to_info(row)

    @staticmethod
    def _row_to_info(row) -> ApiKeyInfo:
        return ApiKeyInfo(
            id=row[0],
            name=row[1],
            prefix=row[2],
            created_at=row[3],
            last_used_at=row[4],
            revoked=row[5],
        )
