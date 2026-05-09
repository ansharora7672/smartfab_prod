from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.quote import Quote, QuoteItem, ProductionStatusEnum
track_order_router = APIRouter(prefix="/public", tags=["Track Order"])

TICKET_STATUS_LABELS = {
    TicketStatusEnum.PENDING: "Consultation Scheduled",
    TicketStatusEnum.CLAIMED: "Consultation Scheduled",
    TicketStatusEnum.CALL_COMPLETED: "Quote Being Prepared",
    TicketStatusEnum.IN_QUOTE_PREPARATION: "Quote Being Prepared",
    TicketStatusEnum.ACTIVE_ORDER: "In Production",
    TicketStatusEnum.CLOSED: "Order Completed",
}

PRODUCTION_STATUS_LABELS = {
    ProductionStatusEnum.ORDER_RECEIVED: "Order Received",
    ProductionStatusEnum.VENDOR_ASSIGNED: "Vendor Assigned",
    ProductionStatusEnum.IN_PRODUCTION: "In Production",
    ProductionStatusEnum.QUALITY_CHECK: "Quality Check",
    ProductionStatusEnum.READY_FOR_DELIVERY: "Ready for Delivery",
    ProductionStatusEnum.DELIVERED: "Delivered",
    ProductionStatusEnum.COMPLETED: "Completed",
}

PRODUCTION_STATUS_ORDER = list(ProductionStatusEnum)

def _overall_production_status(items: list) -> ProductionStatusEnum:
    """Return the stage of the most-behind item (order bottleneck)."""
    if not items:
        return ProductionStatusEnum.ORDER_RECEIVED
    present = {item.production_status for item in items}
    for s in PRODUCTION_STATUS_ORDER:
        if s in present:
            return s
    return ProductionStatusEnum.ORDER_RECEIVED


@track_order_router.get("/track-order")
async def track_order(
    query: str = Query(..., description="Ticket ID (SFL-...) or LPO number"),
    db: AsyncSession = Depends(get_session),
):
    query = query.strip()

    # Try ticket_id first, then lpo_number
    stmt = select(Ticket).where(Ticket.ticket_id == query)
    result = await db.execute(stmt)
    ticket = result.scalars().first()

    if not ticket:
        stmt = select(Ticket).where(Ticket.lpo_number == query)
        result = await db.execute(stmt)
        ticket = result.scalars().first()

    if not ticket:
        raise HTTPException(status_code=404, detail="No order found with that reference number.")

    response = {
        "ticket_id": ticket.ticket_id,
        "company_name": ticket.company_name,
        "customer_name": ticket.customer_name,
        "lpo_number": ticket.lpo_number,
        "status": ticket.status,
        "status_label": TICKET_STATUS_LABELS.get(ticket.status, ticket.status),
        "overall_production_status": None,
        "overall_production_status_label": None,
        "overall_production_step": None,
        "total_production_steps": len(PRODUCTION_STATUS_ORDER) - 1,
        "items": [],
    }

    # Load item-level detail when order is active or closed
    if ticket.status in (TicketStatusEnum.ACTIVE_ORDER, TicketStatusEnum.CLOSED) and ticket.approved_quote_id:
        quote_stmt = select(Quote).where(Quote.id == ticket.approved_quote_id)
        quote_result = await db.execute(quote_stmt)
        quote = quote_result.scalars().first()

        if quote:
            items_stmt = select(QuoteItem).where(QuoteItem.quote_id == quote.id)
            items_result = await db.execute(items_stmt)
            items = items_result.scalars().all()

            overall = _overall_production_status(items)
            response["overall_production_status"] = overall.value
            response["overall_production_status_label"] = PRODUCTION_STATUS_LABELS.get(overall, overall.value)
            response["overall_production_step"] = PRODUCTION_STATUS_ORDER.index(overall)

            response["items"] = [
                {
                    "sr_no": item.sr_no,
                    "description": item.item_description,
                    "qty": item.qty,
                    "production_status": item.production_status,
                    "production_status_label": PRODUCTION_STATUS_LABELS.get(
                        item.production_status, item.production_status
                    ),
                    "progress_step": PRODUCTION_STATUS_ORDER.index(item.production_status),
                    "total_steps": len(PRODUCTION_STATUS_ORDER) - 1,
                }
                for item in sorted(items, key=lambda i: i.sr_no)
            ]

    return response
