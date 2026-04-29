import uuid
import datetime as dt
import threading
from jose import jwt

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func
from sqlalchemy.exc import IntegrityError

from app.database import get_session
from app.models.quote import Quote, QuoteItem, QuoteStatusEnum
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.user import User, UserRole
from app.routers.auth import get_current_user
from app.schemas.quote import QuoteCreate
from app.schemas.lpo import LPOSubmitRequest, LPOStaffEntryRequest
from app.services.emails import (
    send_quote_email,
    send_approval_followup_email,
    send_rejection_followup_email,
    send_modification_followup_email,
    send_staff_quote_response_notification
)
from app.config import settings

quotes_router = APIRouter(prefix="/admin/quotes", tags=["Quotes"])

@quotes_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_quote(
    data: QuoteCreate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    ticket_stmt = select(Ticket).where(Ticket.id == data.ticket_id)
    ticket_result = await db.execute(ticket_stmt)
    ticket = ticket_result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
        
    # Allow CLOSED tickets to get new revisions (customer changed their mind / re-engagement)
    allowed_statuses = [
        TicketStatusEnum.CALL_COMPLETED,
        TicketStatusEnum.IN_QUOTE_PREPARATION,
        TicketStatusEnum.CLOSED,
    ]
    if ticket.status not in allowed_statuses:
        raise HTTPException(
            status_code=400, 
            detail="Cannot create a quote for a ticket that has not completed its consultation."
        )

    quote_data_dict = data.model_dump(exclude={"items"})
    
    # --- SINGLE DRAFT RULE ---
    # If a draft already exists for this ticket, overwrite/delete it so we don't spam the version history
    draft_stmt = select(Quote).where(Quote.ticket_id == data.ticket_id, Quote.status == QuoteStatusEnum.DRAFT)
    draft_res = await db.execute(draft_stmt)
    existing_draft = draft_res.scalars().first()
    
    if existing_draft:
        # Clean up old draft items first
        items_del_stmt = select(QuoteItem).where(QuoteItem.quote_id == existing_draft.id)
        items_del_res = await db.execute(items_del_stmt)
        for old_item in items_del_res.scalars().all():
            await db.delete(old_item)
            
        # Delete old draft quote
        await db.delete(existing_draft)
        await db.flush() # Force it out of the active transaction right now

    # Count REMAINING quotes (which are exactly the ones submitted/sent) to determine revision number
    count_stmt = select(func.count()).where(Quote.ticket_id == data.ticket_id)
    count_result = await db.execute(count_stmt)
    existing_count = count_result.scalar() or 0
    
    quote_no = ticket.ticket_id
    if existing_count > 0:
        quote_no = f"{ticket.ticket_id}-R{existing_count + 1}"
    
    new_quote = Quote(**quote_data_dict)
    new_quote.quote_no = quote_no
    new_quote.status = QuoteStatusEnum.DRAFT
    
    db.add(new_quote)
    await db.flush()
    
    created_items_data = []
    for item_data in data.items:
        new_item = QuoteItem(**item_data.model_dump(), quote_id=new_quote.id)
        db.add(new_item)
        created_items_data.append(item_data.model_dump())
        
    # Move ticket to IN_QUOTE_PREPARATION (handles both fresh and reopened tickets)
    if ticket.status in [TicketStatusEnum.CALL_COMPLETED, TicketStatusEnum.CLOSED]:
        ticket.status = TicketStatusEnum.IN_QUOTE_PREPARATION
        db.add(ticket)
    
    try:
        await db.commit()
        await db.refresh(new_quote)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A quote with this quote number already exists. Please try again."
        )
    
    return {
        "id": str(new_quote.id),
        "ticket_id": str(new_quote.ticket_id),
        "quote_no": new_quote.quote_no,
        "company_name": new_quote.company_name,
        "address": new_quote.address,
        "phone_no": new_quote.phone_no,
        "quote_date": new_quote.quote_date.isoformat(),
        "lpo_no": new_quote.lpo_no,
        "lead_time_approx": new_quote.lead_time_approx,
        "status": new_quote.status.value,
        "created_at": new_quote.created_at.isoformat(),
        "items": created_items_data
    }

@quotes_router.get("/{ticket_id}")
async def get_quotes_for_ticket(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Quote).where(Quote.ticket_id == ticket_id).order_by(Quote.created_at.desc())
    result = await db.execute(statement)
    quotes = result.scalars().all()
    
    response = []
    for q in quotes:
        items_stmt = select(QuoteItem).where(QuoteItem.quote_id == q.id)
        items_result = await db.execute(items_stmt)
        items = items_result.scalars().all()
        
        response.append({
            "id": str(q.id),
            "ticket_id": str(q.ticket_id),
            "quote_no": q.quote_no,
            "company_name": q.company_name,
            "address": q.address,
            "phone_no": q.phone_no,
            "quote_date": q.quote_date.isoformat(),
            "lpo_no": q.lpo_no,
            "lead_time_approx": q.lead_time_approx,
            "status": q.status.value,
            "created_at": q.created_at.isoformat(),
            "items": [{"id": str(i.id), "quote_id": str(i.quote_id), **{k: v for k, v in i.__dict__.items() if k not in ('_sa_instance_state', 'id', 'quote_id', 'quote')}} for i in items]
        })
    
    return response

@quotes_router.get("/quote/{quote_id}")
async def get_single_quote(
    quote_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    quote = await db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
        
    items_stmt = select(QuoteItem).where(QuoteItem.quote_id == quote_id)
    result = await db.execute(items_stmt)
    items = result.scalars().all()
    
    ticket = await db.get(Ticket, quote.ticket_id)
    
    return {
        "quote": {
            "id": str(quote.id),
            "ticket_id": str(quote.ticket_id),
            "quote_no": quote.quote_no,
        "invoice_no": quote.quote_no,
            "company_name": quote.company_name,
            "address": quote.address,
            "phone_no": quote.phone_no,
            "quote_date": quote.quote_date.isoformat(),
            "lpo_no": quote.lpo_no,
            "lead_time_approx": quote.lead_time_approx,
            "status": quote.status.value,
            "created_at": quote.created_at.isoformat(),
            "items": [
                {
                    "sr_no": i.sr_no,
                    "item_description": i.item_description,
                    "qty": i.qty,
                    "u_price": i.u_price,
                    "total_amount": i.total_amount,
                } for i in items
            ]
        },
        "ticket": {
            "customer_name": ticket.customer_name if ticket else "",
            "company_name": ticket.company_name if ticket else "",
            "company_address": ticket.company_address if ticket else "",
            "phone_number": ticket.phone_number if ticket else "",
            "email": ticket.email if ticket else "",
        } if ticket else None
    }


@quotes_router.post("/{quote_id}/send")
async def send_quote_to_client(
    quote_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    quote = await db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    items_stmt = select(QuoteItem).where(QuoteItem.quote_id == quote_id)
    items_result = await db.execute(items_stmt)
    items = items_result.scalars().all()
    
    ticket = await db.get(Ticket, quote.ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Associated ticket not found")
    
    quote_data = {
        "id": str(quote.id),
        "quote_no": quote.quote_no,
        "invoice_no": quote.quote_no,
        "company_name": quote.company_name,
        "address": quote.address,
        "phone_no": quote.phone_no,
        "quote_date": quote.quote_date.isoformat(),
        "lpo_no": quote.lpo_no,
        "lead_time_approx": quote.lead_time_approx,
        "status": quote.status.value,
        "created_at": quote.created_at.isoformat(),
        "items": [
            {
                "sr_no": i.sr_no,
                "item_description": i.item_description,
                "qty": i.qty,
                "u_price": i.u_price,
                "total_amount": i.total_amount,
                "description_of_service": i.item_description,
                "quantity": i.qty,
                "rate_excl_vat": i.u_price,
                "total_incl_vat": i.total_amount,
            } for i in items
        ]
    }
    ticket_data = {
        "customer_name": ticket.customer_name,
        "company_name": ticket.company_name,
        "company_address": ticket.company_address,
        "phone_number": ticket.phone_number,
    }
    
    # Execute email synchronously to ensure it actually works
    email_success = send_quote_email(ticket.email, quote_data, ticket_data)
    
    if not email_success:
        raise HTTPException(status_code=500, detail="Failed to send the email. Please check the STMP Server configuration.")
    
    quote.status = QuoteStatusEnum.SENT
    quote.updated_at = dt.datetime.now(dt.timezone.utc)
    db.add(quote)
    await db.commit()
    
    return {"message": f"Quote {quote.quote_no} was successfully sent to {ticket.email}"}


# =============================================================================
# PUBLIC ENDPOINT — Customer responds to quote via email button
# =============================================================================
public_quotes_router = APIRouter(prefix="/public/quotes", tags=["Public Quotes"])

@public_quotes_router.get("/respond")
async def respond_to_quote(
    token: str = Query(...),
    action: str = Query(...),
    db: AsyncSession = Depends(get_session)
):
    valid_actions = {
        "APPROVED": QuoteStatusEnum.APPROVED,
        "REJECTED": QuoteStatusEnum.REJECTED,
        "MODIFICATION_REQUESTED": QuoteStatusEnum.MODIFICATION_REQUESTED,
    }
    
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        quote_id = payload["quote_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="This link has expired. Please contact SmartFab Lathe.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid link.")
    
    quote = await db.get(Quote, uuid.UUID(quote_id))
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    if quote.status != QuoteStatusEnum.SENT:
        already_responded_messages = {
            QuoteStatusEnum.APPROVED: "You have already approved this quote. Our team is processing your order.",
            QuoteStatusEnum.REJECTED: "You have already declined this quote. If you'd like to reconsider, please contact us.",
            QuoteStatusEnum.MODIFICATION_REQUESTED: "You have already requested modifications. Our team will be in touch shortly.",
            QuoteStatusEnum.DRAFT: "This quote has not been sent yet.",
        }
        msg = already_responded_messages.get(
            quote.status,
            "This quote has already been responded to."
        )
        return {"message": msg, "status": quote.status.value, "already_responded": True}
    
    quote.status = valid_actions[action]
    quote.updated_at = dt.datetime.now(dt.timezone.utc)
    db.add(quote)
    
    ticket = await db.get(Ticket, quote.ticket_id)
    
    if ticket:
        if action == "REJECTED":
            ticket.status = TicketStatusEnum.CLOSED
            ticket.updated_at = dt.datetime.now(dt.timezone.utc)
            db.add(ticket)
        elif action == "APPROVED":
            ticket.status = TicketStatusEnum.ACTIVE_ORDER
            ticket.approved_quote_id = quote.id
            ticket.quote_approved_at = dt.datetime.now(dt.timezone.utc)
            ticket.updated_at = dt.datetime.now(dt.timezone.utc)
            db.add(ticket)
    
    await db.commit()
    
    if ticket:
        customer_name = ticket.customer_name
        customer_email = ticket.email
        quote_no = quote.quote_no
        
        if action == "APPROVED":
            threading.Thread(
                target=send_approval_followup_email,
                args=(customer_email, customer_name, quote_no, token),
                daemon=True
            ).start()
        elif action == "REJECTED":
            threading.Thread(
                target=send_rejection_followup_email,
                args=(customer_email, customer_name, quote_no),
                daemon=True
            ).start()
        elif action == "MODIFICATION_REQUESTED":
            threading.Thread(
                target=send_modification_followup_email,
                args=(customer_email, customer_name, quote_no),
                daemon=True
            ).start()
            
        # Also notify the staff member who claimed the ticket
        if ticket.assigned_to_id:
            assignee = await db.get(User, ticket.assigned_to_id)
            if assignee:
                threading.Thread(
                    target=send_staff_quote_response_notification,
                    args=(assignee.email, assignee.full_name, quote_no, action, customer_name),
                    daemon=True
                ).start()
    
    messages = {
        "APPROVED": "Thank you! Your quote has been approved. Our team will contact you shortly to proceed with the Local Purchase Order (LPO).",
        "REJECTED": "We're sorry to hear that. A member of our team will reach out to understand how we can better serve you.",
        "MODIFICATION_REQUESTED": "Thank you for your feedback. A member of our team will contact you shortly to discuss the changes.",
    }
    
    return {"message": messages[action], "status": action}


# =============================================================================
# PUBLIC ENDPOINT — Check if LPO is already submitted
# =============================================================================
@public_quotes_router.get("/lpo-status")
async def check_lpo_status(
    token: str = Query(...),
    db: AsyncSession = Depends(get_session)
):
    """
    Called when the customer opens the /lpo-submit page.
    Checks if the LPO was already manually entered by staff to prevent
    the customer from seeing the form unnecessarily.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        quote_id = payload["quote_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="This link has expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid link.")
    
    quote = await db.get(Quote, uuid.UUID(quote_id))
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
        
    ticket = await db.get(Ticket, quote.ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Associated ticket not found")

    return {
        "already_submitted": ticket.lpo_number is not None,
        "lpo_number": ticket.lpo_number,
        "quote_status": quote.status.value
    }


# =============================================================================
# PUBLIC ENDPOINT — Customer submits LPO number via web form
# =============================================================================
@public_quotes_router.post("/submit-lpo")
async def submit_lpo(
    data: LPOSubmitRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    After a customer approves a quote, they receive an email with a link
    to submit their LPO number. This endpoint handles that submission.
    
    Flow: Decode JWT → validate quote is APPROVED → save LPO on ticket → move to ACTIVE_ORDER
    """
    # Decode the JWT token (same token format as quote response)
    try:
        payload = jwt.decode(data.token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        quote_id = payload["quote_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="This link has expired. Please contact SmartFab Lathe.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid link.")
    
    quote = await db.get(Quote, uuid.UUID(quote_id))
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    if quote.status != QuoteStatusEnum.APPROVED:
        raise HTTPException(
            status_code=400,
            detail="This quote must be approved before submitting an LPO."
        )
    
    ticket = await db.get(Ticket, quote.ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Associated ticket not found")
    
    # Uniqueness: reject if another ticket already has this LPO number
    lpo_stripped = data.lpo_number.strip()
    dup_result = await db.execute(
        select(Ticket).where(
            Ticket.lpo_number == lpo_stripped,
            Ticket.id != ticket.id
        )
    )
    if dup_result.scalars().first():
        raise HTTPException(
            status_code=409,
            detail="This LPO number is already registered to another order. Please verify and try again."
        )

    # Idempotent: if LPO already submitted, update it and confirm
    already_submitted = ticket.lpo_number is not None

    ticket.lpo_number = lpo_stripped
    # Status is already ACTIVE_ORDER from quote approval — this is safe to re-set
    ticket.status = TicketStatusEnum.ACTIVE_ORDER
    db.add(ticket)
    await db.commit()
    
    if already_submitted:
        return {
            "message": f"LPO number updated to '{data.lpo_number}'. Your order is active.",
            "status": "UPDATED"
        }
    
    return {
        "message": "Thank you! Your LPO has been recorded and your order is now active. Our team will begin processing immediately.",
        "status": "SUBMITTED"
    }


# =============================================================================
# ADMIN ENDPOINT — Staff manually enters LPO number from the dashboard
# =============================================================================
@quotes_router.patch("/{quote_id}/enter-lpo")
async def staff_enter_lpo(
    quote_id: uuid.UUID,
    data: LPOStaffEntryRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    When a customer emails their LPO instead of using the web form,
    staff can manually enter the LPO number from the dashboard.
    
    Same logic as the public endpoint but authenticated via cookie.
    """
    quote = await db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    if quote.status != QuoteStatusEnum.APPROVED:
        raise HTTPException(
            status_code=400,
            detail="Only approved quotes can have an LPO attached."
        )
    
    ticket = await db.get(Ticket, quote.ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Associated ticket not found")
    
    ticket.lpo_number = data.lpo_number.strip()
    ticket.approved_quote_id = quote.id
    ticket.quote_approved_at = ticket.quote_approved_at or dt.datetime.now(dt.timezone.utc)
    ticket.status = TicketStatusEnum.ACTIVE_ORDER
    db.add(ticket)
    await db.commit()
    
    return {
        "message": f"LPO '{data.lpo_number}' recorded. Ticket {ticket.ticket_id} is now an active order."
    }
