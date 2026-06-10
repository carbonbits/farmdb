from typing import Annotated

import duckdb
from fastapi import APIRouter, Depends, HTTPException, status
from wireup import Injected

from core.auth.principal import Principal
from core.auth.resolver import require_principal
from core.authz.base import AuthzService, AuthzTuple
from core.storage.database import db
from features.field.handlers.create.handler import create_field
from features.field.handlers.create.input import CreateFarmFieldInput
from features.field.handlers.list.handler import list_fields
from features.field.models.field import FarmField

router = APIRouter(prefix="/v1/fields", tags=["fields"])


@router.post("/", response_model=FarmField)
async def create_farm_field(
    input_: CreateFarmFieldInput,
    conn: Annotated[duckdb.DuckDBPyConnection, Depends(db)],
    principal: Annotated[Principal, Depends(require_principal)],
    authz: Injected[AuthzService],
) -> FarmField:
    """Create a farm field for the authenticated user."""
    allowed = await authz.can(
        AuthzTuple(
            user=f"user:{principal.user_id}",
            relation="create_field",
            object=f"user:{principal.user_id}",
        ),
        context="user",
        context_id=principal.user_id,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: create_field",
        )

    return await create_field(input_=input_, conn=conn, user_id=principal.user_id)


@router.get("/", response_model=list[FarmField])
async def list_farm_fields(
    conn: Annotated[duckdb.DuckDBPyConnection, Depends(db)],
    principal: Annotated[Principal, Depends(require_principal)],
) -> list[FarmField]:
    """List the authenticated user's fields."""
    return await list_fields(conn=conn, user_id=principal.user_id)
