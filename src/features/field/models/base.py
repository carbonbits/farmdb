from typing import Optional

from pydantic import BaseModel


class FarmFieldBase(BaseModel):
    name: str
    description: Optional[str] = None
