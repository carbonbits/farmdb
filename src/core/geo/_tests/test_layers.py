"""
Tests for the layer registry.

The registry is open so the enterprise edition can add its own layers without
open core knowing about them; these tests hold that door open and put anything
they register back the way they found it.
"""

import pytest
from pydantic import ValidationError

from core.geo.errors import UnknownLayer
from core.geo.layers import Layer, all_layers, get_layer, register


@pytest.fixture
def restore_registry():
    """Undo anything a test registers."""
    import core.geo.layers as registry

    before = dict(registry._REGISTRY)
    yield
    registry._REGISTRY.clear()
    registry._REGISTRY.update(before)


def test_open_core_layers_are_registered():
    assert {layer.name for layer in all_layers()} == {
        "fields",
        "infrastructure",
        "markers",
    }


def test_get_layer_carries_geometry_class_and_permissions():
    fields = get_layer("fields")

    assert fields.geometry_type == "POLYGON"
    assert (fields.view, fields.edit, fields.delete) == (
        "fields.view",
        "fields.edit",
        "fields.delete",
    )


def test_unknown_layer_raises():
    with pytest.raises(UnknownLayer):
        get_layer("spaceships")


def test_another_edition_can_register_its_own_layer(restore_registry):
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
        )
    )

    assert get_layer("sensors").view == "sensors.view"
    assert "sensors" in {layer.name for layer in all_layers()}


def test_layer_is_frozen():
    """A registered layer is a declaration shared by three readers, not state."""
    fields = get_layer("fields")

    with pytest.raises(ValidationError):
        fields.view = "anything.else"
