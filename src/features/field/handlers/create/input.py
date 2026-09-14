from typing import Any, Optional

from pydantic import ConfigDict

from features.field.models.base import FarmFieldBase


class CreateFarmFieldInput(FarmFieldBase):
    model_config = ConfigDict(extra="forbid")

    # The field's boundary, as a GeoJSON Polygon. Optional, because a farm
    # records a field it has not mapped yet; when it is here the field and its
    # shape are created together, so the client never has to make a second call
    # and cannot leave a field half-created.
    geometry: Optional[dict[str, Any]] = None
