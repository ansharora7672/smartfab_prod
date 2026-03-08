from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from app.config import settings


def hash_password(plain_password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    
    bcrypt automatically adds a random "salt" (extra random data)
    so even identical passwords produce different hashes.
    
    "password123" -> "$2b$12$LJ3m4ys..." (different every time)
    """
    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if a plain password matches a stored hash.
    
    bcrypt.checkpw does the comparison securely
    (constant-time comparison to prevent timing attacks).
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_access_token(user_id: str, email: str, role: str) -> str:
    """
    Create a JWT access token.
    
    The token contains a "payload" with user info.
    It's SIGNED with our secret key so nobody can tamper with it.
    
    Inside the token (decoded):
    {
        "sub": "user-uuid-here",     # who is this
        "email": "admin@smartfab.com",
        "role": "ADMIN",
        "exp": 1712345678           # when it expires
    }
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,        # "sub" = subject (standard JWT claim)
        "email": email,
        "role": role,
        "exp": expire,         # expiration time
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return token
