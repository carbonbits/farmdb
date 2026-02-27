from .user import UserBase, UserCreate, User, UserPublic
from .auth import RegisterRequest, LoginPasswordRequest, TokenResponse, RefreshTokenRequest
from .passkey import (
    PasskeyRegistrationOptionsRequest,
    PasskeyRegistrationOptionsResponse,
    PasskeyRegistrationVerifyRequest,
    PasskeyAuthenticationOptionsRequest,
    PasskeyAuthenticationOptionsResponse,
    PasskeyAuthenticationVerifyRequest,
    PasskeyInfo,
    PasskeyListResponse,
)
from .error import AuthError

__all__ = [
    # User models
    "UserBase",
    "UserCreate",
    "User",
    "UserPublic",
    # Auth models
    "RegisterRequest",
    "LoginPasswordRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    # Passkey models
    "PasskeyRegistrationOptionsRequest",
    "PasskeyRegistrationOptionsResponse",
    "PasskeyRegistrationVerifyRequest",
    "PasskeyAuthenticationOptionsRequest",
    "PasskeyAuthenticationOptionsResponse",
    "PasskeyAuthenticationVerifyRequest",
    "PasskeyInfo",
    "PasskeyListResponse",
    # Error models
    "AuthError",
]
