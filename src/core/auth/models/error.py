from pydantic import BaseModel


class AuthError(BaseModel):
    detail: str
