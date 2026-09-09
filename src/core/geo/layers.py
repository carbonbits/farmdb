"""
The map layers this build knows about.

A layer is a named group of shapes that share one geometry class, whether they
belong to a growing season, and the permissions that guard them. Route handlers
never hard-code a layer name or a permission key; they look it up here.

The registry is open on purpose. Only the layers that belong to a single
self-hosted farm are registered below; anything that belongs to the enterprise
edition, for example IoT sensor telemetry, calls register() from the ee side
instead of editing a dict that open core owns.

title and description are carried on the layer because two API surfaces need
them: the OGC collections document and the WMS capabilities document both
describe layers to a client that has never seen this farm before.

The view/edit/delete permission keys live here even though core.geo never
enforces them — core does not know who is asking. Keeping them on the layer
means the items routes, the tile route and the WMS capabilities document all
read one source of truth, and enforcement stays at the edge.

seasonal says whether a layer's shapes belong to a growing season. Cropping
layers are seasonal; permanent things like field boundaries and infrastructure
are not. Season-less layers ignore any season filter passed to them.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from core.geo.errors import UnknownLayer
from core.geo.handler import GeoHandler


class Layer(BaseModel):
    """One map layer, as both the store and the API surfaces see it.

    Frozen because a registered layer is a declaration, not state: handing the
    same instance to the OGC document builder, the WMS builder and the store is
    only safe if none of them can reshape it.
    """

    model_config = ConfigDict(frozen=True)

    name: str
    title: str
    description: str
    # The exact string ST_GeometryType returns, so the write-time class check
    # compares like for like: POLYGON, POINT, LINESTRING.
    geometry_type: str
    seasonal: bool
    view: str
    edit: str
    delete: str


_REGISTRY: dict[str, Layer] = {}


class LayerHandler(GeoHandler):
    """The registry, as GeospatialService reaches it: `geo.layers`.

    The one handler that needs no connection — the registry is in memory — so it
    is constructed without one.

    Every handler is a view onto one process-wide registry rather than the owner
    of a registry of its own, because registration happens at import time — the
    open-core layers at the foot of this module, the enterprise ones from the ee
    side — long before any service exists to hold it.

    That is also why the module-level functions below stay: an import-time
    register() call and a document builder with no service in hand both need the
    registry without going through a service. They are the same three calls.
    """

    @property
    def handler_signature(self) -> str:
        return "geo_layers"

    def register(self, layer: Layer) -> Layer:
        """Add a layer, replacing any layer registered under its name."""
        _REGISTRY[layer.name] = layer

        return layer

    def get(self, name: str) -> Layer:
        """Return the layer, or raise UnknownLayer.

        Fail closed: an unknown layer is rejected before any read, write or
        permission decision, so a caller can never reach data through a layer we
        do not recognise.
        """
        layer = _REGISTRY.get(name)

        if layer is None:
            raise UnknownLayer(name)

        return layer

    def all(self) -> tuple[Layer, ...]:
        """Every registered layer, in registration order."""
        return tuple(_REGISTRY.values())


layers = LayerHandler()


def register(layer: Layer) -> Layer:
    """Add a layer to the registry, replacing any layer registered under its name."""
    return layers.register(layer)


def get_layer(name: str) -> Layer:
    """Return the layer, or raise UnknownLayer."""
    return layers.get(name)


def all_layers() -> tuple[Layer, ...]:
    """Every registered layer, in registration order."""
    return layers.all()


# The open-core layers. Every one is season-less for now, and guarded by the
# fields/mapping permissions: those catalog keys read as "View fields, maps and
# boundaries" and "Draw and edit field boundaries", so they cover map editing as
# a whole. When a layer needs finer permissions later, only its entry changes.
register(
    Layer(
        name="fields",
        title="Fields",
        description="Field boundaries.",
        geometry_type="POLYGON",
        seasonal=False,
        view="fields.view",
        edit="fields.edit",
        delete="fields.delete",
    )
)
register(
    Layer(
        name="infrastructure",
        title="Infrastructure",
        description="Fences, pipes, tracks and other linear infrastructure.",
        geometry_type="LINESTRING",
        seasonal=False,
        view="fields.view",
        edit="fields.edit",
        delete="fields.delete",
    )
)
register(
    Layer(
        name="markers",
        title="Markers",
        description="Points of interest: gates, water points, buildings.",
        geometry_type="POINT",
        seasonal=False,
        view="fields.view",
        edit="fields.edit",
        delete="fields.delete",
    )
)
