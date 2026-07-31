"""
The authenticated principal — who is making a request, independent of how they
authenticated (bearer token, session cookie, or API key).
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Principal:
    user_id: str
    email: str
    auth_method: str  # "bearer" | "cookie" | "api_key"
