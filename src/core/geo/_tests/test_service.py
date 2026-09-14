"""
Tests for the geospatial store.

Everything here runs without FastAPI: a caller with a database and nothing else
can store a shape, read it back and ask where a layer is. That is the property
the core split exists to give, so it is what the tests exercise.
"""

import pytest

from core.geo.errors import (
    FarmNotMapped,
    FeatureNotFound,
    InvalidGeometry,
    OutsideFarm,
    UnknownLayer,
)

from .conftest import FARM

POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [[36.80, -1.29], [36.80, -1.28], [36.81, -1.28], [36.81, -1.29], [36.80, -1.29]]
    ],
}
POINT = {"type": "Point", "coordinates": [36.80, -1.29]}
# Self-intersecting ring: valid JSON, invalid geometry.
BOWTIE = {"type": "Polygon", "coordinates": [[[0, 0], [1, 1], [1, 0], [0, 1], [0, 0]]]}


def test_create_round_trip(geo, farm):
    record = geo.create(layer="fields", geometry=POLYGON, properties={"name": "A1"})

    assert record.layer == "fields"
    assert record.geometry["type"] == "Polygon"
    assert record.properties == {"name": "A1"}
    assert geo.get(record.id) == record


def test_create_stamps_the_farm_and_the_storage_crs(geo):
    from core.config.service import ConfigService

    ConfigService().set("farmId", "01FARM")

    record = geo.create(layer="gates", geometry=POINT)
    farm_id, srid = geo.conn.execute(
        "SELECT farm_id, srid FROM v1.geospatial WHERE id = ?", [record.id]
    ).fetchone()

    # The store decides both; no caller has to remember them.
    assert farm_id == "01FARM"
    assert srid == 4326


def test_seasonless_layer_stores_no_season(geo, farm):
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


def test_list_is_scoped_to_one_layer(geo, farm):
    geo.create(layer="fields", geometry=POLYGON)
    geo.create(layer="gates", geometry=POINT)

    assert len(geo.list(layer="fields")) == 1
    assert len(geo.list(layer="gates")) == 1


def test_replace_geometry_keeps_id_and_layer(geo):
    record = geo.create(layer="gates", geometry=POINT, properties={"name": "gate"})
    moved = {"type": "Point", "coordinates": [36.9, -1.2]}

    updated = geo.replace_geometry(record.id, geometry=moved)

    assert updated.id == record.id
    assert updated.layer == "gates"
    assert updated.geometry["coordinates"] == [36.9, -1.2]
    # properties left alone keeps what was stored, so moving a shape does not
    # cost the caller a read first.
    assert updated.properties == {"name": "gate"}


def test_replace_geometry_replaces_properties_when_given(geo):
    record = geo.create(layer="gates", geometry=POINT, properties={"name": "gate"})

    updated = geo.replace_geometry(record.id, geometry=POINT, properties={})

    assert updated.properties == {}


def test_replace_geometry_rejects_the_wrong_class(geo, farm):
    record = geo.create(layer="fields", geometry=POLYGON)

    with pytest.raises(InvalidGeometry):
        geo.replace_geometry(record.id, geometry=POINT)


def test_delete(geo, farm):
    record = geo.create(layer="fields", geometry=POLYGON)

    geo.delete(record.id)

    with pytest.raises(FeatureNotFound):
        geo.get(record.id)

    with pytest.raises(FeatureNotFound):
        geo.delete(record.id)


def test_layer_of(geo):
    record = geo.create(
        layer="fences",
        geometry={
            "type": "LineString",
            "coordinates": [[36.80, -1.29], [36.81, -1.28]],
        },
    )

    assert geo.layer_of(record.id) == "fences"


def test_extent_is_none_until_something_is_stored(geo, farm):
    assert geo.extent("fields") is None

    geo.create(layer="fields", geometry=POLYGON)

    assert geo.extent("fields") == pytest.approx((36.80, -1.29, 36.81, -1.28))


def test_data_version_moves_when_a_layer_changes(geo, farm):
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
    """Every handler is built on first use, not at __init__.

    Constructing the service has to stay free, because the API builds one per
    request and a CLI command may construct one and never touch geometry. The
    registry joined that list when it became a table: reaching for a layer is
    what opens a connection, which is the only reason this test can assert
    anything with no database connected at all.
    """
    from core.geo.service import GeospatialService

    service = GeospatialService()

    assert service._conn is None
    assert service._geometry is None
    assert service._tiles is None
    assert service._layers is None

    with pytest.raises(RuntimeError):
        service.layers.get("fields")


# The farm outline, and what it fences in.
#
# A farm is a boundary first: fields, paddocks, structures and water are
# subdivisions of it, so the store refuses a shape that wanders past its edge.
# The outline that counts is the one v1.configuration points at, not whatever
# happens to be sitting in the farm layer.

# Inside the FARM fixture with room to spare.
INSIDE = {
    "type": "Polygon",
    "coordinates": [
        [[36.80, -1.29], [36.80, -1.28], [36.81, -1.28], [36.81, -1.29], [36.80, -1.29]]
    ],
}
# Half of it hangs over the northern edge at -1.27.
HALF_OUT = {
    "type": "Polygon",
    "coordinates": [
        [
            [36.795, -1.275],
            [36.795, -1.265],
            [36.805, -1.265],
            [36.805, -1.275],
            [36.795, -1.275],
        ]
    ],
}
# 99% inside: a metre or so of slop over the same edge, which is what a hand
# traced outline and a fence walked with a phone look like.
SLOPS_OVER = {
    "type": "Polygon",
    "coordinates": [
        [
            [36.795, -1.2799],
            [36.795, -1.2699],
            [36.805, -1.2699],
            [36.805, -1.2799],
            [36.795, -1.2799],
        ]
    ],
}
# 95% inside: past slop, into the wrong place.
CLEARLY_OVER = {
    "type": "Polygon",
    "coordinates": [
        [
            [36.795, -1.2795],
            [36.795, -1.2695],
            [36.805, -1.2695],
            [36.805, -1.2795],
            [36.795, -1.2795],
        ]
    ],
}


def test_drawing_the_farm_points_the_configuration_at_it(geo):
    from core.config.service import ConfigService

    record = geo.create(layer="farm", geometry=FARM)

    assert ConfigService().get("farmGeometryId") == record.id
    assert geo.farm_outline().id == record.id


def test_a_new_outline_takes_over_from_the_old_one(geo, farm):
    bigger = {
        "type": "Polygon",
        "coordinates": [
            [
                [36.78, -1.31],
                [36.78, -1.26],
                [36.83, -1.26],
                [36.83, -1.31],
                [36.78, -1.31],
            ]
        ],
    }

    second = geo.create(layer="farm", geometry=bigger)

    # The pointer moves, so the older outline stops counting even though its
    # row is still in the layer.
    assert geo.farm_outline().id == second.id
    assert len(geo.list(layer="farm")) == 2


def test_there_is_no_outline_until_one_is_drawn(geo):
    assert geo.farm_outline() is None


def test_a_pointer_to_a_deleted_outline_reads_as_unmapped(geo, farm):
    geo.delete(farm.id)

    # Unmapped, not FeatureNotFound: it tells a caller drawing a field what to
    # do about it.
    assert geo.farm_outline() is None

    with pytest.raises(FarmNotMapped):
        geo.create(layer="fields", geometry=INSIDE)


def test_a_field_cannot_be_drawn_before_the_farm(geo):
    with pytest.raises(FarmNotMapped):
        geo.create(layer="fields", geometry=INSIDE)

    assert geo.list(layer="fields") == []


def test_a_field_inside_the_outline_is_stored(geo, farm):
    record = geo.create(layer="fields", geometry=INSIDE)

    assert record.layer == "fields"


def test_a_field_half_outside_the_outline_is_refused(geo, farm):
    with pytest.raises(OutsideFarm) as raised:
        geo.create(layer="fields", geometry=HALF_OUT)

    assert raised.value.inside == pytest.approx(0.5, abs=0.01)
    assert geo.list(layer="fields") == []


def test_a_field_within_the_slop_allowance_is_stored(geo, farm):
    """98% is the rule, so 99% inside is a field that follows a fence."""
    record = geo.create(layer="fields", geometry=SLOPS_OVER)

    assert record.layer == "fields"


def test_a_field_past_the_slop_allowance_is_refused(geo, farm):
    with pytest.raises(OutsideFarm) as raised:
        geo.create(layer="fields", geometry=CLEARLY_OVER)

    assert raised.value.inside == pytest.approx(0.95, abs=0.01)
    assert raised.value.required == 0.98


def test_reshaping_a_field_outside_the_outline_is_refused(geo, farm):
    record = geo.create(layer="fields", geometry=INSIDE)

    with pytest.raises(OutsideFarm):
        geo.replace_geometry(record.id, geometry=HALF_OUT)

    # The shape it had is the shape it keeps.
    assert geo.get(record.id).geometry == INSIDE


def test_every_ground_layer_is_fenced_in(geo, farm):
    """Fields are not a special case: anything that covers ground is inside."""
    for layer in ("fields", "paddocks", "structures", "water"):
        assert geo.layers.get(layer).contained_in == "farm"

        with pytest.raises(OutsideFarm):
            geo.create(layer=layer, geometry=HALF_OUT)


def test_the_outline_itself_answers_to_nothing(geo):
    """Containment would be circular on the farm layer, and it is not declared."""
    assert geo.layers.get("farm").contained_in is None


def test_lines_and_points_are_not_fenced_in(geo):
    """An area rule has nothing to measure on a line, and a boundary fence runs
    along the outline rather than inside it, so neither layer declares it."""
    assert geo.layers.get("fences").contained_in is None
    assert geo.layers.get("gates").contained_in is None

    # No outline drawn at all, and both still store.
    geo.create(layer="gates", geometry=POINT)
    geo.create(
        layer="fences",
        geometry={
            "type": "LineString",
            "coordinates": [[36.80, -1.29], [36.81, -1.28]],
        },
    )

    assert len(geo.list(layer="gates")) == 1
    assert len(geo.list(layer="fences")) == 1
