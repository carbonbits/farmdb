"""
Migration runner for DuckDB.

Handles discovering, tracking, and applying migrations.
"""

import importlib.util
from datetime import datetime
from pathlib import Path
from types import ModuleType

import duckdb
import typer


def get_migrations_dir() -> Path:
    """Get the migrations directory path."""
    # Navigate from src/core/storage/migrations to src/migrations
    return Path(__file__).parent.parent.parent.parent / "migrations"


def ensure_migrations_table(conn: duckdb.DuckDBPyConnection) -> None:
    """Create the migrations tracking table if it doesn't exist."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS _migrations (
            name VARCHAR PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)


def get_applied_migrations(conn: duckdb.DuckDBPyConnection) -> set[str]:
    """Get the set of already-applied migration names."""
    result = conn.execute("SELECT name FROM _migrations").fetchall()
    return {row[0] for row in result}


def discover_migrations() -> list[tuple[str, Path]]:
    """
    Discover all migration files in the migrations directory.

    Returns a sorted list of (migration_name, file_path) tuples.
    """
    migrations_dir = get_migrations_dir()
    if not migrations_dir.exists():
        return []

    migrations = []
    for filepath in migrations_dir.glob("[0-9][0-9][0-9][0-9]_*.py"):
        if filepath.name == "__init__.py":
            continue
        migrations.append((filepath.stem, filepath))

    # Sort by filename (which starts with sequence number)
    migrations.sort(key=lambda x: x[0])
    return migrations


def load_migration(filepath: Path) -> ModuleType:
    """Load and return a migration module (must expose an up() function)."""
    spec = importlib.util.spec_from_file_location(filepath.stem, filepath)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load migration: {filepath}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    if not hasattr(module, "up"):
        raise AttributeError(f"Migration {filepath.stem} is missing up() function")

    return module


def apply_migrations(conn: duckdb.DuckDBPyConnection) -> int:
    """
    Apply all pending migrations.

    Returns the number of migrations applied.
    """
    ensure_migrations_table(conn)

    applied = get_applied_migrations(conn)
    all_migrations = discover_migrations()

    # Filter to only pending migrations
    pending = [(name, path) for name, path in all_migrations if name not in applied]

    if not pending:
        return 0

    applied_count = 0
    for name, filepath in pending:
        typer.echo(f"  Applying {name}...", nl=False)

        try:
            # Load and execute migration
            module = load_migration(filepath)
            up_func = module.up

            # Migrations are atomic by default. A migration may set `atomic = False`
            # for DDL that DuckDB cannot perform inside a transaction (e.g. dropping
            # a column whose dependent indexes must be dropped first).
            atomic = getattr(module, "atomic", True)

            if atomic:
                conn.begin()
                try:
                    up_func(conn)
                    conn.execute(
                        "INSERT INTO _migrations (name, applied_at) VALUES (?, ?)",
                        [name, datetime.now()],
                    )
                    conn.commit()
                except Exception:
                    conn.rollback()
                    raise
            else:
                # Statements auto-commit individually; a mid-migration failure may
                # leave the migration partially applied and unrecorded.
                up_func(conn)
                conn.execute(
                    "INSERT INTO _migrations (name, applied_at) VALUES (?, ?)",
                    [name, datetime.now()],
                )

            typer.echo(" ✓")
            applied_count += 1

        except Exception as e:
            typer.echo(" ✗")
            typer.echo(f"    Error: {e}", err=True)
            raise

    return applied_count
