# this file is for admin users which allows them to use the staff_management feature in the UI.

import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.user import User, UserRole  
from sqlmodel import select

from app.services.auth import hash_password 
from app.database import get_session
from app.routers.auth import get_current_user
from app.schemas.admin_users import UserCreateRequest, UserCreateResponse, UserListResponse, UserListItem, UserRoleUpdateRequest, UserStatusUpdateRequest
import uuid as uuid_lib
from datetime import datetime, timezone
from app.services.emails import send_welcome_email



router = APIRouter(prefix="/admin/users", tags=["Admin Users"])

# endpoint to create a new staff/admin user
@router.post("/", response_model=UserCreateResponse)
async def create_staff_user(
    data: UserCreateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
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
    # Send welcome email in background (doesn't block the response)
    background_tasks.add_task(
        send_welcome_email,
        to_email=data.email.lower(),
        full_name=data.full_name,
        temp_password=temp_password,
    )

    
    # Return the temporary password using the response schema
    return UserCreateResponse(
        message=f"{data.role.value} - {data.full_name} created successfully!",
        email=data.email,
        temporary_password=temp_password
    )


# endpoint to get all users (Admin only)
@router.get("/", response_model=UserListResponse)
async def get_all_users(
    db: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    # Security Check: Only admins can see the full user list
    if current_user.get("role") != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Admin access required."
        )
    # Query ALL users from the database
    statement = select(User).order_by(User.created_at.desc())
    result = await db.execute(statement)
    users = result.scalars().all()
    # Convert each User model into a UserListItem schema
    user_list = [
        UserListItem(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role.value,
            is_active=u.is_active,
            created_at=u.created_at,
            updated_at=u.updated_at,
        )
        for u in users
    ]
    return UserListResponse(users=user_list, total=len(user_list))


# endpoint to change a user's role (Admin only)
@router.patch("/{user_id}/role")
async def update_user_role(
    user_id: uuid_lib.UUID,
    data: UserRoleUpdateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    # Security Check
    if current_user.get("role") != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Admin access required."
        )

    # Prevent admin from changing their own role (safety check)
    if current_user.get("id") == str(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role."
        )

    # Find the user in the database
    statement = select(User).where(User.id == user_id)
    result = await db.execute(statement)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If demoting an ADMIN to STAFF, make sure they're not the last admin
    if user.role == UserRole.ADMIN and data.role == UserRole.STAFF:
        admin_count_stmt = select(User).where(User.role == UserRole.ADMIN, User.is_active == True)
        admin_result = await db.execute(admin_count_stmt)
        admin_count = len(admin_result.scalars().all())
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last active admin. Promote another user first."
            )

    # Update the role and timestamp
    user.role = data.role
    user.updated_at = datetime.now(timezone.utc)
    db.add(user)
    await db.commit()

    return {"message": f"Role updated to {data.role.value} successfully"}


# endpoint to activate/deactivate a user (Admin only)
@router.patch("/{user_id}/status")
async def update_user_status(
    user_id: uuid_lib.UUID,
    data: UserStatusUpdateRequest,
    db: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    # Security Check
    if current_user.get("role") != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Admin access required."
        )
    # Prevent admin from deactivating themselves
    if current_user.get("id") == str(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account."
        )
    # Find the user
    statement = select(User).where(User.id == user_id)
    result = await db.execute(statement)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # If deactivating an admin, make sure they're not the last active admin
    if user.role == UserRole.ADMIN and data.is_active == False:
        admin_count_stmt = select(User).where(User.role == UserRole.ADMIN, User.is_active == True)
        admin_result = await db.execute(admin_count_stmt)
        admin_count = len(admin_result.scalars().all())
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the last active admin."
            )
    # Update status and timestamp
    user.is_active = data.is_active
    user.updated_at = datetime.now(timezone.utc)
    db.add(user)
    await db.commit()
    status_text = "activated" if data.is_active else "deactivated"
    return {"message": f"User {user.full_name} {status_text} successfully"}