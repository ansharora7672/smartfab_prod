from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
from typing import List
from datetime import datetime
import uuid

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


# What a single user looks like in the table
class UserListItem(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


# The response wrapping a list of users + total count
class UserListResponse(BaseModel):
    users: List[UserListItem]
    total: int

# Schema for updating a user's role
class UserRoleUpdateRequest(BaseModel):
    role: UserRole

# Schema for updating a user's active status
class UserStatusUpdateRequest(BaseModel):
    is_active: bool