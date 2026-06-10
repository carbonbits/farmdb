from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from wireup import Injected

from core.auth.apikeys.base import ApiKeyInfo, ApiKeyStore, GeneratedApiKey
from core.auth.principal import Principal
from core.auth.resolver import require_principal

router = APIRouter(prefix="/v1/api-keys", tags=["api-keys"])


class CreateApiKeyInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str


@router.post("/", response_model=GeneratedApiKey, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    input_: CreateApiKeyInput,
    principal: Annotated[Principal, Depends(require_principal)],
    store: Injected[ApiKeyStore],
) -> GeneratedApiKey:
    """Create an API key for the authenticated user. The plaintext key is returned once."""
    return store.create(user_id=principal.user_id, name=input_.name)


@router.get("/", response_model=list[ApiKeyInfo])
async def list_api_keys(
    principal: Annotated[Principal, Depends(require_principal)],
    store: Injected[ApiKeyStore],
) -> list[ApiKeyInfo]:
    """List the authenticated user's API keys (metadata only)."""
    return store.list_for_user(principal.user_id)


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: str,
    principal: Annotated[Principal, Depends(require_principal)],
    store: Injected[ApiKeyStore],
) -> None:
    """Revoke one of the authenticated user's API keys."""
    if not store.revoke(principal.user_id, key_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )
