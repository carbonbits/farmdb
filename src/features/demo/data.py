"""
The demo farm: who can sign in, where the farm is, and what grows on it.

Only data lives here, so changing the demo means editing this file alone. The
farm sits near Njoro in Nakuru County. Seasons go in the crop descriptions
because no map layer stores a season yet; see core/geo/layers.py.
"""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class DemoAccount:
    email: str
    display_name: str
    role: str


@dataclass(frozen=True)
class DemoField:
    name: str
    description: str
    boundary: dict[str, Any]


@dataclass(frozen=True)
class DemoCrop:
    field_name: str
    name: str
    variety: str
    description: str


def rectangle(west: float, south: float, east: float, north: float) -> dict[str, Any]:
    """A GeoJSON polygon for a box, longitude first as the API expects."""
    ring = [[west, south], [east, south], [east, north], [west, north], [west, south]]
    return {"type": "Polygon", "coordinates": [ring]}


FARM_NAME = "Njoro Demo Farm"

FARM_OUTLINE = rectangle(35.9000, -0.3400, 35.9100, -0.3340)

ACCOUNTS = (
    DemoAccount("owner@demo.wakulima.tech", "Wanjiku Kamau", "administrator"),
    DemoAccount("manager@demo.wakulima.tech", "Otieno Ouma", "manager"),
    DemoAccount("worker@demo.wakulima.tech", "Chebet Kiprono", "worker"),
)

FIELDS = (
    DemoField(
        "Upper Field",
        "Gentle slope on the north side, good drainage.",
        rectangle(35.9010, -0.3390, 35.9050, -0.3360),
    ),
    DemoField(
        "Lower Field",
        "Flat ground at the bottom of the slope, holds water in the long rains.",
        rectangle(35.9060, -0.3390, 35.9090, -0.3360),
    ),
    DemoField(
        "Hillside Field",
        "Terraced ground below the farm store.",
        rectangle(35.9010, -0.3355, 35.9050, -0.3345),
    ),
)

CROPS = (
    DemoCrop("Upper Field", "Maize", "H614D", "Planted March 2026 for the long rains."),
    DemoCrop(
        "Lower Field", "Beans", "Rosecoco", "Planted March 2026 for the long rains."
    ),
    DemoCrop(
        "Hillside Field",
        "Irish potatoes",
        "Shangi",
        "Planted October 2026 for the short rains.",
    ),
    DemoCrop(
        "Upper Field",
        "Kale",
        "Thousand-headed",
        "Sukuma wiki for the farm workers' kitchen.",
    ),
)
