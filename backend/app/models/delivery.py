import uuid
import datetime as dt
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column
import sqlalchemy as sa


class DeliveryAssignmentStatus(str, Enum):
    PENDING = "PENDING"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"


class DeliveryAssignment(SQLModel, table=True):
    __tablename__ = "delivery_assignments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ticket_id: uuid.UUID = Field(foreign_key="tickets.id", index=True, nullable=False)
    quote_id: uuid.UUID = Field(foreign_key="quotes.id", index=True, nullable=False)
    quote_item_id: uuid.UUID = Field(foreign_key="quote_items.id", index=True, nullable=False)
    driver_id: uuid.UUID = Field(foreign_key="drivers.id", index=True, nullable=False)

    quantity_to_deliver: int = Field(default=1)
    remark: str = Field(default="")
    status: DeliveryAssignmentStatus = Field(default=DeliveryAssignmentStatus.PENDING)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False),
    )


class DeliveryNoteStatus(str, Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"


class DeliveryNote(SQLModel, table=True):
    __tablename__ = "delivery_notes"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    note_no: str = Field(index=True, unique=True, nullable=False)
    version: int = Field(default=1)
    status: DeliveryNoteStatus = Field(default=DeliveryNoteStatus.DRAFT)

    ticket_id: uuid.UUID = Field(foreign_key="tickets.id", index=True, nullable=False)
    quote_id: uuid.UUID = Field(foreign_key="quotes.id", index=True, nullable=False)

    company_name: str = Field(default="")
    address: str = Field(default="")
    phone_number: str = Field(default="")
    order_no: str = Field(default="")
    lpo_no: str = Field(default="")
    note_date: dt.date = Field(default_factory=dt.date.today)

    driver_signature_name: str = Field(default="")

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False),
    )

    items: List["DeliveryNoteItem"] = Relationship(back_populates="delivery_note")


class DeliveryNoteItem(SQLModel, table=True):
    __tablename__ = "delivery_note_items"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    delivery_note_id: uuid.UUID = Field(foreign_key="delivery_notes.id", index=True, nullable=False)
    quote_item_id: Optional[uuid.UUID] = Field(default=None, foreign_key="quote_items.id")

    sr_no: int = Field(nullable=False)
    item_description: str = Field(default="")
    qty: int = Field(default=1)
    remark: str = Field(default="")

    delivery_note: Optional["DeliveryNote"] = Relationship(back_populates="items")
