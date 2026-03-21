import datetime as dt
import uuid
from pydantic import BaseModel, EmailStr, field_validator
from app.models.ticket import TicketStatusEnum

# The raw data shared across different ticket events
class TicketBase(BaseModel):
    customer_name: str
    company_name: str
    company_address: str
    email: EmailStr 
    phone_number: str
    consultation_date: dt.date
    consultation_time: dt.time

# What the Frontend Website sends to our API when "Get a Quote" is clicked
class TicketCreate(TicketBase):
    
    # This automatically intercepts the user's phone number as it comes in
    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        # Check if they stripped the '+' or used 00971
        cleaned = v.replace(" ", "")
        if not cleaned.startswith("+971"):
            raise ValueError("SmartFab Lathe only accepts UAE physical phone numbers starting with +971")
        return cleaned

# What the API returns back to the Frontend (includes system-generated data!)
class TicketPublic(TicketBase):
    id: uuid.UUID
    ticket_id: str
    created_at: dt.datetime
    status: TicketStatusEnum
    assigned_to_id: uuid.UUID | None = None
