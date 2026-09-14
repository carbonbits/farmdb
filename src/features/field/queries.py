"""
How a field is read back, in one place.

A field's boundary is not a column on its row: it is a shape in the geo store's
`fields` layer, tagged with the field it belongs to. So reading a field means
reading the row and looking for that shape, which both the create and the list
handler do — hence one projection here rather than the same left join written
twice and drifting apart.

The join reads the tag out of the shape's properties JSON. Area comes from
ST_Area_Spheroid, which measures on the ellipsoid rather than treating degrees
as a flat grid: a farm's hectares should not change with its latitude. It
answers in square metres, so the query divides by 10,000 on the way out.

Note the ST_FlipCoordinates around the geometry. DuckDB's spheroid functions
read their input as (latitude, longitude), while everything stored here is
CRS84 — longitude first, the order GeoJSON uses and therefore the order this
API speaks (see config.settings.geo_crs). Measuring without the flip silently
answers as though each field sat at the latitude of its own longitude: a 123 ha
block near Nairobi reports 99 ha, and the error grows the further from the
equator the farm is.
"""

import json
from typing import Any, Optional

import duckdb

from features.field.models.field import FarmField

# Selected in this order by every read, so a row maps straight onto a FarmField.
COLUMNS = """
    f.id,
    f.name,
    f.description,
    ST_AsGeoJSON(g.geometry),
    ST_Area_Spheroid(ST_FlipCoordinates(g.geometry)) / 10000
"""

FROM_FIELDS = """
    FROM v1.fields f
    LEFT JOIN v1.geospatial g
      ON g.layer = 'fields'
     AND json_extract_string(g.properties, '$.field_id') = f.id
"""


def field_from_row(row: tuple) -> FarmField:
    """Build a field from a row projected by COLUMNS.

    ST_AsGeoJSON hands back a string, and both it and the area are NULL for a
    field nobody has mapped yet, which is why each is parsed only when present.
    """
    geometry: Optional[dict[str, Any]] = None
    if row[3] is not None:
        geometry = json.loads(row[3])

    return FarmField(
        id=row[0],
        name=row[1],
        description=row[2],
        geometry=geometry,
        area_ha=round(row[4], 4) if row[4] is not None else None,
    )


def read_field(conn: duckdb.DuckDBPyConnection, field_id: str) -> FarmField:
    """One field with its boundary."""
    row = conn.execute(
        f"SELECT {COLUMNS} {FROM_FIELDS} WHERE f.id = ?", [field_id]
    ).fetchone()

    return field_from_row(row)


def read_fields(conn: duckdb.DuckDBPyConnection, user_id: str) -> list[FarmField]:
    """Every field a user owns, oldest first, each with its boundary."""
    rows = conn.execute(
        f"SELECT {COLUMNS} {FROM_FIELDS} WHERE f.user_id = ? ORDER BY f.created_at",
        [user_id],
    ).fetchall()

    return [field_from_row(row) for row in rows]
