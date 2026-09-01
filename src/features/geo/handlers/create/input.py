from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class CreateFeatureInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # layer is required here on purpose: the database column is nullable so the
    # migration stays additive, but every feature created through the API must
    # name its layer.
    layer: str
    season: Optional[str] = None
    geometry: dict[str, Any]
    properties: dict[str, Any] = Field(default_factory=dict)
