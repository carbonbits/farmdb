from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class PasskeyRegistrationOptionsRequest(BaseModel):
    pass


class PasskeyRegistrationOptionsResponse(BaseModel):
    options: dict


class PasskeyRegistrationVerifyRequest(BaseModel):
    credential: dict
    friendly_name: Optional[str] = None


class PasskeyAuthenticationOptionsRequest(BaseModel):
    email: Optional[EmailStr] = None


class PasskeyAuthenticationOptionsResponse(BaseModel):
    options: dict


class PasskeyAuthenticationVerifyRequest(BaseModel):
    credential: dict


class PasskeyInfo(BaseModel):
    id: str
    friendly_name: Optional[str]
    device_type: Optional[str]
    backed_up: bool
    created_at: datetime
    last_used_at: Optional[datetime]


class PasskeyListResponse(BaseModel):
    passkeys: list[PasskeyInfo]
