from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from core.auth.models.user import UserPublic
from core.auth.router import get_current_user
from core.storage.database import db
from features.crop.handlers.create.handler import PermissionDenied, create_crop
from features.crop.handlers.create.input import CreateCropInput
from features.crop.models.crop import CropModel

router = APIRouter(prefix="/v1/crops", tags=["crops"])


@router.post("/", response_model=CropModel, status_code=status.HTTP_201_CREATED)
def create_crop_route(
    input_: CreateCropInput,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    conn=Depends(db),
) -> CropModel:
    try:
        return create_crop(
            input_=input_,
            conn=conn,
            current_user=current_user,
        )
    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create a crop.",
        )
