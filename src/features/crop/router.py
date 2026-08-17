from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from core.auth.principal import Principal
from core.authz.service import require_permission
from features.crop.handlers.create.handler import create_crop
from features.crop.handlers.create.input import CreateCropInput
from features.crop.models.crop import Crop

router = APIRouter(prefix="/v1/crops", tags=["crops"])


@router.post("/", response_model=Crop, status_code=status.HTTP_201_CREATED)
async def create_crop_route(
    input_: CreateCropInput,
    principal: Annotated[Principal, Depends(require_permission("crops.log"))],
) -> Crop:
    return await create_crop(input_=input_, principal=principal)
