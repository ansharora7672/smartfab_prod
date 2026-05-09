import uuid
from pydantic import BaseModel, EmailStr, field_validator

# USER REGISTER SCHEMA
class UserRegister(BaseModel):

    email: EmailStr
    password: str
    full_name: str
    role: str

# USER LOGIN SCHEMA
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# TOKEN RESPONSE SCHEMA
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# USER RESPONSE SCHEMA
class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool

# CHANGE PASSWORD SCHEMA
class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v

# FORGOT PASSWORD SCHEMA
class ForgotPasswordRequest(BaseModel):
    email: EmailStr
