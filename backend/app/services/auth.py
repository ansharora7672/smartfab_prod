from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from app.config import settings

# HASH PASSWORD FUNCTION
def hash_password(plain_password: str) -> str:

    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")

# VERIFY PASSWORD FUNCTION
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )

# CREATE ACCESS TOKEN FUNCTION  
def create_access_token(user_id: str, email: str, role: str) -> str:

    # SET EXPIRATION TIME
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # CREATE PAYLOAD
    payload = {
        "sub": user_id,   
        "email": email,
        "role": role,
        "exp": expire,         
    }

    # ENCODE TOKEN
    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return token
