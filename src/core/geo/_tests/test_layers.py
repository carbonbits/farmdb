"""
Tests for the layer registry.

The registry is a table now, not a dict, so these read it the way the app does:
through a handler over a migrated database. That is the point of the move — the
layers an install has are data, so a test cannot assert them without a database
any more than a request can.

The registry also stays open, so the enterprise edition can add its own layers
without open core knowing about them. These tests hold that door open, and
because each one runs against its own migrated database nothing they register
leaks into the next.
"""

import pytest
from pydantic import ValidationError

from core.geo.errors import UnknownLayer
from core.geo.layers import Layer, all_layers, get_layer, register

# What 0015 seeds, in the order the collections and capabilities documents list
# them: the ground everything sits on, then the ground inside it, then the lines
# and points that cross it.
SEEDED = (
    "farm",
    "fields",
    "paddocks",
    "structures",
    "water",
    "fences",
    "gates",
)


def test_the_seeded_layers_are_registered_in_display_order(geo):
    assert tuple(layer.name for layer in all_layers(geo.conn)) == SEEDED


def test_layers_name_things_rather_than_categories(geo):
    """The catch-alls are gone: a client can ask for the fences, and a
    permission on them grants exactly that."""
    names = {layer.name for layer in all_layers(geo.conn)}

    assert {"fences", "gates"} <= names
    assert not {"infrastructure", "markers"} & names


def test_get_layer_carries_geometry_class_and_permissions(geo):
    fields = get_layer("fields", geo.conn)

    assert fields.geometry_type == "POLYGON"
    assert (fields.view, fields.edit, fields.delete) == (
        "fields.view",
        "fields.geometry",
        "fields.geometry",
    )


def test_editing_a_boundary_is_its_own_permission(geo):
    """Every layer's shapes answer to fields.geometry, not fields.edit: naming a
    field and moving its edge are different rights."""
    for layer in all_layers(geo.conn):
        assert layer.edit == "fields.geometry"
        assert layer.delete == "fields.geometry"


def test_a_layer_can_be_viewed_by_the_module_that_owns_it(geo):
    """Why the keys sit per layer at all: a paddock is livestock ground, so who
    may look at it is not the mapping module's decision."""
    assert get_layer("paddocks", geo.conn).view == "livestock.view"
    assert get_layer("fields", geo.conn).view == "fields.view"


def test_ground_layers_are_contained_by_the_farm(geo):
    for name in ("fields", "paddocks", "structures", "water"):
        assert get_layer(name, geo.conn).contained_in == "farm"

    # The outline answers to nothing, and an area rule has nothing to measure
    # on a line or a point.
    for name in ("farm", "fences", "gates"):
        assert get_layer(name, geo.conn).contained_in is None


def test_unknown_layer_raises(geo):
    with pytest.raises(UnknownLayer):
        get_layer("spaceships", geo.conn)


def test_another_edition_can_register_its_own_layer(geo):
    register(
        Layer(
            name="sensors",
            title="Sensors",
            description="IoT telemetry points.",
            geometry_type="POINT",
            seasonal=False,
            view="sensors.view",
            edit="sensors.edit",
            delete="sensors.delete",
        ),
        geo.conn,
    )

    assert get_layer("sensors", geo.conn).view == "sensors.view"
    # Registered last, so it lists last: the seeded order is not disturbed.
    assert tuple(layer.name for layer in all_layers(geo.conn)) == SEEDED + ("sensors",)


def test_registering_over_a_layer_replaces_it(geo):
    """An install that wants its fields seasonal says so by writing the row."""
    fields = get_layer("fields", geo.conn)

    register(fields.model_copy(update={"seasonal": True}), geo.conn)

    assert get_layer("fields", geo.conn).seasonal is True
    # Replaced, not added twice.
    assert tuple(layer.name for layer in all_layers(geo.conn)) == SEEDED


def test_a_layer_can_be_unregistered(geo):
    geo.layers.unregister("gates")

    with pytest.raises(UnknownLayer):
        get_layer("gates", geo.conn)


def test_layer_is_frozen(geo):
    """A layer read out of the registry is a declaration shared by three
    readers, not state. Changing one means writing the row."""
    fields = get_layer("fields", geo.conn)

    with pytest.raises(ValidationError):
        fields.view = "anything.else"
