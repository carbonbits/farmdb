#!/bin/sh
set -e

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

uv run --frozen --no-dev farmdb migration apply
exec uv run --frozen --no-dev src/main.py
