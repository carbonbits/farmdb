"""
Canonical Farm model.

Single source of truth for the Farm response shape.
REST uses FarmModel directly via Pydantic.
GraphQL uses Farm which is derived from FarmModel via Strawberry.
Drift between transports is structurally impossible.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

import strawberry
from pydantic import BaseModel


class FarmModel(BaseModel):
    """Pydantic model — DB row mapping and REST response."""
    id: str
    name: str
    description: Optional[str] = None
    shortcode: Optional[str] = None
    org_id: str
    created_by: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


@strawberry.experimental.pydantic.type(model=FarmModel, all_fields=True)
class Farm:
    """GraphQL type — derived from FarmModel, never diverges."""
    pass
