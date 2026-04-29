import uuid
import datetime as dt
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.delivery import DeliveryAssignmentStatus


class DeliveryAssignmentCreate(BaseModel):
    ticket_id: uuid.UUID
    quote_id: uuid.UUID
    quote_item_id: uuid.UUID
    driver_id: uuid.UUID
    quantity_to_deliver: int = 1
    remark: str = ""


class DeliveryAssignmentUpdate(BaseModel):
    status: DeliveryAssignmentStatus
    remark: str = ""


class DeliveryAssignmentPublic(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    quote_id: uuid.UUID
    quote_item_id: uuid.UUID
    driver_id: uuid.UUID
    quantity_to_deliver: int
    remark: str
    status: DeliveryAssignmentStatus
    created_at: datetime


class DeliveryNoteItemCreate(BaseModel):
    quote_item_id: Optional[uuid.UUID] = None
    sr_no: int
    item_description: str
    qty: int
    remark: str = ""


class DeliveryNoteCreate(BaseModel):
    ticket_id: uuid.UUID
    quote_id: uuid.UUID
    company_name: str = ""
    address: str = ""
    phone_number: str = ""
    lpo_no: str = ""
    note_date: dt.date
    driver_signature_name: str = ""
    items: List[DeliveryNoteItemCreate] = []


class VendorAssignRequest(BaseModel):
    vendor_id: uuid.UUID
    production_status: str = "VENDOR_ASSIGNED"
