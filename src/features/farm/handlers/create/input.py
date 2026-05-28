"""
Input model for createFarm.
Used by both REST (Pydantic validation) and GraphQL (Strawberry input).
"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CreateFarmInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    description: Optional[str] = None
    shortcode: Optional[str] = None