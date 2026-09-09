"""
The vocabulary services raise in, and the API edge answers.

Services are called from HTTP handlers, CLI commands and migrations alike, so
they raise plain exceptions and never an HTTPException. The meaning travels with
the error rather than a per-feature status table: a service raises the kind of
failure it had, utils.errors renders any of them once for the whole app, and a
feature subclasses a kind to say something more specific (see core.geo.errors)
without registering anything.

The kinds are deliberately few — the distinctions a caller can act on, not a
catalogue. Anything finer belongs in the message or a subclass attribute.
"""

from __future__ import annotations


class DomainError(Exception):
    """
    Base for errors a service raises for its caller to render.

    Raising this directly says nothing about what went wrong, so the edge has no
    status code for it and answers 500. Raise one of the kinds below.
    """


class Invalid(DomainError):
    """The request is malformed, or asks for something that cannot be done."""


class Unauthenticated(DomainError):
    """The caller has not proven who they are."""


class PermissionDenied(DomainError):
    """The caller is known, and is not allowed to do this."""


class NotFound(DomainError):
    """The thing addressed does not exist."""


class Conflict(DomainError):
    """The request is valid, but the current state will not accept it."""
