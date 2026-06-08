from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict


class CreateCropInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    field_id: Optional[str] = None
    name: str
    variety: Optional[str] = None
    description: Optional[str] = None
