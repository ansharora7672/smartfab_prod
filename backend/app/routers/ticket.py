import uuid
import datetime as dt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketPublic
from app.routers.auth import get_current_user # Only for staff routes!
from sqlmodel import func
import logging

logger = logging.getLogger(__name__)
ticket_router = APIRouter()

# Intelligent function to generate the Ticket ID
async def generate_ticket_id(db: AsyncSession) -> str:
    # Get today's date formatted as YYYYMMDD
    today_str = dt.datetime.now().strftime("%Y%m%d")
    prefix = f"SFL-{today_str}-"
    
    # Look in the database for the most recent ticket created TODAY
    statement = select(Ticket).where(Ticket.ticket_id.startswith(prefix)).order_by(Ticket.ticket_id.desc())
    result = await db.execute(statement)
    latest_ticket = result.scalars().first()
    
    if latest_ticket:
        # If a ticket exists today, grab the last 4 digits and add 1
        last_num = int(latest_ticket.ticket_id.split("-")[-1])
        new_num = last_num + 1
    else:
        # If it's the first ticket of the day, start at 0001
        new_num = 1
        
    # Format the number to exactly 4 digits (e.g., 0012)
    return f"{prefix}{new_num:04d}"

# ---------------------------------------------------------
# PUBLIC ENDPOINT - Customers use this from the Website!
# Notice there is NO `Depends(get_current_user)` here!
# ---------------------------------------------------------
@ticket_router.post("/public/tickets/", response_model=TicketPublic, status_code=status.HTTP_201_CREATED)
async def create_ticket(ticket_in: TicketCreate, db: AsyncSession = Depends(get_session)):
    
    # Retry up to 3 times in case two customers submit at the exact same millisecond
    # and generate the same ticket ID (race condition).
    for attempt in range(3):
        try:
            # 1. Generate the perfect ID
            new_ticket_id = await generate_ticket_id(db)
            
            # 2. Prepare the database object instantly with the ID injected
            db_ticket = Ticket(**ticket_in.model_dump(), ticket_id=new_ticket_id)
            db_ticket.status = TicketStatusEnum.PENDING
            
            # 3. Save it forever
            db.add(db_ticket)
            await db.commit()
            await db.refresh(db_ticket)
            
            # (Later we will add the Email Notification trigger right here!)
            
            return db_ticket
            
        except Exception as e:
            await db.rollback()  # Reset the failed transaction
            logger.warning(f"Ticket creation attempt {attempt + 1} failed: {e}")
            if attempt == 2:  # Last attempt failed
                raise HTTPException(
                    status_code=500,
                    detail="Could not generate ticket. Please try again."
                )
            continue  # Try again with a new ID

# ---------------------------------------------------------
# INTERNAL ENDPOINT - Fetch Pending & Claimed Tickets
# ---------------------------------------------------------
@ticket_router.get("/admin/tickets/pending", response_model=list[TicketPublic])
async def get_pending_tickets(db: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    from app.models.user import User # Local import to prevent circular dependency
    
    # Our Outer Join logic: Fetch ALL tickets waiting on a call, and attach the User's name if they exist
    statement = (
        select(Ticket, User.full_name)
        .outerjoin(User, Ticket.assigned_to_id == User.id)
        .where(Ticket.status.in_([TicketStatusEnum.PENDING, TicketStatusEnum.CLAIMED]))
        .order_by(Ticket.created_at.asc())
    )
    result = await db.execute(statement)
    rows = result.all()
    
    # rows is now a list of Tuples (TicketObject, "John Doe")
    # We unpack it and build a perfect dictionary map for Pydantic to validate
    return [
        {**ticket.model_dump(), "assignee_name": name}
        for ticket, name in rows
    ]



# ---------------------------------------------------------
# THE MATH ENGINE - Calculates real-time company capacity
# ---------------------------------------------------------
@ticket_router.get("/public/tickets/available-slots")
async def get_available_slots(db: AsyncSession = Depends(get_session)):
    from app.models.availability import StaffAvailability
    
    today = dt.datetime.now().date()
    now_time = dt.datetime.now().time()  # Current time for filtering past slots today
    end_date = today + dt.timedelta(days=14)
    
    # 1. Total Company Capacity (Count all Staff working per 30-min slot)
    avail_stmt = (
        select(StaffAvailability.date, StaffAvailability.start_time, func.count(StaffAvailability.id))
        .where(StaffAvailability.date >= today)
        .where(StaffAvailability.date <= end_date)
        .group_by(StaffAvailability.date, StaffAvailability.start_time)
    )
    avail_result = await db.execute(avail_stmt)
    avail_counts = avail_result.all() 
    
    # 2. Total Current Bookings (Count all active Tickets per 30-min slot)
    ticket_stmt = (
        select(Ticket.consultation_date, Ticket.consultation_time, func.count(Ticket.id))
        .where(Ticket.consultation_date >= today)
        .where(Ticket.consultation_date <= end_date)
        .where(Ticket.status != TicketStatusEnum.CLOSED) # Ignore old closed tickets
        .group_by(Ticket.consultation_date, Ticket.consultation_time)
    )
    ticket_result = await db.execute(ticket_stmt)
    ticket_counts = ticket_result.all() 
    
    # Convert bookings into a fast dictionary map: "YYYY-MM-DD_HH:MM:SS" -> count
    booked_map = {f"{d.isoformat()}_{t.strftime('%H:%M:%S')}": count for d, t, count in ticket_counts}
        
    # 3. Subtract Bookings from Capacity
    available_dict = {}
    for d, t, capacity in avail_counts:
        date_str = d.isoformat()
        time_str = t.strftime("%H:%M:%S")
        
        # How many tickets are already booked here? (Default to 0)
        booked = booked_map.get(f"{date_str}_{time_str}", 0)
        
        # If we have more staff working than tickets booked, the slot is OPEN!
        if capacity > booked:
            # Fix 11: Don't show slots that have already passed today
            if d == today and t <= now_time:
                continue
                
            if date_str not in available_dict:
                available_dict[date_str] = []
            available_dict[date_str].append(time_str)
            
    return available_dict

# ---------------------------------------------------------
# INTERNAL ENDPOINT - Claim a specific Ticket
# ---------------------------------------------------------
@ticket_router.patch("/admin/tickets/{ticket_id}/claim", response_model=TicketPublic)
async def claim_ticket(
    ticket_id: str, 
    db: AsyncSession = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    from app.models.user import User
    # 1. Look up the ticket by the public SFL ID
    statement = select(Ticket).where(Ticket.ticket_id == ticket_id)
    result = await db.execute(statement)
    ticket = result.scalars().first()
    
    # 2. Critical Safety Checks
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found in the system.")
        
    # We use a strict check here so two people don't claim the exact same ticket on accident!
    if ticket.status != TicketStatusEnum.PENDING:
        raise HTTPException(status_code=400, detail="This ticket has already been claimed or processed.")
        
    # 3. Apply the changes!
    ticket.status = TicketStatusEnum.CLAIMED
    ticket.assigned_to_id = current_user.id
    
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    
    # Return exactly what Pydantic expects so the frontend gets live data
    return {**ticket.model_dump(), "assignee_name": current_user.full_name}