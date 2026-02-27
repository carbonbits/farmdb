from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.auth.models import (
    LoginPasswordRequest,
    PasskeyAuthenticationOptionsRequest,
    PasskeyAuthenticationOptionsResponse,
    PasskeyAuthenticationVerifyRequest,
    PasskeyInfo,
    PasskeyListResponse,
    PasskeyRegistrationOptionsResponse,
    PasskeyRegistrationVerifyRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from core.auth.service import AuthService

router = APIRouter(prefix="/v1/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


@lru_cache
def get_auth_service() -> AuthService:
    return AuthService()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> UserPublic:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = auth_service.verify_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = auth_service.get_user_by_id(payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return auth_service.user_to_public(user)


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    """Register a new user account."""
    existing = auth_service.get_user_by_email(request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = auth_service.create_user(
        email=request.email,
        password=request.password,
        display_name=request.display_name,
    )

    access_token, refresh_token, expires_in = auth_service.create_tokens(user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )


@router.post("/login/password", response_model=TokenResponse)
async def login_password(
    request: LoginPasswordRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    """Login with email and password."""
    user = auth_service.get_user_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
        )

    if not auth_service.verify_password(user.id, request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token, refresh_token, expires_in = auth_service.create_tokens(user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )


@router.post("/login/passkey/options", response_model=PasskeyAuthenticationOptionsResponse)
async def login_passkey_options(
    request: PasskeyAuthenticationOptionsRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> PasskeyAuthenticationOptionsResponse:
    """Get WebAuthn authentication options for passkey login."""
    options = auth_service.generate_passkey_authentication_options(
        email=request.email if request.email else None
    )
    return PasskeyAuthenticationOptionsResponse(options=options)


@router.post("/login/passkey/verify", response_model=TokenResponse)
async def login_passkey_verify(
    request: PasskeyAuthenticationVerifyRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    """Verify passkey authentication and login."""
    challenge_key = request.credential.get("_challenge_key")
    if not challenge_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing challenge key",
        )

    try:
        user = auth_service.verify_passkey_authentication(
            credential=request.credential,
            challenge_key=challenge_key,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
        )

    access_token, refresh_token, expires_in = auth_service.create_tokens(user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )


@router.post("/passkeys/register/options", response_model=PasskeyRegistrationOptionsResponse)
async def passkey_register_options(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> PasskeyRegistrationOptionsResponse:
    """Get WebAuthn registration options for adding a passkey."""
    user = auth_service.get_user_by_id(current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    options = auth_service.generate_passkey_registration_options(user)
    return PasskeyRegistrationOptionsResponse(options=options)


@router.post("/passkeys/register/verify", response_model=PasskeyInfo)
async def passkey_register_verify(
    request: PasskeyRegistrationVerifyRequest,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> PasskeyInfo:
    """Verify and complete passkey registration."""
    user = auth_service.get_user_by_id(current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    try:
        passkey = auth_service.verify_passkey_registration(
            user=user,
            credential=request.credential,
            friendly_name=request.friendly_name,
        )
        return passkey
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/passkeys", response_model=PasskeyListResponse)
async def list_passkeys(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> PasskeyListResponse:
    """List all passkeys for the current user."""
    passkeys = auth_service.list_user_passkeys(current_user.id)
    return PasskeyListResponse(passkeys=passkeys)


@router.delete("/passkeys/{passkey_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_passkey(
    passkey_id: str,
    current_user: Annotated[UserPublic, Depends(get_current_user)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> None:
    """Delete a passkey."""
    deleted = auth_service.delete_passkey(current_user.id, passkey_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Passkey not found",
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    """Refresh access token using refresh token."""
    result = auth_service.refresh_tokens(request.refresh_token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    access_token, refresh_token, expires_in = result
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: RefreshTokenRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> None:
    """Logout by revoking the refresh token."""
    auth_service.revoke_refresh_token(request.refresh_token)


@router.get("/me", response_model=UserPublic)
async def get_current_user_info(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    """Get current authenticated user info."""
    return current_user
