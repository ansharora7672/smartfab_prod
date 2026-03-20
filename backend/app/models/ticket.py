import uuid
from datetime import datetime, timezone, date, time
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String
import sqlalchemy as sa


class TicketStatus(str, Enum):
    PENDING = "PENDING"
    CLAIMED = "CLAIMED"
    CALL_COMPLETED = "CALL_COMPLETED"
    IN_QUOTE_PREPARATION = "IN_QUOTE_PREPARATION"
    CLOSED = "CLOSED"


class Ticket(SQLModel, table=True):
    __tablename__ = "tickets"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )

    ticket_number: str = Field(
        sa_column=Column(String, unique=True, index=True, nullable=False)
    )

    customer_name: str = Field(nullable=False)
    company_name: str = Field(nullable=False)
    company_address: str = Field(nullable=False)
    email: str = Field(nullable=False)
    phone: str = Field(nullable=False)

    consultation_date: date = Field(nullable=False)
    consultation_start_time: time = Field(nullable=False)

    status: TicketStatus = Field(default=TicketStatus.PENDING)

    # Optional assignment to a staff or admin member
    assigned_to: Optional[uuid.UUID] = Field(
        default=None, foreign_key="users.id", nullable=True
    )

    # Timestamps - timezone-aware UTC
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False)
    )
