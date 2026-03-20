import uuid
from datetime import datetime, timezone, date, time

from sqlmodel import SQLModel, Field
from sqlalchemy import Column
import sqlalchemy as sa


class StaffAvailability(SQLModel, table=True):
    __tablename__ = "staff_availability"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )

    user_id: uuid.UUID = Field(
        foreign_key="users.id", 
        index=True, 
        nullable=False
    )

    date: date = Field(index=True, nullable=False)
    start_time: time = Field(index=True, nullable=False)

    # Timestamps - timezone-aware UTC
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False)
    )
