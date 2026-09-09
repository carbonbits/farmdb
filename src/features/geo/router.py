"""
The map API, mounted at /v1/maps.

Four surfaces over the same store, assembled here so main.py mounts one router:

    metadata  landing page, conformance, collections   (discovery)
    items     GeoJSON CRUD on a collection's features  (editing)
    tiles     MVT tiles for a collection               (drawing a web map)
    wms       the OGC KVP entry point                  (desktop GIS)

The paths follow OGC API - Features and OGC API - Tiles so a client can discover
the API instead of being told about it; the semantics behind them are ours.
"""

from __future__ import annotations

from fastapi import APIRouter

from features.geo import items, metadata, tiles, wms

router = APIRouter(prefix="/v1/maps", tags=["maps"])

router.include_router(metadata.router)
router.include_router(items.router)
router.include_router(tiles.router)
router.include_router(wms.router)
