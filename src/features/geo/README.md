# geo

Geometry is not a domain of its own. Almost every record a farm keeps sits
somewhere: a field has a boundary, a water point has a location, a fence has a
line, a spray run has a track. So the geospatial capability ships with the
service, in `core/geo/`, next to storage, auth and config. What lives here in
`features/geo/` is the map API on top of it — one consumer, not the owner.

## The definition this replaced

`v1.geospatial` was introduced (migration 0006) as one central store that domain
tables point into: `v1.fields.geospatial_id` references a row, and the legacy
`v1.fields.geom` column was dropped in 0007 because geometry stopped being a
column on each domain table.

The code had gone the other way. The store, the layer registry, geometry
validation, the SRID policy and tile rendering all sat inside `features/geo/`,
which made it a sibling of `features/field` and `features/crop` rather than
something underneath them. A feature that needed geometry had three bad options:
import across into another feature package, re-hand-roll the `ST_*` SQL, or hold
a geometry column of its own again. The empty `GeospatialService` was the
symptom — a service in name, while every handler talked to DuckDB directly.

## core/geo

```
core/geo/
  service.py     GeospatialService — the one way to read and write v1.geospatial
  handler.py     GeoHandler — the base every handler below extends
  geometry.py    GeometryHandler — GeoJSON validation and the geometry class
  layers.py      LayerHandler, the Layer record and the open registry
  tiles.py       TileHandler — MVT rendering (SQL and bytes, no HTTP)
  errors.py      UnknownLayer, InvalidGeometry, FeatureNotFound
  models.py      GeoRecord, Bbox — what the store hands back
  _tests/        the store and the registry, exercised without FastAPI
```

The service is a seam, not a pile of SQL: the work sits in three handlers it
holds, and it decides the order they run in and owns the connection they share.

```python
geo.geometry.validate(geometry, "POLYGON")   # GeometryHandler
geo.layers.get("fields")                     # LayerHandler
geo.tiles.render(layer=layer, z=z, x=x, y=y) # TileHandler
```

All three extend `GeoHandler` (itself a `core.handler.Handler`, the sibling of
`core.service.Service`), which declares the CRS policy once: `SRID` for the
geometry column and `CRS` for the URI the OGC documents quote. No handler
declares the storage CRS again, and the one place that reprojects — tile
rendering — builds its source CRS from `self.SRID`.

`geo.geometry` and `geo.tiles` are built on first use, so constructing the
service still opens no connection. `LayerHandler` needs no database, and the
registry behind it is process-wide because layers register at import time — so
`core.geo.layers.get_layer()` and `all_layers()` remain importable for the
document builders (`metadata.py`, `wms.py`) that hold no service.

### Why GeoRecord is not a duckling Document

Every other model in the project is a `duckling.Document`. `v1.geospatial`
cannot be, in either direction, because both ends of the geometry column need a
spatial function: duckling writes a dict field as `json.dumps(...)`, and a JSON
string into a `GEOMETRY` column raises *Failed to parse geometry*, while
`SELECT *` — what `find`/`get` issue — returns `GEOMETRY` as WKB bytes, which no
`dict[str, Any]` field will validate. The insert needs `ST_GeomFromGeoJSON(?)`
and the read needs `ST_AsGeoJSON(geometry)`.

A Document that can neither insert, get nor find would advertise four methods
that corrupt or raise, so `GeoRecord` is a plain pydantic model over the
projection in `COLUMNS`, and the spatial SQL stays visible in the handlers.

Three rules keep it usable from anywhere:

- **It raises its own errors, never `HTTPException`.** Each one names a kind from
  `core/errors.py` (`NotFound`, `Invalid`, …), and `apps/api/errors.py` renders
  every kind onto a status code once for the whole app — geo registers nothing
  of its own in `main.py`.
- **It decides `farm_id` and `srid` itself.** A caller passes a shape; the store
  stamps the farm (from the `farmId` config key) and the storage CRS.
- **It takes a connection, defaulting to `db()`.** A request handler passes the
  cursor it already holds; a CLI command passes nothing.

Authorization stays out of core: `GeospatialService` does not know who is
asking. The layer's `view`/`edit`/`delete` keys ride on the `Layer` record and
the edge enforces them.

### Using it from another feature

```python
geo = GeospatialService(conn=conn)
shape = geo.create(layer="fields", geometry=input_.boundary, created_by=user_id)

conn.execute(
    "INSERT INTO v1.fields (id, name, geospatial_id) VALUES (?, ?, ?)",
    [field_id, input_.name, shape.id],
)
```

No foreign key is declared, per project convention, so deleting a domain row
does not cascade — whichever feature owns the link deletes its geometry too.

### The spatial extension

`INSTALL spatial` / `LOAD spatial` now happens once in `core.storage.database`
when the app connects, because most of what a farm records sits somewhere.
Cursors from `db()` inherit it, so the old per-request `LOAD` (and the
`features/geo/db.py` dependency that carried it) is gone.

## features/geo

The map API, mounted at `/v1/maps`, assembled in `router.py` from four surfaces:

| module | what it serves |
| --- | --- |
| `metadata.py` | landing page, conformance, collections — discovery |
| `items.py` | GeoJSON CRUD on a collection's features — editing |
| `tiles.py` | MVT tiles and the tilesets document — web maps |
| `wms.py` | the OGC KVP entry point — desktop GIS |

```
GET    /v1/maps/                                    landing page (links)
GET    /v1/maps/conformance                         conformance classes
GET    /v1/maps/collections                         the layers you may view
GET    /v1/maps/collections/{cid}                   one layer, with its extent
GET    /v1/maps/collections/{cid}/items             list (FeatureCollection)
POST   /v1/maps/collections/{cid}/items             create
GET    /v1/maps/collections/{cid}/items/{fid}       get
PUT    /v1/maps/collections/{cid}/items/{fid}       update
DELETE /v1/maps/collections/{cid}/items/{fid}       delete
GET    /v1/maps/collections/{cid}/tiles             tilesets
GET    /v1/maps/collections/{cid}/tiles/WebMercatorQuad/{z}/{x}/{y}.mvt
GET    /v1/maps/wms?SERVICE=WMS&REQUEST=...         WMS 1.3.0
```

The paths follow OGC API - Features and OGC API - Tiles; the semantics behind
them are ours. A **collection** is a layer from the registry. Because the
collection is in the path:

- a request body never names its layer, and
- an item is only reachable through the collection it belongs to — the same id
  under another collection is a 404, not someone else's shape.

An unknown collection is a 404 everywhere (it used to be a 400 on the flat CRUD
routes and a 404 on tiles).

Everything needs a principal, including the landing page: the layer list says
something about the farm. Permissions cannot be pinned on the route the way the
fields router pins `fields.edit`, because which permission applies depends on the
collection, so the handler looks it up and checks it. Collections and WMS layers
are filtered to what the caller may view — a map should not advertise a layer it
would then refuse to serve.

### Conformance

`/v1/maps/conformance` declares what is actually true today:

```
http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson
http://www.opengis.net/spec/ogcapi-tiles-1/1.0/conf/mvt
```

`conf/core` is deliberately absent. It requires the `limit` and `bbox` query
parameters, link objects on every response, and `numberMatched` /
`numberReturned` on a feature collection — none of which this build implements.
Declaring it would make a conforming client send parameters we silently ignore.
Adding those four things is the one step between here and claiming core.

### WMS

One KVP endpoint, because WMS predates REST: everything arrives as query-string
parameters on a single URL and parameter names are case-insensitive.

- `GetCapabilities` works. The document is built from the layer registry and
  filtered to the layers the caller may view, so pasting the URL into QGIS lists
  what the farm holds.
- `GetMap`, `GetFeatureInfo` and `GetLegendGraphic` answer **501** with an OGC
  `ServiceExceptionReport`. Rendering a raster needs a rasterizer this build does
  not have; vector tiles are the way to get map data out today.
- Service exceptions carry real HTTP status codes (400/501) rather than the
  WMS convention of 200-with-an-error-document.

`GetMap` is still advertised in the capabilities document because the WMS 1.3.0
schema requires it. `GetFeatureInfo` is optional there and is left out rather
than advertised and refused, which is why every layer is `queryable="0"`.

## Storage

`v1.geospatial`, after 0006 and 0014:

| column | notes |
| --- | --- |
| `id` | ULID, primary key |
| `farm_id` | set by the store from the `farmId` config key |
| `feature_type` | legacy `NOT NULL` column; mirrors `layer` until a contract migration drops it |
| `geometry` | `GEOMETRY`, always EPSG:4326 on the way in |
| `properties` | `JSON`, freeform per-layer metadata |
| `srid` | written as 4326 by the store |
| `layer`, `season` | nullable in SQL, required by the API |
| `created_at`, `updated_at`, `created_by` | |

Indexes: `farm_id`, `feature_type`, `(layer, season)` for everyday reads, and an
R-tree on `geometry` for area searches.

Coordinates are stored in EPSG:4326 (CRS84 axis order: longitude first, as
GeoJSON has it) and reprojected to EPSG:3857 only inside tile rendering.

## Layers

A layer is a named group of shapes sharing one geometry class, whether they are
seasonal, a title and description for the discovery documents, and the
permission keys that guard them.

The registry is open: `core.geo.layers.register()` lets the enterprise edition
add its own layers — IoT sensor telemetry, say — without editing a dict that open
core owns. Open core registers `fields` (POLYGON), `infrastructure` (LINESTRING)
and `markers` (POINT), all season-less, all guarded by `fields.view` /
`fields.edit` / `fields.delete`.

## Open questions

- **`feature_type`.** Still written twice (as itself and as `layer`) to satisfy a
  `NOT NULL` column nothing reads. A contract migration should drop it.
- **Claiming `conf/core`.** `limit`, `bbox`, response links and the count fields,
  as above.
- **WMS authentication.** The endpoint requires a principal like everything else,
  which means QGIS needs a credential; the api key work is the natural fit.
- **`GetMap`.** Needs a rasterizer (Pillow at minimum) and a per-layer styling
  decision before it can stop returning 501.
- **Season-aware layers.** Every layer is season-less today, so the seasonal
  branches in the store and the tile renderer are untested by anything real.
- **Update semantics.** `PUT` replaces properties, and an omitted `properties`
  object empties them. `GeospatialService.replace_geometry` leaves them alone when
  passed `None`, so a `PATCH` could be added without touching the store.

## Non-goals

Raster and imagery, geocoding, routing, and anything requiring PostGIS. Geometry
work happens in DuckDB's spatial extension inside the single-file database that
ships with the service.
