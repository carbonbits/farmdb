"""
The map layers this farm knows about, kept in the database.

A layer is a named group of shapes that share one geometry class, whether they
belong to a growing season, and the permissions that guard them. Route handlers
never hard-code a layer name or a permission key; they look it up here.

The registry is a table, v1.geospatial_layers, not a dict in this module. A
layer is configuration a farm changes — one grows coffee blocks, another runs
paddocks and dips, an enterprise install adds sensor telemetry — and
configuration that only a code change can alter is not configuration. Rows also
mean the registry outlives the process that seeded it: the layers an install has
are visible in the database next to the shapes that reference them, editable by
a migration, and the same for every worker serving the app. 0015 seeds the set
open core ships with; anything else is an INSERT, whether from the ee side, an
admin screen or a farm's own migration.

title and description are carried on the layer because two API surfaces need
them: the OGC collections document and the WMS capabilities document both
describe layers to a client that has never seen this farm before.

The view/edit/delete permission keys live here even though core.geo never
enforces them — core does not know who is asking. Keeping them on the layer
means the items routes, the tile route and the WMS capabilities document all
read one source of truth, and enforcement stays at the edge.

Each key is a permission name from the RBAC catalog, and each guards one kind of
request against this layer:

    view    reading it at all: listing its features, fetching one, drawing its
            tiles, and whether it is even advertised in the collections and WMS
            capabilities documents. A layer a caller cannot view is a layer they
            are not told exists.
    edit    writing a shape: creating one, and reshaping or re-tagging an
            existing one (POST and PUT on items).
    delete  removing a shape.

They are three separate keys because those are three different rights, and per
layer because the same right differs by what is being drawn: reshaping a field
moves the edge every area, yield and cost figure derives from, while renaming
the field it belongs to does not. Two layers may share a key — most of the
seeded layers share fields.geometry for editing — but sharing is then a decision
recorded in a row, not an accident of there being nowhere else to put it.

seasonal says whether a layer's shapes belong to a growing season. Cropping
layers are seasonal; permanent things like field boundaries and fence lines are
not. Season-less layers ignore any season filter passed to them.

contained_in names the layer a shape must sit inside, which is how a farm stays
one piece of ground: fields, paddocks, structures and water all declare the farm
outline, and the store refuses a shape that wanders past its edge.
"""

from typing import Optional

import duckdb
from pydantic import BaseModel, ConfigDict

from core.geo.errors import UnknownLayer
from core.geo.handler import GeoHandler


class Layer(BaseModel):
    """One map layer, as both the store and the API surfaces see it.

    Frozen because a layer read out of the registry is a declaration, not
    state: handing the same instance to the OGC document builder, the WMS
    builder and the store is only safe if none of them can reshape it. Changing
    a layer means writing the row and reading it back.
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
    # The layer whose shapes this layer's shapes must sit inside, if any. None
    # means the layer answers to nothing — the farm outline itself, and the
    # linear and point layers, whose shapes have no area to measure.
    contained_in: Optional[str] = None


# Which registered layer is the ground everything else sits on. Named here
# because the registry is where layers are declared, so the store can enforce
# containment without a farm-shaped special case compiled into it.
FARM_LAYER = "farm"

TABLE = "v1.geospatial_layers"

# Selected in this order by every read, so a row maps straight onto a Layer.
COLUMNS = (
    "name, title, description, geometry_type, seasonal, "
    "view_permission, edit_permission, delete_permission, contained_in"
)


def _layer_from_row(row: tuple) -> Layer:
    return Layer(
        name=row[0],
        title=row[1],
        description=row[2],
        geometry_type=row[3],
        seasonal=bool(row[4]),
        view=row[5],
        edit=row[6],
        delete=row[7],
        contained_in=row[8],
    )


class LayerHandler(GeoHandler):
    """The registry, as GeospatialService reaches it: `geo.layers`.

    Reads are a single primary-key lookup on an embedded database in this same
    process, so they are not cached: a cache here would have to be invalidated
    across every reader the moment a layer row changed, which is a lot of
    machinery to save a microsecond. If a profile ever says otherwise, this
    class is the one place that would hold it.
    """

    @property
    def handler_signature(self) -> str:
        return "geo_layers"

    def register(self, layer: Layer) -> Layer:
        """Add a layer, replacing any layer already registered under its name.

        New layers land at the end of the display order, which is what the
        collections and capabilities documents list them in.
        """
        position = self.conn.execute(
            f"SELECT coalesce(max(position), 0) + 1 FROM {TABLE}"
        ).fetchone()[0]

        self.conn.execute(
            f"""
            INSERT INTO {TABLE}
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
                updated_at = now()
            """,
            [
                layer.name,
                layer.title,
                layer.description,
                layer.geometry_type,
                layer.seasonal,
                layer.view,
                layer.edit,
                layer.delete,
                layer.contained_in,
                position,
            ],
        )

        return layer

    def get(self, name: str) -> Layer:
        """Return the layer, or raise UnknownLayer.

        Fail closed: an unknown layer is rejected before any read, write or
        permission decision, so a caller can never reach data through a layer we
        do not recognise.
        """
        row = self.conn.execute(
            f"SELECT {COLUMNS} FROM {TABLE} WHERE name = ?", [name]
        ).fetchone()

        if row is None:
            raise UnknownLayer(name)

        return _layer_from_row(row)

    def all(self) -> tuple[Layer, ...]:
        """Every registered layer, in display order."""
        rows = self.conn.execute(
            f"SELECT {COLUMNS} FROM {TABLE} ORDER BY position, name"
        ).fetchall()

        return tuple(_layer_from_row(row) for row in rows)

    def unregister(self, name: str) -> None:
        """Remove a layer. Its shapes are left alone, and become unreachable
        through the feature API until a layer of that name exists again."""
        self.conn.execute(f"DELETE FROM {TABLE} WHERE name = ?", [name])


# The module-level way in, for callers with no service in hand: a document
# builder, a CLI command, an ee package adding its own layer. Each call gets a
# handler over a fresh cursor rather than sharing one, because a long-lived
# handler here would outlive the request that opened its connection.
def register(layer: Layer, conn: Optional[duckdb.DuckDBPyConnection] = None) -> Layer:
    """Add a layer to the registry, replacing any layer registered under its name."""
    return LayerHandler(conn).register(layer)


def get_layer(name: str, conn: Optional[duckdb.DuckDBPyConnection] = None) -> Layer:
    """Return the layer, or raise UnknownLayer."""
    return LayerHandler(conn).get(name)


def all_layers(conn: Optional[duckdb.DuckDBPyConnection] = None) -> tuple[Layer, ...]:
    """Every registered layer, in display order."""
    return LayerHandler(conn).all()
