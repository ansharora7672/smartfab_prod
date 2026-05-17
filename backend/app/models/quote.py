import uuid
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

class ProductionStatusEnum(str, Enum):
    ORDER_RECEIVED = "ORDER_RECEIVED"
    VENDOR_ASSIGNED = "VENDOR_ASSIGNED"
    IN_PRODUCTION = "IN_PRODUCTION"
    QUALITY_CHECK = "QUALITY_CHECK"
    READY_FOR_DELIVERY = "READY_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"


class Quote(SQLModel, table=True):
    __tablename__ = "quotes"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Links to the Consultation Ticket
    ticket_id: uuid.UUID = Field(foreign_key="tickets.id", index=True, nullable=False)

    # Official Quote Reference / Order No
    quote_no: str = Field(index=True, unique=True, nullable=False)

    # --- PDF Header Fields based on SmartFab_Quotation.pdf ---
    company_name: str
    address: str
    phone_no: str
    quote_date: dt.date = Field(default_factory=dt.date.today)

    # LPO might be empty initially, filled when client sends it
    lpo_no: Optional[str] = Field(default="")
    lead_time_approx: str = Field(default="")

    # Status & Timestamps
    status: QuoteStatusEnum = Field(default=QuoteStatusEnum.DRAFT)

    # Ticket-level production stage — set explicitly by admin via "Order Stage" dropdown.
    # Stored as plain VARCHAR to avoid SQLModel enum-mapping issues with the ALTER TABLE column.
    # NULL means not yet set; endpoints fall back to computing from items in that case.
    order_production_status: Optional[str] = Field(
        default=None,
        sa_column=Column(sa.String, nullable=True)
    )
    
    created_at: dt.datetime = Field(
        default_factory=lambda: dt.datetime.now(dt.timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False)
    )
    updated_at: dt.datetime = Field(
        default_factory=lambda: dt.datetime.now(dt.timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False)
    )
    
    # Relationships
    items: List["QuoteItem"] = Relationship(back_populates="quote")


class QuoteItem(SQLModel, table=True):
    __tablename__ = "quote_items"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quote_id: uuid.UUID = Field(foreign_key="quotes.id", index=True, nullable=False)
    
    # --- PDF Table Fields ---
    sr_no: int
    item_description: str
    qty: int
    u_price: float
    total_amount: float
    
    # Active Order Tracking (Vendor / Production)
    vendor_id: Optional[uuid.UUID] = Field(default=None, foreign_key="vendors.id")
    production_status: ProductionStatusEnum = Field(default=ProductionStatusEnum.ORDER_RECEIVED)
    
    # Relationships
    quote: Quote = Relationship(back_populates="items")
    assigned_vendor: Optional["Vendor"] = Relationship(back_populates="assigned_items")
