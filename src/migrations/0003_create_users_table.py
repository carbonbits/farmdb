"""
Migration: create_users_table
Creates authentication-related tables: users, password_credentials, passkey_credentials, refresh_tokens
"""
import duckdb


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    # Users table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            display_name TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Password credentials table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.password_credentials (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES v1.users(id),
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id)
        )
    """)

    # Passkey credentials table (WebAuthn)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.passkey_credentials (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES v1.users(id),
            credential_id BLOB NOT NULL UNIQUE,
            public_key BLOB NOT NULL,
            sign_count INTEGER DEFAULT 0,
            device_type TEXT,
            backed_up BOOLEAN DEFAULT FALSE,
            transports TEXT,
            aaguid TEXT,
            friendly_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP
        )
    """)

    # Refresh tokens table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS v1.refresh_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES v1.users(id),
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            revoked BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP
        )
    """)

    # Create indexes for efficient lookups
    conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON v1.users(email)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_password_credentials_user_id ON v1.password_credentials(user_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id ON v1.passkey_credentials(user_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_passkey_credentials_credential_id ON v1.passkey_credentials(credential_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON v1.refresh_tokens(user_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON v1.refresh_tokens(token_hash)")
