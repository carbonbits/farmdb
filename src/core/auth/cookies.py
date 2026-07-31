"""
Auth cookie helpers.

The web client keeps using bearer tokens; cookies are issued alongside so the
same token can travel as an httpOnly cookie (read by the PrincipalResolver). The
cookie is httpOnly + SameSite=Lax, and Secure in production.
"""

from __future__ import annotations

from fastapi import Response

from config.settings import Environment, settings

ACCESS_COOKIE_NAME = "farmdb_access_token"


def set_access_cookie(response: Response, token: str, max_age: int) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.environment == Environment.PROD,
        samesite="lax",
        path="/",
    )


def clear_access_cookie(response: Response) -> None:
    response.delete_cookie(key=ACCESS_COOKIE_NAME, path="/")
