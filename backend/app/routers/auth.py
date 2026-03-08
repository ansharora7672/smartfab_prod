from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models import User, UserRole
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth import hash_password, verify_password, create_access_token

from fastapi.responses import JSONResponse


from jose import jwt
from app.config import settings


# Create a router with prefix /api/auth
# All routes in this file will start with /api/auth
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
async def register_user(
    data: UserRegister,
    session: AsyncSession = Depends(get_session)
):
    """
    Register a new admin or staff user.
    
    Depends(get_session) is dependency injection:
    FastAPI automatically creates a database session,
    passes it to this function, and closes it when done.
    """

    # Check if email already exists
    statement = select(User).where(User.email == data.email)
    result = await session.execute(statement)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user with hashed password
    new_user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole(data.role),
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return new_user


@router.post("/login")
async def login_user(
    data: UserLogin,
    session: AsyncSession = Depends(get_session)
):
    statement = select(User).where(User.email == data.email)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
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

    

@router.get("/me")
async def get_current_user(request: Request):
    """
    Returns the current user info from the cookie.
    The frontend calls this on page load to check auth.
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
        return {
            "id": payload["sub"],
            "email": payload["email"],
            "role": payload["role"],
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/logout")
async def logout_user():
    """Clear the auth cookie."""
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token")
    return response
