import uuid
from pydantic import BaseModel, EmailStr

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
