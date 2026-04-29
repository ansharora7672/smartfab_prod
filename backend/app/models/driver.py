import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel
from sqlalchemy import Column
import sqlalchemy as sa


class Driver(SQLModel, table=True):
    __tablename__ = "drivers"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    full_name: str = Field(index=True, nullable=False)
    email: str = Field(default="")
    phone_number: str = Field(default="", nullable=False)
    vehicle_number: str = Field(default="")
    vehicle_type: str = Field(default="")
    is_active: bool = Field(default=True)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False),
    )
