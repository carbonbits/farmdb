"""
Geospatial primitives that ship with the service.

Almost every record a farm keeps sits somewhere — a field has a boundary, a
water point has a location, a fence has a line — so geometry lives in core next
to storage, auth and config rather than inside one feature. features/geo is the
map API on top of this; it is one consumer, not the owner.
"""

from core.geo.errors import FeatureNotFound, GeoError, InvalidGeometry, UnknownLayer
from core.geo.handler import GeoHandler
from core.geo.layers import Layer, all_layers, get_layer, register
from core.geo.models import Bbox, GeoRecord
from core.geo.service import GeospatialService

__all__ = [
    "Bbox",
    "FeatureNotFound",
    "GeoError",
    "GeoHandler",
    "GeoRecord",
    "GeospatialService",
    "InvalidGeometry",
    "Layer",
    "all_layers",
    "UnknownLayer",
    "get_layer",
    "register",
]
