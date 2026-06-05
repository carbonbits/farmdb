"""
Farm REST endpoints.
Transport only no business logic here.
"""

from __future__ import annotations

import duckdb
from fastapi import APIRouter, Depends, Header, HTTPException, status

from core.storage.database import db
from features.farm.handlers.create.handler import PermissionDenied, create_farm
from features.farm.handlers.create.input import CreateFarmInput
from features.farm.models.farm import FarmModel

router = APIRouter(prefix="/v1/farms", tags=["farms"])


@router.post("/", response_model=FarmModel, status_code=status.HTTP_201_CREATED)
async def create_farm_endpoint(
    input_: CreateFarmInput,
    conn: duckdb.DuckDBPyConnection = Depends(db),
    x_user_id: str = Header(..., alias="x-user-id"),
    x_account_id: str = Header(..., alias="x-account-id"),
) -> FarmModel:
    """
    Create a farm.
    Requires x-user-id and x-account-id headers.
    Returns 403 if the user lacks create_farm permission.
    """
    try:
        return await create_farm(
            input_=input_,
            conn=conn,
            user_id=x_user_id,
            org_id=x_account_id,
        )
    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: create_farm",
        )
