"""
Instance metadata, mounted at /v1/metadata.

One read-only document describing the deployment itself. It needs a principal
but no particular permission: every fact in it is something any signed-in user
of this farm may see, and the web app reads it on load. Anonymous callers get
nothing, the same stance the map API's discovery documents take — the response
says which instance this is, and that is not for passers-by.
"""

from typing import Annotated

from fastapi import APIRouter, Depends

from core.auth.principal import Principal
from core.auth.resolver import require_principal
from features.metadata.schemas import FarmMetadata
from features.metadata.service import MetadataService, get_metadata_service

router = APIRouter(prefix="/v1", tags=["metadata"])


@router.get("/metadata", response_model=FarmMetadata)
async def get_metadata(
    _: Annotated[Principal, Depends(require_principal)],
    service: Annotated[MetadataService, Depends(get_metadata_service)],
) -> FarmMetadata:
    """This farm's id and creation date, the running build, and database size."""
    return service.collect()
