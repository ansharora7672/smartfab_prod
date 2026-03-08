"""
User model - represents admin and staff users in the system.

This is the foundation for authentication and authorization.
All internal users (admins and staff) are stored here.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String
import sqlalchemy as sa

class UserRole(str, Enum):
    """
    User roles in the system.
    
    str, Enum means each value is BOTH a string and an enum.
    This lets us store it as a string in the database ("ADMIN")
    but also get type safety in Python code.
    
    From SPEC:
    - ADMIN: full system access, manage staff, vendors, drivers
    - STAFF: handle inquiries, consultations, quotes, production
    """
    ADMIN = "ADMIN"
    STAFF = "STAFF"


class User(SQLModel, table=True):
    """
    Database table for internal users (admins and staff).
    
    SQLModel with table=True means this class IS a database table.
    Each attribute becomes a column. SQLModel combines:
    - SQLAlchemy (database ORM)
    - Pydantic (data validation)
    
    So this one class handles BOTH database operations AND
    request/response validation.
    """
    __tablename__ = "users"

    # Primary key - UUID instead of auto-increment integer.
    # WHY UUID? 
    # 1. Doesn't reveal how many users exist (security)
    # 2. Can be generated client-side without DB round-trip
    # 3. Safe to merge data between databases
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )

    email: str = Field(
        sa_column=Column(String, unique=True, index=True, nullable=False)
    )

    # NEVER store plain text passwords. This stores the bcrypt hash.
    hashed_password: str = Field(nullable=False)

    full_name: str = Field(nullable=False)

    role: UserRole = Field(default=UserRole.STAFF)

    is_active: bool = Field(default=True)

    # Timestamps - timezone-aware UTC
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False)
    )


