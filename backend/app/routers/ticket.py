import uuid
import datetime as dt
import logging

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func, update
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from app.database import get_session
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.user import User, UserRole
from app.schemas.ticket import TicketCreate, TicketPublic, TicketAssignRequest
from app.routers.auth import get_current_user
from app.services.emails import send_ticket_lifecycle_notification

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
        # If a ticket exists today, grab the last digits and add 1
        last_num = int(latest_ticket.ticket_id.split("-")[-1])
        new_num = last_num + 1
    else:
        # If it's the first ticket of the day, start at 1000
        new_num = 1000
        
    # Format the number to exactly 4 digits (e.g., 1000, 1001)
    return f"{prefix}{new_num:04d}"

# ---------------------------------------------------------
# PUBLIC ENDPOINT - Customers use this from the Website!
# Notice there is NO `Depends(get_current_user)` here!
# ---------------------------------------------------------
@ticket_router.post("/public/tickets/", response_model=TicketPublic, status_code=status.HTTP_201_CREATED)
@limiter.limit("15/minute")
async def create_ticket(
    request: Request,
    ticket_in: TicketCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session)
):
    
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
            
            
            
            users_stmt = select(User).where(
                User.is_active == True,
                User.role.in_([UserRole.ADMIN, UserRole.STAFF])
            )
            users_res = await db.execute(users_stmt)
            all_users = users_res.scalars().all()
            
            for u in all_users:
                background_tasks.add_task(
                    send_ticket_lifecycle_notification,
                    u.email,
                    "NEW_TICKET_ALERT",
                    {"ticket": db_ticket, "user": u}
                )
            
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
# INTERNAL ENDPOINT - Fetch Transition Stage Tickets
# ---------------------------------------------------------
@ticket_router.get("/admin/tickets/transition")
async def get_transition_tickets(
    db: AsyncSession = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    
    # We outer-join the User table just like the pending endpoint
    # so we know exactly WHICH staff member is assigned to this transition!
    statement = (
        select(Ticket, User.full_name)
        .outerjoin(User, Ticket.assigned_to_id == User.id)
        .where(
            Ticket.status.in_([
                TicketStatusEnum.CALL_COMPLETED, 
                TicketStatusEnum.IN_QUOTE_PREPARATION
            ])
        )
        .order_by(Ticket.created_at.desc()) # Newest updates at the top
    )
    
    result = await db.execute(statement)
    rows = result.all()
    
    # For each ticket, also fetch the most recent quote (if one exists)
    # This lets the frontend show "Preview / Edit / Send" vs "Generate Quote"
    from app.models.quote import Quote
    
    response = []
    for ticket, assignee_name in rows:
        # Get ALL quotes for this ticket (newest first) for version history
        all_quotes_stmt = (
            select(Quote)
            .where(Quote.ticket_id == ticket.id)
            .order_by(Quote.created_at.desc())
        )
        all_quotes_result = await db.execute(all_quotes_stmt)
        all_quotes = all_quotes_result.scalars().all()
        
        ticket_dict = {
            **ticket.model_dump(),
            "assignee_name": assignee_name,
            # Include LPO tracking fields for visibility
            "lpo_number": ticket.lpo_number,
            "approved_quote_id": str(ticket.approved_quote_id) if ticket.approved_quote_id else None,
            "quote_approved_at": ticket.quote_approved_at.isoformat() if ticket.quote_approved_at else None,
        }
        
        # Build quote summaries
        from app.models.quote import QuoteItem
        quotes_list = []
        for q in all_quotes:
            items_stmt = select(func.sum(QuoteItem.total_amount)).where(QuoteItem.quote_id == q.id)
            items_res = await db.execute(items_stmt)
            total = items_res.scalar() or 0.0
            
            quotes_list.append({
                "id": str(q.id),
                "quote_no": q.quote_no,
                "status": q.status.value,
                "invoice_total": total,
                "created_at": q.created_at.isoformat(),
            })
        
        # latest_quote = first in the list (already sorted desc), backward compat
        ticket_dict["quote"] = quotes_list[0] if quotes_list else None
        ticket_dict["quotes"] = quotes_list
        
        response.append(ticket_dict)
    
    return response

# ---------------------------------------------------------
# INTERNAL ENDPOINT - Fetch Completed (CLOSED) Tickets with Invoice summaries
# ---------------------------------------------------------
@ticket_router.get("/admin/tickets/completed")
async def get_completed_tickets(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    from app.models.invoice import Invoice, InvoiceItem
    from app.models.quote import Quote, QuoteItem, QuoteStatusEnum

    statement = (
        select(Ticket, User.full_name)
        .outerjoin(User, Ticket.assigned_to_id == User.id)
        .where(Ticket.status == TicketStatusEnum.CLOSED)
        .order_by(Ticket.updated_at.desc())
    )
    result = await db.execute(statement)
    rows = result.all()

    response = []
    for ticket, assignee_name in rows:
        # Fetch the most recent invoice for this ticket
        inv_stmt = select(Invoice).where(Invoice.ticket_id == ticket.id).order_by(Invoice.created_at.desc())
        inv_res = await db.execute(inv_stmt)
        invoice = inv_res.scalars().first()

        invoice_summary = None
        if invoice:
            invoice_summary = {
                "id": str(invoice.id),
                "invoice_no": invoice.invoice_no,
                "status": invoice.status.value,
                "invoice_total": invoice.invoice_total,
                "vat_total": invoice.vat_total,
                "taxable_value": invoice.taxable_value,
                "payment_terms": invoice.payment_terms,
                "created_at": invoice.created_at.isoformat(),
            }

        # Fetch approved quote item count
        item_count = 0
        if ticket.approved_quote_id:
            items_stmt = select(func.count(QuoteItem.id)).where(QuoteItem.quote_id == ticket.approved_quote_id)
            items_res = await db.execute(items_stmt)
            item_count = items_res.scalar() or 0

        # For declined tickets (no approved quote), fetch the rejected quote summary
        declined_quote = None
        if not ticket.approved_quote_id:
            rejected_stmt = (
                select(Quote)
                .where(Quote.ticket_id == ticket.id, Quote.status == QuoteStatusEnum.REJECTED)
                .order_by(Quote.updated_at.desc())
            )
            rejected_res = await db.execute(rejected_stmt)
            rejected_quote_obj = rejected_res.scalars().first()
            if rejected_quote_obj:
                total_stmt = select(func.sum(QuoteItem.total_amount)).where(QuoteItem.quote_id == rejected_quote_obj.id)
                total_res = await db.execute(total_stmt)
                quote_total = total_res.scalar() or 0.0
                declined_quote = {
                    "id": str(rejected_quote_obj.id),
                    "quote_no": rejected_quote_obj.quote_no,
                    "quote_total": quote_total,
                    "updated_at": rejected_quote_obj.updated_at.isoformat(),
                }

        response.append({
            **ticket.model_dump(),
            "assignee_name": assignee_name,
            "invoice": invoice_summary,
            "item_count": item_count,
            "declined_quote": declined_quote,
        })

    return response


# ---------------------------------------------------------
# INTERNAL ENDPOINT - Fetch a Single Completed Ticket with full details
# Must be declared BEFORE /admin/tickets/{id} to avoid route clash
# ---------------------------------------------------------
@ticket_router.get("/admin/tickets/completed/{ticket_id}")
async def get_completed_ticket_detail(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from app.models.invoice import Invoice
    from app.models.quote import Quote, QuoteItem
    from app.models.delivery import DeliveryNote

    ticket = await db.get(Ticket, ticket_id)
    if not ticket or ticket.status != TicketStatusEnum.CLOSED:
        raise HTTPException(status_code=404, detail="Completed ticket not found")

    assignee_name = None
    if ticket.assigned_to_id:
        assignee = await db.get(User, ticket.assigned_to_id)
        assignee_name = assignee.full_name if assignee else None

    quote = None
    items = []
    delivery_notes = []
    if ticket.approved_quote_id:
        quote = await db.get(Quote, ticket.approved_quote_id)
        if quote:
            items_result = await db.execute(
                select(QuoteItem).where(QuoteItem.quote_id == quote.id).order_by(QuoteItem.sr_no)
            )
            items = items_result.scalars().all()

            notes_result = await db.execute(
                select(DeliveryNote).where(DeliveryNote.quote_id == quote.id).order_by(DeliveryNote.version)
            )
            delivery_notes = [
                {
                    "id": str(n.id),
                    "note_no": n.note_no,
                    "version": n.version,
                    "status": n.status.value,
                    "note_date": n.note_date.isoformat(),
                }
                for n in notes_result.scalars().all()
            ]

    inv_res = await db.execute(
        select(Invoice).where(Invoice.ticket_id == ticket.id).order_by(Invoice.created_at.desc())
    )
    invoice = inv_res.scalars().first()
    invoice_data = None
    if invoice:
        invoice_data = {
            "id": str(invoice.id),
            "invoice_no": invoice.invoice_no,
            "status": invoice.status.value,
            "invoice_total": invoice.invoice_total,
            "vat_total": invoice.vat_total,
            "taxable_value": invoice.taxable_value,
            "payment_terms": invoice.payment_terms,
            "created_at": invoice.created_at.isoformat(),
        }

    return {
        "ticket": {
            "id": str(ticket.id),
            "ticket_id": ticket.ticket_id,
            "customer_name": ticket.customer_name,
            "company_name": ticket.company_name,
            "email": ticket.email,
            "phone_number": ticket.phone_number,
            "lpo_number": ticket.lpo_number,
            "updated_at": ticket.updated_at.isoformat(),
            "assignee_name": assignee_name,
        },
        "quote": {
            "id": str(quote.id),
            "quote_no": quote.quote_no,
            "lpo_no": quote.lpo_no,
            "items": [
                {
                    "id": str(item.id),
                    "sr_no": item.sr_no,
                    "item_description": item.item_description,
                    "qty": item.qty,
                    "u_price": item.u_price,
                    "total_amount": item.total_amount,
                }
                for item in items
            ],
        } if quote else None,
        "invoice": invoice_data,
        "delivery_notes": delivery_notes,
    }


# ---------------------------------------------------------
# INTERNAL ENDPOINT - Fetch a Single Ticket by DB ID
# ---------------------------------------------------------
@ticket_router.get("/admin/tickets/{id}", response_model=TicketPublic)
async def get_ticket_by_id(id: str, db: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    try:
        uuid_val = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ticket UUID parameter.")
        
    ticket = await db.get(Ticket, uuid_val)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
        
    return ticket




# ---------------------------------------------------------
# THE MATH ENGINE - Calculates real-time company capacity
# ---------------------------------------------------------
@ticket_router.get("/public/tickets/available-slots")
async def get_available_slots(db: AsyncSession = Depends(get_session)):
    from app.models.availability import StaffAvailability
    
    # Use local date/time (naive) to match how slot times are stored in the DB.
    # Using UTC here would cause slots to be incorrectly filtered out in UTC+ timezones.
    today = dt.date.today()
    now_time = dt.datetime.now().time()
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

    # Atomic UPDATE ensures that concurrent claim attempts do not overwrite each other.
    # The WHERE constraints guarantee the row is only mutated if its state hasn't changed.
    statement = (
        update(Ticket)
        .where(Ticket.ticket_id == ticket_id)
        .where(Ticket.status == TicketStatusEnum.PENDING)
        .values(
            status=TicketStatusEnum.CLAIMED,
            assigned_to_id=current_user.id
        )
        .returning(Ticket)
    )
    result = await db.execute(statement)
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(
            status_code=400, 
            detail="Ticket not found or has already been claimed by another user."
        )
        
    await db.commit()
    
    # Return mapping matching the Pydantic schema for the mapped frontend interface
    return {**ticket.model_dump(), "assignee_name": current_user.full_name}

# ---------------------------------------------------------
# INTERNAL ENDPOINT - Mark Call as Completed
# ---------------------------------------------------------
@ticket_router.patch("/admin/tickets/{ticket_id}/mark_completed", response_model=TicketPublic)
async def mark_call_completed(
    ticket_id: str, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    statement = select(Ticket).where(Ticket.ticket_id == ticket_id)
    result = await db.execute(statement)
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    
    if ticket.assigned_to_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="You must be the assigned owner to complete this call.")
        
    if ticket.status != TicketStatusEnum.CLAIMED:
        raise HTTPException(status_code=400, detail="Only CLAIMED tickets can be marked as completed.")
        
    ticket.status = TicketStatusEnum.CALL_COMPLETED
    
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    
    return {**ticket.model_dump(), "assignee_name": current_user.full_name}

# ---------------------------------------------------------
# INTERNAL ENDPOINT - Admin Assigns Ticket to Staff
# ---------------------------------------------------------
@ticket_router.patch("/admin/tickets/{ticket_id}/assign", response_model=TicketPublic)
async def assign_ticket(
    ticket_id: str, 
    data: TicketAssignRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only Admins can forcefully assign tickets.")

    ticket_stmt = select(Ticket).where(Ticket.ticket_id == ticket_id)
    user_stmt = select(User).where(User.id == data.user_id)
    
    ticket_res = await db.execute(ticket_stmt)
    user_res = await db.execute(user_stmt)
    
    ticket = ticket_res.scalars().first()
    target_user = user_res.scalars().first()
    
    if not ticket or not target_user:
        raise HTTPException(status_code=404, detail="Ticket or specified User not found.")
        
    ticket.status = TicketStatusEnum.CLAIMED
    ticket.assigned_to_id = target_user.id
    
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    

    background_tasks.add_task(
        send_ticket_lifecycle_notification, 
        target_user.email, 
        "ASSIGNED", 
        {"ticket": ticket, "user": target_user}
    )
    
    return {**ticket.model_dump(), "assignee_name": target_user.full_name}