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
    item_description: str
    qty: int
    u_price: float
    total_amount: float

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
    company_name: str
    address: str
    phone_no: str
    lpo_no: Optional[str] = ""
    lead_time_approx: str = ""

class QuoteCreate(QuoteBase):
    items: List[QuoteItemCreate]

class OverrideStatusRequest(BaseModel):
    new_status: QuoteStatusEnum

class QuoteResponse(QuoteBase):
    id: uuid.UUID
    quote_no: str
    quote_date: dt.date
    status: QuoteStatusEnum
    created_at: dt.datetime
    updated_at: dt.datetime
    items: List[QuoteItemResponse] = []
