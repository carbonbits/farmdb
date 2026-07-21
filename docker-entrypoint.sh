#!/bin/sh
set -e

uv run --frozen --no-dev farmdb migration apply
exec uv run --frozen --no-dev src/main.py
