"""
createField handler.

Transport-agnostic business logic, called by the REST router. Persists a field
scoped to the authenticated user, together with its boundary when one is given,
and returns the canonical model.

A field and its boundary are one thing to the person drawing it and two rows
here: the record in v1.fields, and a POLYGON in the geo store's `fields` layer
tagged with `field_id` so the two can be found from each other. Doing both in
one call is what keeps a drawn field from ever existing as a shape nobody owns.

Two permissions, because two things happen. The route gates on `fields.edit`,
which covers the record. A boundary is a second right — moving an edge reprices
every per-hectare figure derived from it — so when geometry is in the body this
also requires whatever the `fields` layer declares for editing, which is
`fields.geometry`. Reading the key off the layer rather than naming it here
keeps this handler and the map's own item routes gated by the same decision;
see core/geo/layers.py.
"""

from typing import Optional

import duckdb
from ulid import ULID

from core.authz.service import AuthzService
from core.geo.service import GeospatialService
from features.field.handlers.create.input import CreateFarmFieldInput
from features.field.models.field import FarmField
from features.field.queries import read_field
from features.geo.permissions import ensure_permission

LAYER = "fields"


async def create_field(
    input_: CreateFarmFieldInput,
    conn: duckdb.DuckDBPyConnection,
    user_id: str,
    authz: AuthzService,
    geo: Optional[GeospatialService] = None,
) -> FarmField:
    field_id = str(ULID())
    geo = geo or GeospatialService(conn=conn)

    if input_.geometry is not None:
        layer = geo.layers.get(LAYER)

        # Checked before the field row exists, so a caller who may name a field
        # but not draw one gets a 403 with nothing written — not a field that
        # quietly saved without the boundary they asked for.
        await ensure_permission(authz, user_id, layer.edit)

        # Same reasoning for the shape itself: a malformed polygon, or one
        # outside the farm outline, is a 400 before anything lands. The window
        # that remains — the shape failing after the row is written — leaves a
        # field with no boundary, a state the model already allows and the UI
        # can fix by drawing again.
        geometry_json = geo.geometry.validate(input_.geometry, layer.geometry_type)
        geo.ensure_contained(layer, geometry_json)

    conn.execute(
        """
        INSERT INTO v1.fields (id, name, description, user_id)
        VALUES (?, ?, ?, ?)
        """,
        [field_id, input_.name, input_.description, user_id],
    )

    if input_.geometry is not None:
        # The tag is the only link between the two rows. The name is not copied
        # across with it: a field is named in one place, so renaming one cannot
        # leave a stale label on its shape.
        geo.create(
            layer=LAYER,
            geometry=input_.geometry,
            properties={"field_id": field_id, "name": input_.name},
            created_by=user_id,
        )

    return read_field(conn, field_id)
