import datetime as dt
from typing import List
from pydantic import BaseModel

# 1. This represents a single valid slot the staff clicked on the UI
class AvailabilitySlot(BaseModel):
    date: dt.date
    start_time: dt.time

# 2. This is the exact payload the Frontend sends to the Backend on 'Save'
class SetAvailabilityRequest(BaseModel):
    slots: List[AvailabilitySlot]

# 3. We will use this later for what the public customer sees on the booking page
class PublicSlotResponse(BaseModel):
    date: dt.date
    start_time: dt.time
    available_capacity: int
