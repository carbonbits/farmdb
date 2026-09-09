"""
Geometry parsing and validation.

Validation runs before a write, so a bad shape never reaches the table. The
storage CRS this validates against comes from GeoHandler, which every core.geo
handler extends.

The handler holds the connection it validates on, so a caller never passes one
in. GeospatialService builds it and exposes it as `geo.geometry`; that is the
way to reach validation, and nothing outside core.geo constructs one directly.
"""

from __future__ import annotations

import json
from typing import Any

import duckdb

from core.geo.errors import InvalidGeometry
from core.geo.handler import GeoHandler


class GeometryHandler(GeoHandler):
    """Reads GeoJSON the way the database reads it, and refuses the rest."""

    @property
    def handler_signature(self) -> str:
        return "geo_geometry"

    def validate(self, geometry: dict[str, Any], expected_type: str) -> str:
        """Return the geometry as JSON text, or raise InvalidGeometry.

        DuckDB does the reading, so we accept exactly what ST_GeomFromGeoJSON
        accepts rather than keeping a second opinion about GeoJSON in Python.
        """
        geometry_json = json.dumps(geometry)

        try:
            geometry_type, is_valid = self._conn.execute(
                "SELECT ST_GeometryType(ST_GeomFromGeoJSON(?)), "
                "ST_IsValid(ST_GeomFromGeoJSON(?))",
                [geometry_json, geometry_json],
            ).fetchone()
        except duckdb.Error as exc:
            raise InvalidGeometry("Could not read geometry as GeoJSON.") from exc

        if geometry_type != expected_type:
            raise InvalidGeometry(
                f"Layer expects {expected_type} geometry, got {geometry_type}."
            )

        if not is_valid:
            raise InvalidGeometry(
                "Geometry is not valid, for example a self-intersecting polygon."
            )

        return geometry_json
