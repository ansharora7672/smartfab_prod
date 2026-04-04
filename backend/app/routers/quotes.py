import uuid
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models.quote import Quote, QuoteItem, QuoteStatusEnum
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.user import User, UserRole
from app.routers.auth import get_current_user
from app.schemas.quote import QuoteCreate, QuoteResponse

quotes_router = APIRouter(prefix="/admin/quotes", tags=["Quotes"])

@quotes_router.post("/", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def create_quote(
    data: QuoteCreate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify the ticket exists and is ready for a quote
    ticket_stmt = select(Ticket).where(Ticket.id == data.ticket_id)
    ticket_result = await db.execute(ticket_stmt)
    ticket = ticket_result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
        
    if ticket.status not in [TicketStatusEnum.CALL_COMPLETED, TicketStatusEnum.IN_QUOTE_PREPARATION]:
        raise HTTPException(
            status_code=400, 
            detail="Cannot create a quote for a ticket that has not completed its consultation."
        )

    # Convert the base dictionary but extract items payload specifically
    quote_data_dict = data.model_dump(exclude={"items"})
    
    # 1. Create the main Quote wrapper, auto-populate the invoice_no using the SFL logic
    new_quote = Quote(**quote_data_dict)
    new_quote.invoice_no = ticket.ticket_id
    new_quote.status = QuoteStatusEnum.DRAFT
    
    db.add(new_quote)
    await db.flush() # Flushing gives new_quote an ID without fully committing
    
    # 2. Iterate and create all its quote items
    db_items = []
    for item_data in data.items:
        new_item = QuoteItem(**item_data.model_dump(), quote_id=new_quote.id)
        db.add(new_item)
        db_items.append(new_item)
        
    # 3. Transition the actual ticket into IN_QUOTE_PREPARATION if it isn't already
    if ticket.status == TicketStatusEnum.CALL_COMPLETED:
        ticket.status = TicketStatusEnum.IN_QUOTE_PREPARATION
        db.add(ticket)
        
    await db.commit()
    await db.refresh(new_quote)
    
    # Refresh to grab relations dynamically though we can manually append here for Pydantic returning
    return new_quote

@quotes_router.get("/{ticket_id}", response_model=list[QuoteResponse])
async def get_quotes_for_ticket(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Quote).where(Quote.ticket_id == ticket_id).order_by(Quote.created_at.desc())
    result = await db.execute(statement)
    quotes = result.scalars().all()
    
    # Eager load items? SQLModel relations allow async fetching if lazy='selectin' is set, 
    # but we can fetch manually here to be safe and clean.
    # In a prod setup, you'd add selectinload(Quote.items) to the statement above.
    return quotes
