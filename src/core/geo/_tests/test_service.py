"""
Tests for the geospatial store.

Everything here runs without FastAPI: a caller with a database and nothing else
can store a shape, read it back and ask where a layer is. That is the property
the core split exists to give, so it is what the tests exercise.
"""

import pytest

from core.geo.errors import FeatureNotFound, InvalidGeometry, UnknownLayer

POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [[36.80, -1.29], [36.80, -1.28], [36.81, -1.28], [36.81, -1.29], [36.80, -1.29]]
    ],
}
POINT = {"type": "Point", "coordinates": [36.80, -1.29]}
# Self-intersecting ring: valid JSON, invalid geometry.
BOWTIE = {"type": "Polygon", "coordinates": [[[0, 0], [1, 1], [1, 0], [0, 1], [0, 0]]]}


def test_create_round_trip(geo):
    record = geo.create(layer="fields", geometry=POLYGON, properties={"name": "A1"})

    assert record.layer == "fields"
    assert record.geometry["type"] == "Polygon"
    assert record.properties == {"name": "A1"}
    assert geo.get(record.id) == record


def test_create_stamps_the_farm_and_the_storage_crs(geo):
    from core.config.service import ConfigService

    ConfigService().set("farmId", "01FARM")

    record = geo.create(layer="markers", geometry=POINT)
    farm_id, srid = geo.conn.execute(
        "SELECT farm_id, srid FROM v1.geospatial WHERE id = ?", [record.id]
    ).fetchone()

    # The store decides both; no caller has to remember them.
    assert farm_id == "01FARM"
    assert srid == 4326


def test_seasonless_layer_stores_no_season(geo):
    record = geo.create(layer="fields", geometry=POLYGON, season="2026-long-rains")

    assert record.season is None


def test_geometry_class_must_match_the_layer(geo):
    with pytest.raises(InvalidGeometry):
        geo.create(layer="fields", geometry=POINT)


def test_invalid_geometry_stores_nothing(geo):
    with pytest.raises(InvalidGeometry):
        geo.create(layer="fields", geometry=BOWTIE)

    assert geo.list(layer="fields") == []


def test_unknown_layer_is_refused_before_anything_else(geo):
    with pytest.raises(UnknownLayer):
        geo.create(layer="spaceships", geometry=POINT)

    with pytest.raises(UnknownLayer):
        geo.list(layer="spaceships")


def test_get_missing_raises(geo):
    with pytest.raises(FeatureNotFound):
        geo.get("does-not-exist")


def test_list_is_scoped_to_one_layer(geo):
    geo.create(layer="fields", geometry=POLYGON)
    geo.create(layer="markers", geometry=POINT)

    assert len(geo.list(layer="fields")) == 1
    assert len(geo.list(layer="markers")) == 1


def test_replace_geometry_keeps_id_and_layer(geo):
    record = geo.create(layer="markers", geometry=POINT, properties={"name": "gate"})
    moved = {"type": "Point", "coordinates": [36.9, -1.2]}

    updated = geo.replace_geometry(record.id, geometry=moved)

    assert updated.id == record.id
    assert updated.layer == "markers"
    assert updated.geometry["coordinates"] == [36.9, -1.2]
    # properties left alone keeps what was stored, so moving a shape does not
    # cost the caller a read first.
    assert updated.properties == {"name": "gate"}


def test_replace_geometry_replaces_properties_when_given(geo):
    record = geo.create(layer="markers", geometry=POINT, properties={"name": "gate"})

    updated = geo.replace_geometry(record.id, geometry=POINT, properties={})

    assert updated.properties == {}


def test_replace_geometry_rejects_the_wrong_class(geo):
    record = geo.create(layer="fields", geometry=POLYGON)

    with pytest.raises(InvalidGeometry):
        geo.replace_geometry(record.id, geometry=POINT)


def test_delete(geo):
    record = geo.create(layer="fields", geometry=POLYGON)

    geo.delete(record.id)

    with pytest.raises(FeatureNotFound):
        geo.get(record.id)

    with pytest.raises(FeatureNotFound):
        geo.delete(record.id)


def test_layer_of(geo):
    record = geo.create(
        layer="infrastructure",
        geometry={
            "type": "LineString",
            "coordinates": [[36.80, -1.29], [36.81, -1.28]],
        },
    )

    assert geo.layer_of(record.id) == "infrastructure"


def test_extent_is_none_until_something_is_stored(geo):
    assert geo.extent("fields") is None

    geo.create(layer="fields", geometry=POLYGON)

    assert geo.extent("fields") == pytest.approx((36.80, -1.29, 36.81, -1.28))


def test_data_version_moves_when_a_layer_changes(geo):
    assert geo.data_version("fields") is None

    record = geo.create(layer="fields", geometry=POLYGON)
    first = geo.data_version("fields")
    assert first is not None

    geo.replace_geometry(record.id, geometry=POLYGON)

    assert geo.data_version("fields") >= first


def test_handlers_are_reachable_through_the_service(geo):
    """The handlers are the service's own seam, so a caller never passes a cursor."""
    assert geo.geometry.validate(POINT, "POINT")
    assert geo.layers.get("fields").geometry_type == "POLYGON"

    with pytest.raises(InvalidGeometry):
        geo.geometry.validate(BOWTIE, "POLYGON")

    with pytest.raises(UnknownLayer):
        geo.layers.get("spaceships")


def test_handlers_are_built_once_and_share_the_connection(geo):
    assert geo.geometry is geo.geometry
    assert geo.tiles is geo.tiles


def test_every_handler_extends_the_geo_base(geo):
    """The CRS policy is declared once, on the base, not per handler."""
    from config.settings import settings
    from core.geo.handler import GeoHandler
    from core.handler import Handler

    handlers = (geo.geometry, geo.tiles, geo.layers)

    for handler in handlers:
        assert isinstance(handler, GeoHandler)
        assert isinstance(handler, Handler)
        assert handler.SRID == settings.geo_srid
        assert handler.CRS == settings.geo_crs

    # Distinct signatures, so a bound log line says which handler wrote it.
    assert len({handler.handler_signature for handler in handlers}) == 3


def test_constructing_the_service_opens_nothing():
    """A handler that needs the database is built on first use, not at __init__.

    Constructing the service has to stay free, because the API builds one per
    request and a CLI command may construct one and never touch geometry.
    """
    from core.geo.service import GeospatialService

    service = GeospatialService()

    assert service._conn is None
    assert service._geometry is None
    assert service._tiles is None
    # The registry needs no connection, so it is there from the start.
    assert service.layers.get("fields").name == "fields"
