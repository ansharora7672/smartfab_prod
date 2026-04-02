import datetime as dt
from typing import List

from fastapi import APIRouter, Depends, status
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.database import get_session
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.availability import StaffAvailability
from app.schemas.availability import SetAvailabilityRequest, AvailabilitySlot

# We use the /admin/ prefix so ONLY logged-in Staff and Admins can use this route!
router = APIRouter(prefix="/admin/availability", tags=["Staff Availability"])


@router.get("/", response_model=List[AvailabilitySlot])
async def get_my_availability(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Frontend calls this when the page loads. 
    It asks the Database: 'Give me all slots for THIS user that are in the future.'
    """
    today = dt.date.today()
    
    query = select(StaffAvailability).where(
        StaffAvailability.user_id == current_user.id,
        StaffAvailability.date >= today
    )
    result = await db.execute(query)
    slots = result.scalars().all()
    
    return slots


@router.post("/", status_code=status.HTTP_200_OK)
async def set_my_availability(
    data: SetAvailabilityRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Frontend calls this when they click 'Save'.
    We WIPE all future slots clean, then INSERT the new ones.
    """
    today = dt.date.today()
    
    # 1. Wipe the slate clean
    delete_stmt = delete(StaffAvailability).where(
        StaffAvailability.user_id == current_user.id,
        StaffAvailability.date >= today
    )
    await db.execute(delete_stmt)
        
    # 2. Insert the new blue boxes from the frontend UI
    for slot_data in data.slots:
        # Extra safety check: Don't let a hacker save a slot from yesterday
        if slot_data.date >= today:
            new_slot = StaffAvailability(
                user_id=current_user.id,
                date=slot_data.date,
                start_time=slot_data.start_time
            )
            db.add(new_slot)
            
    await db.commit()
    return {"message": "Availability updated successfully!"}
