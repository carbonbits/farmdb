"""
Errors raised by core.geo.

core.geo is called from HTTP handlers, CLI commands and one day a migration
backfill, so it raises plain exceptions and never an HTTPException. Each one
names a kind from core.errors, which is how the API edge knows what to answer
without core.geo knowing there is an edge; GeoError stays the base so a caller
can still catch everything geospatial in one except.

An unknown layer is a NotFound rather than the Invalid the old flat routes
answered: under /v1/maps the collection is part of the path, so asking for one
that does not exist is asking for a resource that is not there.

Not every renderer wants status codes — the WMS endpoint answers the same
failures as an OGC ServiceExceptionReport — which is why the kind is a
classification and not a status code stored on the class.
"""

from __future__ import annotations

from core.errors import DomainError, Invalid, NotFound


class GeoError(DomainError):
    """Base for everything core.geo raises."""


class UnknownLayer(GeoError, NotFound):
    """A layer name that is not in the registry."""

    def __init__(self, name: str) -> None:
        self.name = name
        super().__init__(f"Unknown layer: {name}")


class FeatureNotFound(GeoError, NotFound):
    """No geospatial row with this id."""

    def __init__(self, feature_id: str) -> None:
        self.feature_id = feature_id
        super().__init__(f"Feature not found: {feature_id}")


class InvalidGeometry(GeoError, Invalid):
    """The geometry could not be read, or is not what the layer expects."""
