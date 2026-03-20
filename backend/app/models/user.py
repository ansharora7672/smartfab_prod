import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String
import sqlalchemy as sa

# USER ROLE ENUM admin or staff
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"

# USER TABLE IN THE DATABASE. THIS CLASS CAN HANDLE BOTH DATABASE OPERATIONS AND REQUEST/RESPONSE VALIDATION
class User(SQLModel, table=True):

    __tablename__ = "users"

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


