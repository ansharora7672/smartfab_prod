from fastapi import APIRouter, Depends
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.quote import Quote, QuoteStatusEnum
from app.models.user import User
from app.routers.auth import get_current_user

dashboard_router = APIRouter(prefix="/admin/dashboard", tags=["Dashboard"])


@dashboard_router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    pending_result = await db.execute(
        select(func.count()).select_from(Ticket).where(
            Ticket.status.in_([TicketStatusEnum.PENDING, TicketStatusEnum.CLAIMED])
        )
    )
    pending_count = pending_result.scalar() or 0

    active_result = await db.execute(
        select(func.count()).select_from(Ticket).where(
            Ticket.status == TicketStatusEnum.ACTIVE_ORDER
        )
    )
    active_count = active_result.scalar() or 0

    quotes_result = await db.execute(
        select(func.count()).select_from(Quote).where(
            Quote.status.in_([QuoteStatusEnum.SENT, QuoteStatusEnum.APPROVED])
        )
    )
    quotes_count = quotes_result.scalar() or 0

    return {
        "pending_tickets_count": pending_count,
        "active_orders_count": active_count,
        "quotes_sent_count": quotes_count,
    }
