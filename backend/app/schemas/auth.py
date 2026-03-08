import uuid
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    """
    Data required to register a new user.
    
    BaseModel (not SQLModel) because this is NOT a database table.
    It's just a validation shape for the incoming request body.
    """
    email: EmailStr
    password: str
    full_name: str
    role: str


class UserLogin(BaseModel):
    """Data required to log in."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """What we return after successful login."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """
    User data returned in API responses.
    
    Notice: NO hashed_password field here!
    We never expose the password hash to the client.
    """
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool
