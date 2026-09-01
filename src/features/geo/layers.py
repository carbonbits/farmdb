"""
The map layers this open-source build knows about.

A layer is a named group of shapes that share one geometry class and the
permissions that guard them. Keeping the list in one place means the handlers
never hard-code a layer name or a permission key; they look it up here.

Every layer today is guarded by the fields/mapping permissions
(fields.view, fields.edit, fields.delete). Those catalog keys read as
"View fields, maps and boundaries" and "Draw and edit field boundaries", so
they cover map editing as a whole for now. When a layer needs its own finer
permissions later, only this file changes; the handlers stay the same.

seasonal says whether a layer's shapes belong to a growing season. Cropping
layers are seasonal; permanent things like field boundaries and infrastructure
are not. Season-less layers ignore any season filter passed to them.

Only layers that belong to a single self-hosted farm live here. Anything that
belongs to the enterprise edition, for example IoT sensor telemetry, is left
out on purpose and added on the ee side instead.
"""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException, status


@dataclass(frozen=True)
class Layer:
    """One map layer: its geometry class, whether it is seasonal, and its guards."""

    geometry_type: str  # matches ST_GeometryType: POLYGON, POINT, LINESTRING
    seasonal: bool
    view: str
    edit: str
    delete: str


# Single source of truth. geometry_type holds the exact string ST_GeometryType
# returns, so the write-time class check compares like for like. Every layer
# here is season-less for now; a seasonal cropping layer can be added later
# without touching the handlers.
LAYERS: dict[str, Layer] = {
    "fields": Layer("POLYGON", False, "fields.view", "fields.edit", "fields.delete"),
    "infrastructure": Layer(
        "LINESTRING", False, "fields.view", "fields.edit", "fields.delete"
    ),
    "markers": Layer("POINT", False, "fields.view", "fields.edit", "fields.delete"),
}


def get_layer(name: str) -> Layer:
    """Return the layer, or raise 400 if it is not one we know.

    Fail closed: an unknown layer is rejected before any read or write, so a
    caller can never reach data or a permission decision through a layer we do
    not recognise.
    """
    layer = LAYERS.get(name)
    if layer is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown layer: {name}",
        )
    return layer