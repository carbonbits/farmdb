from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from wireup import Injected

from core.auth.principal import Principal
from core.auth.resolver import require_principal
from core.authz.base import AuthzService, AuthzTuple
from features.crop.handlers.create.handler import create_crop
from features.crop.handlers.create.input import CreateCropInput
from features.crop.models.crop import Crop

router = APIRouter(prefix="/v1/crops", tags=["crops"])


@router.post("/", response_model=Crop, status_code=status.HTTP_201_CREATED)
async def create_crop_route(
    input_: CreateCropInput,
    principal: Annotated[Principal, Depends(require_principal)],
    authz: Injected[AuthzService],
) -> Crop:
    allowed = await authz.can(
        AuthzTuple(
            user=f"user:{principal.user_id}",
            relation="create_crop",
            object=f"user:{principal.user_id}",
        ),
        context="user",
        context_id=principal.user_id,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: create_crop",
        )
    return await create_crop(input_=input_, principal=principal)
