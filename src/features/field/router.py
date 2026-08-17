from typing import Annotated

import duckdb
from fastapi import APIRouter, Depends

from core.auth.principal import Principal
from core.authz.service import require_permission
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
    principal: Annotated[Principal, Depends(require_permission("fields.edit"))],
) -> FarmField:
    """Create a farm field for the authenticated user."""
    return await create_field(input_=input_, conn=conn, user_id=principal.user_id)


@router.get("/", response_model=list[FarmField])
async def list_farm_fields(
    conn: Annotated[duckdb.DuckDBPyConnection, Depends(db)],
    principal: Annotated[Principal, Depends(require_permission("fields.view"))],
) -> list[FarmField]:
    """List the authenticated user's fields."""
    return await list_fields(conn=conn, user_id=principal.user_id)
