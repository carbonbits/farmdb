from fastapi import APIRouter, Depends

from core.storage.database import db
from features.field.handlers.create.input import CreateFarmFieldInput
from features.field.models.field import FarmField


router = APIRouter(prefix="/v1/fields", tags=["fields"])

@router.post("/", response_model=FarmField)
async def create_farm_fields(
    input: CreateFarmFieldInput,conn = Depends(db)
) -> FarmField:
    """Create a farm field"""
    print(input)


@router.get("/", response_model=list[FarmField])
async def list_farm_fields(conn=Depends(db)):
    """List all available fields"""
    pass
