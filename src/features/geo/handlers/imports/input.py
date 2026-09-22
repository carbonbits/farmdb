from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel


class ImportFeature(BaseModel):
    """One feature from an uploaded collection.

    Only the geometry and its properties are read. The geometry is left loose
    on purpose and checked per feature at write time, so a bad or missing one is
    skipped with a reason rather than failing the whole upload at parse time.
    """

    geometry: Any = None
    properties: Optional[dict[str, Any]] = None


class ImportFeatureCollection(BaseModel):
    """A GeoJSON FeatureCollection as uploaded.

    Other collection fields such as type, bbox or crs are ignored, so a plain
    GeoJSON file imports as is without being reshaped first.
    """

    features: list[ImportFeature]