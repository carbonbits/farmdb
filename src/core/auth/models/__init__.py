from .auth import (
    LoginPasswordRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from .error import AuthError
from .passkey import (
    PasskeyAuthenticationOptionsRequest,
    PasskeyAuthenticationOptionsResponse,
    PasskeyAuthenticationVerifyRequest,
    PasskeyInfo,
    PasskeyListResponse,
    PasskeyRegistrationOptionsRequest,
    PasskeyRegistrationOptionsResponse,
    PasskeyRegistrationVerifyRequest,
)
from .user import RoleRef, User, UserBase, UserCreate, UserMe, UserPublic

__all__ = [
    # User models
    "UserBase",
    "UserCreate",
    "User",
    "UserPublic",
    "UserMe",
    "RoleRef",
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
