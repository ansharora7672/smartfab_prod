import uuid
import datetime as dt
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column
import sqlalchemy as sa
from enum import Enum
from typing import Optional

class TicketStatusEnum(str, Enum):
    PENDING = "PENDING"
    CLAIMED = "CLAIMED"
    CALL_COMPLETED = "CALL_COMPLETED"
    IN_QUOTE_PREPARATION = "IN_QUOTE_PREPARATION"
    ACTIVE_ORDER = "ACTIVE_ORDER" # Triggers when the LPO is received!
    CLOSED = "CLOSED"

class Ticket(SQLModel, table=True):
    __tablename__ = "tickets" 
    
    # Internal DB ID
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Public ID formatting (SFL-YYYYMMDD-XXXX)
    ticket_id: str = Field(unique=True, index=True)
    
    # Auto-stamp the exact moment of booking (timezone-aware UTC)
    created_at: dt.datetime = Field(
        default_factory=lambda: dt.datetime.now(dt.timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False)
    )
    
    # Form Details
    customer_name: str
    company_name: str
    email: str
    phone_number: str 
    company_address: str
    
    # Booking
    consultation_date: dt.date
    consultation_time: dt.time
    
    status: TicketStatusEnum = Field(default=TicketStatusEnum.PENDING)
    
    # Links to the staff member who claims it
    assigned_to_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    
    # Scheduler notification tracking — prevents duplicate emails
    reminder_sent_at: Optional[dt.datetime] = Field(
        default=None,
        sa_column=Column(sa.DateTime(timezone=True), nullable=True)
    )
    completion_prompt_sent_at: Optional[dt.datetime] = Field(
        default=None,
        sa_column=Column(sa.DateTime(timezone=True), nullable=True)
    )
