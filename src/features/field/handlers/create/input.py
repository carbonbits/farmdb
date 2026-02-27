from pydantic import ConfigDict

from features.field.models.base import FarmFieldBase


class CreateFarmFieldInput(FarmFieldBase):
    model_config = ConfigDict(extra="forbid")
