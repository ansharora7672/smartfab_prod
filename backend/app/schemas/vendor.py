import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class VendorCreate(BaseModel):
    vendor_name: str = ""
    company_name: str
    contact_name: str = ""
    email: EmailStr
    phone_number: str = ""
    address: str = ""
    services_offered: list[str] = []


class VendorUpdate(BaseModel):
    vendor_name: str | None = None
    company_name: str | None = None
    contact_name: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = None
    address: str | None = None
    services_offered: list[str] | None = None
    is_active: bool | None = None


class VendorPublic(BaseModel):
    id: uuid.UUID
    vendor_name: str
    company_name: str
    contact_name: str
    email: str
    phone_number: str
    address: str
    services_offered: list[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VendorInquiryRequest(BaseModel):
    subject: str
    item_name: str
    item_description: str = ""
    quantity: int = 1
    message: str = ""
