from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.quote import Quote, QuoteItem, ProductionStatusEnum
from app.models.invoice import Invoice, InvoiceItem

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
        "items": [],
        "invoice": None,
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

    # For completed orders, also fetch the invoice
    if ticket.status == TicketStatusEnum.CLOSED:
        inv_stmt = select(Invoice).where(Invoice.ticket_id == ticket.id).order_by(Invoice.created_at.desc())
        inv_result = await db.execute(inv_stmt)
        invoice = inv_result.scalars().first()

        if invoice:
            inv_items_stmt = select(InvoiceItem).where(InvoiceItem.invoice_id == invoice.id).order_by(InvoiceItem.sr_no)
            inv_items_result = await db.execute(inv_items_stmt)
            inv_items = inv_items_result.scalars().all()

            response["invoice"] = {
                "invoice_no": invoice.invoice_no,
                "status": invoice.status,
                "taxable_value": invoice.taxable_value,
                "vat_total": invoice.vat_total,
                "invoice_total": invoice.invoice_total,
                "payment_terms": invoice.payment_terms,
                "amount_chargeable_words": invoice.amount_chargeable_words,
                "created_at": invoice.created_at.isoformat(),
                "items": [
                    {
                        "sr_no": i.sr_no,
                        "description_of_service": i.description_of_service,
                        "quantity": i.quantity,
                        "per": i.per,
                        "amount": i.amount,
                        "total_incl_vat": i.total_incl_vat,
                    }
                    for i in inv_items
                ],
            }

    return response
