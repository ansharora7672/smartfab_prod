import uuid
import datetime as dt  # <--- Add this at the top!
from datetime import datetime, timezone

from sqlmodel import SQLModel, Field
from sqlalchemy import Column
import sqlalchemy as sa


class StaffAvailability(SQLModel, table=True):
    # This is the name of the table in PostgreSQL
    __tablename__ = "staff_availability"

    # Every row needs a unique ID
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )

    # Which staff member this belongs to
    user_id: uuid.UUID = Field(
        foreign_key="users.id", 
        index=True, 
        nullable=False
    )

    #What day and time did they select?
    date: dt.date = Field(index=True, nullable=False)
    start_time: dt.time = Field(index=True, nullable=False)


    # Timestamps - timezone-aware UTC.. When did they click 'save' in our system?
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False)
    )
