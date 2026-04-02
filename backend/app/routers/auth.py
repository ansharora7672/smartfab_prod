from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models import User, UserRole
from app.schemas.auth import UserLogin, TokenResponse, UserResponse, ChangePasswordRequest
from app.services.auth import hash_password, verify_password, create_access_token

from fastapi.responses import JSONResponse


from jose import jwt
from app.config import settings

# THE REAL DEPENDENCY — other routers import THIS
async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    This is a DEPENDENCY, not a route.
    
    Why separate from the /me route?
    - A dependency is injected by FastAPI into any endpoint that does Depends(get_current_user)
    - It returns the ACTUAL User object from the database, not just a dict
    - This means we can check is_active, get full_name, etc.
    - If the user was deactivated after login, this catches it immediately
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Actually fetch the user from database — this is the key difference!
    user_id = payload.get("sub")
    statement = select(User).where(User.id == user_id)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    
    return user  # Returns the REAL User model object!


# Create a router with prefix /api/auth
# All routes in this file will start with /api/auth
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# LOGIN USER. IT WILL SEND THE ACCESS TOKEN IN THE FORM OF HTTP-ONLY COOKIE. ALSO SEND THE USER INFO IN THE RESPONSE BODY.
@router.post("/login")
async def login_user(
    data: UserLogin,
    session: AsyncSession = Depends(get_session)
):
    # Check if email exists
    statement = select(User).where(User.email == data.email)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    # Check if email or password is correct
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    # Create access token
    token = create_access_token(
        user_id=str(user.id),
        email=user.email,
        role=user.role.value,
    )
    # Create response with user info
    response = JSONResponse(content={
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
    })
    # Set HTTP-only cookie (JS cannot access this)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,       # JS cannot read it
        secure=False,        # Set True in production (HTTPS only)
        samesite="lax",      # Prevents CSRF from other sites
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return response

# GET CURRENT USER INFO — Frontend calls this on every page load to check "am I logged in?"
@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """
    This ROUTE uses the get_current_user DEPENDENCY above.
    The dependency does the heavy lifting (JWT decode + DB fetch + is_active check).
    This route just formats the response for the frontend.
    """
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
    }

# LOGOUT USER. IT WILL DELETE THE ACCESS TOKEN FROM THE COOKIE.
@router.post("/logout")
async def logout_user():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token")
    return response

# CHANGE PASSWORD
# Now that get_current_user returns the REAL User object from DB,
# we don't need to fetch the user again! The dependency already did it.
@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify their old (temporary) password is correct
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    # Hash the NEW password and update the database!
    current_user.hashed_password = hash_password(data.new_password)
    session.add(current_user)
    await session.commit()
    
    return {"message": "Password updated successfully!"}
