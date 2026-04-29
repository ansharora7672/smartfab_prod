import uuid
from datetime import datetime
from pydantic import BaseModel


class DriverCreate(BaseModel):
    full_name: str
    email: str = ""
    phone_number: str
    vehicle_number: str = ""
    vehicle_type: str = ""


class DriverUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone_number: str | None = None
    vehicle_number: str | None = None
    vehicle_type: str | None = None
    is_active: bool | None = None


class DriverPublic(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone_number: str
    vehicle_number: str
    vehicle_type: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
