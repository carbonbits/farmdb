"""
Migration: geospatial_layer_registry

Moves the map layer registry out of Python and into the database, and replaces
the two catch-all layers with named ones.

Until now the layers lived in a module-level dict in core/geo/layers.py, filled
by register() calls at import time. That made the set of layers a property of
the build rather than of the farm: an install could not add a layer without a
code change, and the registry vanished with the process that held it. It is now
v1.geospatial_layers, seeded here — the shapes in v1.geospatial reference these
names, so the two belong in the same database.

The seeded set names things instead of categories. "infrastructure" (lines) and
"markers" (points) each stood for several unrelated kinds of thing, which meant
a client could not ask for the fences without also getting pipes and tracks, and
a permission on either granted more than anyone intended:

    infrastructure  -> fences   (LINESTRING)
    markers         -> gates    (POINT)

and three polygon layers join fields, from the farm builder's own palette:
paddocks, structures, water.

Two other things this seed encodes:

  * farm is the base layer — the outline everything else sits inside. The
    authoritative outline is the shape whose id is in v1.configuration under
    farmGeometryId; this layer is where that shape lives.
  * contained_in points the four ground layers at farm, which is what lets the
    store refuse a field drawn outside the farm.

Editing any shape answers to fields.geometry, a permission 0016 adds. Rows
carry the permission keys as plain text and nothing here checks them against
v1.permissions: the catalog is seeded by its own migrations, and a layer naming
a key that does not exist yet fails closed at the edge, which is the safe
direction.

Existing rows in v1.geospatial that were written under the old layer names are
renamed to match, so no shape is orphaned.

Runs non-atomically: DuckDB commits DDL on its own, so CREATE TABLE cannot sit
inside the runner's transaction. Every statement is written to be safe to run
again.
"""

import duckdb

atomic = False

# (name, title, description, geometry_type, seasonal, view, edit, delete,
#  contained_in)
LAYERS = [
    (
        "farm",
        "Farm outline",
        "The outer edge of this farm. Everything else is a subdivision of it.",
        "POLYGON",
        False,
        "fields.view",
        "fields.geometry",
        "fields.geometry",
        None,
    ),
    (
        "fields",
        "Fields",
        "Cropping ground, as boundaries.",
        "POLYGON",
        False,
        "fields.view",
        "fields.geometry",
        "fields.geometry",
        "farm",
    ),
    (
        "paddocks",
        "Paddocks",
        "Grazing ground, for rotation and stocking rates.",
        "POLYGON",
        False,
        # The one layer whose view key is not fields.view, and the reason these
        # keys sit per layer: a paddock is livestock ground, so who may look at
        # it is the livestock module's business. Mapping it is still mapping.
        "livestock.view",
        "fields.geometry",
        "fields.geometry",
        "farm",
    ),
    (
        "structures",
        "Structures",
        "Barns, stores, sheds and yards, as their footprint.",
        "POLYGON",
        False,
        "fields.view",
        "fields.geometry",
        "fields.geometry",
        "farm",
    ),
    (
        "water",
        "Water",
        "Dams, ponds and tanks, as the area they cover.",
        "POLYGON",
        False,
        "fields.view",
        "fields.geometry",
        "fields.geometry",
        "farm",
    ),
    (
        "fences",
        "Fences",
        "Fence lines, internal and boundary.",
        "LINESTRING",
        False,
        "fields.view",
        "fields.geometry",
        "fields.geometry",
        # Deliberately not contained: containment is an area rule, and a
        # boundary fence runs along the outline rather than inside it.
        None,
    ),
    (
        "gates",
        "Gates",
        "Gates and gaps, where stock and vehicles cross a fence.",
        "POINT",
        False,
        "fields.view",
        "fields.geometry",
        "fields.geometry",
        None,
    ),
]

# Shapes already stored under a catch-all name move to the named layer that
# replaced it.
RENAMED = [("infrastructure", "fences"), ("markers", "gates")]


def up(conn: duckdb.DuckDBPyConnection) -> None:
    """Apply the migration."""
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS v1.geospatial_layers (
            name TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            geometry_type TEXT NOT NULL,
            seasonal BOOLEAN NOT NULL DEFAULT FALSE,
            view_permission TEXT NOT NULL,
            edit_permission TEXT NOT NULL,
            delete_permission TEXT NOT NULL,
            contained_in TEXT,
            position INTEGER NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    """
    )

    # Seeded in list order, which is the order the collections and capabilities
    # documents list them in: the farm first, then the ground inside it.
    for position, layer in enumerate(LAYERS, start=1):
        (
            name,
            title,
            description,
            geometry_type,
            seasonal,
            view,
            edit,
            delete,
            contained_in,
        ) = layer

        conn.execute(
            """
            INSERT INTO v1.geospatial_layers
                (name, title, description, geometry_type, seasonal,
                 view_permission, edit_permission, delete_permission,
                 contained_in, position)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (name) DO UPDATE SET
                title = excluded.title,
                description = excluded.description,
                geometry_type = excluded.geometry_type,
                seasonal = excluded.seasonal,
                view_permission = excluded.view_permission,
                edit_permission = excluded.edit_permission,
                delete_permission = excluded.delete_permission,
                contained_in = excluded.contained_in,
                position = excluded.position,
                updated_at = now()
            """,
            [
                name,
                title,
                description,
                geometry_type,
                seasonal,
                view,
                edit,
                delete,
                contained_in,
                position,
            ],
        )

    for old, new in RENAMED:
        conn.execute(
            "UPDATE v1.geospatial SET layer = ?, feature_type = ? WHERE layer = ?",
            [new, new, old],
        )
