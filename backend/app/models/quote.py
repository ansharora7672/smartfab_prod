import uuid
from datetime import datetime, timezone
import datetime as dt
from enum import Enum
from typing import List, Optional

from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column
import sqlalchemy as sa


class QuoteStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    MODIFICATION_REQUESTED = "MODIFICATION_REQUESTED"


class Quote(SQLModel, table=True):
    __tablename__ = "quotes"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Links to the Consultation Ticket
    ticket_id: uuid.UUID = Field(foreign_key="tickets.id", index=True, nullable=False)
    
    # Official tracking
    invoice_no: str = Field(index=True, unique=True, nullable=False)
    
    # Form Meta Data
    delivery_note: Optional[str] = Field(default="")
    payment_terms: Optional[str] = Field(default="")
    supplier_reference: Optional[str] = Field(default="")
    other_references: Optional[str] = Field(default="")
    delivery_note_date: Optional[dt.date] = Field(default=None)
    despatched_through: Optional[str] = Field(default="")
    destination: Optional[str] = Field(default="")
    terms_of_delivery: Optional[str] = Field(default="")
    
    # Subtotals
    amount_chargeable_words: str = Field(default="")
    taxable_value: float = Field(default=0.0)
    vat_total: float = Field(default=0.0)
    invoice_total: float = Field(default=0.0)
    
    status: QuoteStatusEnum = Field(default=QuoteStatusEnum.DRAFT)
    
    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False)
    )
    
    # Relationships
    items: List["QuoteItem"] = Relationship(back_populates="quote")


class QuoteItem(SQLModel, table=True):
    __tablename__ = "quote_items"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quote_id: uuid.UUID = Field(foreign_key="quotes.id", index=True, nullable=False)
    
    # The actual vendor assigned during Active Order phase can be tracked here later
    # assigned_vendor_id: Optional[uuid.UUID] = Field(foreign_key="vendors.id", default=None)
    
    sr_no: int
    description_of_service: str
    quantity: int
    per: str  # e.g., 'pcs', 'kg'
    
    rate_excl_vat: float
    rate_incl_vat: float
    discount_aed: float = Field(default=0.0)
    vat_percentage: float = Field(default=5.0)  # Standard UAE VAT is 5%
    
    amount: float
    total_incl_vat: float
    
    # Relationships
    quote: Quote = Relationship(back_populates="items")
