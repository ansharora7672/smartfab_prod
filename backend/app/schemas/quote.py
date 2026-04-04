from pydantic import BaseModel
from typing import List, Optional
import datetime as dt
import uuid

from app.models.quote import QuoteStatusEnum

# ----------------------------------------------------
# Quote Items
# ----------------------------------------------------
class QuoteItemBase(BaseModel):
    sr_no: int
    description_of_service: str
    quantity: int
    per: str
    rate_excl_vat: float
    rate_incl_vat: float
    discount_aed: float
    vat_percentage: float
    amount: float
    total_incl_vat: float

class QuoteItemCreate(QuoteItemBase):
    pass

class QuoteItemResponse(QuoteItemBase):
    id: uuid.UUID
    quote_id: uuid.UUID

# ----------------------------------------------------
# Quotes
# ----------------------------------------------------
class QuoteBase(BaseModel):
    ticket_id: uuid.UUID
    delivery_note: Optional[str] = ""
    payment_terms: Optional[str] = ""
    supplier_reference: Optional[str] = ""
    other_references: Optional[str] = ""
    delivery_note_date: Optional[dt.date] = None
    despatched_through: Optional[str] = ""
    destination: Optional[str] = ""
    terms_of_delivery: Optional[str] = ""
    amount_chargeable_words: str = ""
    taxable_value: float = 0.0
    vat_total: float = 0.0
    invoice_total: float = 0.0

class QuoteCreate(QuoteBase):
    items: List[QuoteItemCreate]

class QuoteResponse(QuoteBase):
    id: uuid.UUID
    invoice_no: str
    status: QuoteStatusEnum
    created_at: dt.datetime
    updated_at: dt.datetime
    items: List[QuoteItemResponse] = []
