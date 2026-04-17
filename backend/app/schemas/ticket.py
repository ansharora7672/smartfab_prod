import datetime as dt
import uuid
from pydantic import BaseModel, EmailStr, field_validator, Field
from app.models.ticket import TicketStatusEnum

# The raw data shared across different ticket events
class TicketBase(BaseModel):
    customer_name: str = Field(min_length=1, max_length=150)
    company_name: str = Field(min_length=1, max_length=200)
    company_address: str = Field(min_length=1, max_length=500)
    email: EmailStr 
    phone_number: str = Field(min_length=8, max_length=20)
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
    assignee_name: str | None = None

# Used for admin ticket assignment — keeps user_id in the request body, not the URL
class TicketAssignRequest(BaseModel):
    user_id: uuid.UUID
