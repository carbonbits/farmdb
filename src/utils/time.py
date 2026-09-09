"""
Clock helpers.

One definition of "now" for the whole app. Models take it as a
`default_factory` and services call it directly, so every timestamp we write is
timezone-aware UTC rather than whatever the host's local zone happens to be.
"""

from __future__ import annotations

from datetime import datetime, timezone


def now_utc() -> datetime:
    """Return the current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)
