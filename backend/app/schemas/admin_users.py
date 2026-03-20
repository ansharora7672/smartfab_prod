from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

# The data we expect to receive from the Next.js form
class UserCreateRequest(BaseModel):
    email: EmailStr  
    full_name: str
    role: UserRole

# The data we promise to send back to Next.js
class UserCreateResponse(BaseModel):
    message: str
    email: str
    temporary_password: str
