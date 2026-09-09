from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class CreateFeatureInput(BaseModel):
    """A new shape. The collection comes from the path, so it is not in the body."""

    model_config = ConfigDict(extra="forbid")

    geometry: dict[str, Any]
    # Ignored by season-less collections, which store nothing here whatever is
    # sent, so a client can post the same body to any collection.
    season: Optional[str] = None
    properties: dict[str, Any] = Field(default_factory=dict)
