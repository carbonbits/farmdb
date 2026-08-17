from typing import Optional

import duckdb

from config.settings import settings


class DB:
    _instance: Optional[duckdb.DuckDBPyConnection] = None

    @classmethod
    def connect(cls):
        if cls._instance is None:
            cls._instance = duckdb.connect(settings.database_path)

    @classmethod
    def disconnect(cls):
        if cls._instance:
            cls._instance.close()
            cls._instance = None

    @classmethod
    def get_connection(cls) -> duckdb.DuckDBPyConnection:
        if cls._instance is None:
            raise RuntimeError("Database is not connected. Call connect() first.")
        return cls._instance

    @classmethod
    def _initialize_database(cls):
        pass


def db() -> duckdb.DuckDBPyConnection:
    """
    Returns a fresh cursor over the shared database.

    DuckDB's own connection object is not safe for concurrent use, so each
    caller gets an independent cursor (a separate connection to the same
    database). DuckDB then manages concurrency at the database level — reads
    run in parallel, writes are serialized — instead of multiple requests
    corrupting one another's results on a single shared connection.
    """
    return DB.get_connection().cursor()
