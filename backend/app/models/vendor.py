import uuid
from datetime import datetime, timezone
from typing import List, TYPE_CHECKING

from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

if TYPE_CHECKING:
    from app.models.quote import QuoteItem


class Vendor(SQLModel, table=True):
    __tablename__ = "vendors"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    vendor_name: str = Field(default="", index=True)
    company_name: str = Field(index=True, nullable=False)
    contact_name: str = Field(default="")
    email: str = Field(index=True, nullable=False)
    phone_number: str = Field(default="")
    address: str = Field(default="")
    services_offered: list[str] = Field(
        default_factory=list,
        sa_column=Column(JSONB)
    )
    is_active: bool = Field(default=True)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(sa.DateTime(timezone=True), nullable=False),
    )

    assigned_items: List["QuoteItem"] = Relationship(back_populates="assigned_vendor")
