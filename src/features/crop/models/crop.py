from __future__ import annotations

from datetime import datetime
from typing import Optional

import strawberry
from pydantic import BaseModel


class Crop(BaseModel):
    id: str
    field_id: Optional[str] = None
    name: str
    variety: Optional[str] = None
    description: Optional[str] = None
    created_by: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


@strawberry.experimental.pydantic.type(model=Crop, all_fields=True)
class CropType:
    pass
