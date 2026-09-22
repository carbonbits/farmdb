from typing import Any, Optional

from features.field.models.base import FarmFieldBase


class FarmField(FarmFieldBase):
    id: str
    # The boundary this field encloses, as a GeoJSON Polygon, and the area it
    # covers in hectares. Both are absent until someone has walked the edge: a
    # field is a record first and a shape second, so the API reports what it
    # has rather than refusing to describe a field with no boundary yet.
    geometry: Optional[dict[str, Any]] = None
    area_ha: Optional[float] = None
