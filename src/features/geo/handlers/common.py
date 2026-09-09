"""Shared resolution for the item handlers."""

from __future__ import annotations

from core.geo.errors import FeatureNotFound
from core.geo.layers import Layer, get_layer
from core.geo.service import GeospatialService


def resolve_item(geo: GeospatialService, collection_id: str, feature_id: str) -> Layer:
    """The layer an item belongs to, checked against the collection in the path.

    A feature is addressed through its collection, so one that lives in another
    layer is simply not at this URL — treating it as missing keeps the id space
    of one collection from leaking into another.
    """
    layer = get_layer(collection_id)

    if geo.layer_of(feature_id) != collection_id:
        raise FeatureNotFound(feature_id)

    return layer
