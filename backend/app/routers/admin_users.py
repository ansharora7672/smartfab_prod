# this file is for admin users which allows them to use the staff_management feature in the UI.

import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.user import User, UserRole  

# FIXED IMPORTS: Loading your exact security and database files!
from app.services.auth import hash_password 
from app.database import get_session
from app.routers.auth import get_current_user
from app.schemas.admin_users import UserCreateRequest, UserCreateResponse


router = APIRouter(prefix="/admin/users", tags=["Admin Users"])

# endpoint to create a new staff/admin user
@router.post("/", response_model=UserCreateResponse)
async def create_staff_user(
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_session),              # Use your get_session
    current_user: dict = Depends(get_current_user)        # Your get_current_user returns a dictionary!
):
    # Security Check: Ensure ONLY Admins can hit this endpoint
    # Your get_current_user returns {"id": "...", "email": "...", "role": "..."}
    if current_user.get("role") != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized. Admin access required."
        )
    
    # Generate a secure 12-character temporary password
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))
    
    # Save the new user to the database
    new_user = User(
        email=data.email.lower(),
        full_name=data.full_name,
        role=data.role,
        hashed_password=hash_password(temp_password)   
    )
    
    db.add(new_user)
    await db.commit()
    
    # Return the temporary password using the response schema
    return UserCreateResponse(
        message=f"{data.role.value} - {data.full_name} created successfully!",
        email=data.email,
        temporary_password=temp_password
    )
