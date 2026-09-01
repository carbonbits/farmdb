from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class UpdateFeatureInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # A feature's layer is fixed once created; only its shape and properties
    # can change here.
    geometry: dict[str, Any]
    properties: dict[str, Any] = Field(default_factory=dict)
