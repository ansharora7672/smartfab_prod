import asyncio
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from sqlalchemy import text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.delivery import DeliveryAssignment, DeliveryNote, DeliveryNoteItem, DeliveryNoteStatus
from app.models.driver import Driver
from app.models.quote import Quote, QuoteItem, QuoteStatusEnum
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.user import User
from app.routers.auth import get_current_user
from app.config import settings
from app.schemas.delivery import (
    DeliveryAssignmentCreate,
    DeliveryAssignmentPublic,
    DeliveryAssignmentUpdate,
    DeliveryNoteCreate,
    VendorAssignRequest,
)
from app.models.vendor import Vendor
from app.models.invoice import Invoice, InvoiceItem


router = APIRouter(prefix="/admin/orders", tags=["Active Orders"])

# Ordered from earliest → latest stage. Overall status = stage of the most-behind item.
_STATUS_ORDER = [
    "ORDER_RECEIVED",
    "VENDOR_ASSIGNED",
    "IN_PRODUCTION",
    "QUALITY_CHECK",
    "READY_FOR_DELIVERY",
    "DELIVERED",
    "COMPLETED",
]

def _overall_status(items: list) -> str:
    if not items:
        return "ORDER_RECEIVED"
    present = {item.production_status.value if hasattr(item.production_status, "value") else item["production_status"] for item in items}
    for s in _STATUS_ORDER:
        if s in present:
            return s
    return "ORDER_RECEIVED"


@router.get("/active")
async def list_active_orders(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Quote, Ticket)
        .join(Ticket, Ticket.id == Quote.ticket_id)
        .where(Quote.status == QuoteStatusEnum.APPROVED)
        .order_by(Quote.updated_at.desc())
    )
    rows = result.all()

    response = []
    for quote, ticket in rows:
        ops = await db.execute(
            text("SELECT order_production_status FROM quotes WHERE id = :qid"),
            {"qid": str(quote.id)},
        )
        order_stage = ops.scalar_one_or_none()

        items_result = await db.execute(select(QuoteItem).where(QuoteItem.quote_id == quote.id))
        items = items_result.scalars().all()

        assignments_result = await db.execute(
            select(DeliveryAssignment, Driver.full_name)
            .join(Driver, Driver.id == DeliveryAssignment.driver_id)
            .where(DeliveryAssignment.quote_id == quote.id)
        )
        assignments = [
            {
                "id": str(a.id),
                "quote_item_id": str(a.quote_item_id),
                "driver_id": str(a.driver_id),
                "driver_name": driver_name,
                "quantity_to_deliver": a.quantity_to_deliver,
                "status": a.status.value,
                "remark": a.remark,
            }
            for a, driver_name in assignments_result.all()
        ]

        # Count delivery notes for this order
        notes_result = await db.execute(
            select(DeliveryNote).where(DeliveryNote.quote_id == quote.id).order_by(DeliveryNote.version)
        )
        notes = notes_result.scalars().all()
        delivery_notes = [
            {
                "id": str(n.id),
                "note_no": n.note_no,
                "version": n.version,
                "status": n.status.value,
                "note_date": n.note_date.isoformat(),
                "address": n.address,
                "lpo_no": n.lpo_no,
            }
            for n in notes
        ]

        # Fetch invoice for this ticket (most recent)
        invoice_result = await db.execute(
            select(Invoice).where(Invoice.ticket_id == ticket.id).order_by(Invoice.created_at.desc())
        )
        invoice = invoice_result.scalars().first()
        invoice_data = None
        if invoice:
            inv_items_result = await db.execute(
                select(InvoiceItem).where(InvoiceItem.invoice_id == invoice.id).order_by(InvoiceItem.sr_no)
            )
            inv_items = inv_items_result.scalars().all()
            invoice_data = {
                "id": str(invoice.id),
                "invoice_no": invoice.invoice_no,
                "status": invoice.status.value,
                "taxable_value": invoice.taxable_value,
                "vat_total": invoice.vat_total,
                "invoice_total": invoice.invoice_total,
                "payment_terms": invoice.payment_terms,
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

        item_dicts = [
            {
                "id": str(item.id),
                "sr_no": item.sr_no,
                "item_description": item.item_description,
                "qty": item.qty,
                "u_price": item.u_price,
                "total_amount": item.total_amount,
                "vendor_id": str(item.vendor_id) if item.vendor_id else None,
                "production_status": item.production_status.value if item.production_status else "ORDER_RECEIVED",
            }
            for item in items
        ]

        response.append(
            {
                "ticket": {
                    "id": str(ticket.id),
                    "ticket_id": ticket.ticket_id,
                    "customer_name": ticket.customer_name,
                    "company_name": ticket.company_name,
                    "email": ticket.email,
                    "status": ticket.status.value,
                },
                "quote": {
                    "id": str(quote.id),
                    "quote_no": quote.quote_no,
                    "lpo_no": quote.lpo_no,
                    "status": quote.status.value,
                    "overall_production_status": order_stage if order_stage else _overall_status(items),
                    "items": item_dicts,
                },
                "delivery_assignments": assignments,
                "delivery_notes": delivery_notes,
                "invoice": invoice_data,
            }
        )

    return response


@router.get("/active/{ticket_id}")
async def get_active_order(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Quote, Ticket)
        .join(Ticket, Ticket.id == Quote.ticket_id)
        .where(Quote.status == QuoteStatusEnum.APPROVED)
        .where(Ticket.id == ticket_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")

    quote, ticket = row

    ops = await db.execute(
        text("SELECT order_production_status FROM quotes WHERE id = :qid"),
        {"qid": str(quote.id)},
    )
    order_stage = ops.scalar_one_or_none()

    items_result = await db.execute(select(QuoteItem).where(QuoteItem.quote_id == quote.id))
    items = items_result.scalars().all()

    assignments_result = await db.execute(
        select(DeliveryAssignment, Driver.full_name)
        .join(Driver, Driver.id == DeliveryAssignment.driver_id)
        .where(DeliveryAssignment.quote_id == quote.id)
    )
    assignments = [
        {
            "id": str(a.id),
            "quote_item_id": str(a.quote_item_id),
            "driver_id": str(a.driver_id),
            "driver_name": driver_name,
            "quantity_to_deliver": a.quantity_to_deliver,
            "status": a.status.value,
            "remark": a.remark,
        }
        for a, driver_name in assignments_result.all()
    ]

    notes_result = await db.execute(
        select(DeliveryNote).where(DeliveryNote.quote_id == quote.id).order_by(DeliveryNote.version)
    )
    notes = notes_result.scalars().all()
    delivery_notes = [
        {
            "id": str(n.id),
            "note_no": n.note_no,
            "version": n.version,
            "status": n.status.value,
            "note_date": n.note_date.isoformat(),
            "address": n.address,
            "lpo_no": n.lpo_no,
        }
        for n in notes
    ]

    invoice_result = await db.execute(
        select(Invoice).where(Invoice.ticket_id == ticket.id).order_by(Invoice.created_at.desc())
    )
    invoice = invoice_result.scalars().first()
    invoice_data = None
    if invoice:
        inv_items_result = await db.execute(
            select(InvoiceItem).where(InvoiceItem.invoice_id == invoice.id).order_by(InvoiceItem.sr_no)
        )
        inv_items = inv_items_result.scalars().all()
        invoice_data = {
            "id": str(invoice.id),
            "invoice_no": invoice.invoice_no,
            "status": invoice.status.value,
            "taxable_value": invoice.taxable_value,
            "vat_total": invoice.vat_total,
            "invoice_total": invoice.invoice_total,
            "payment_terms": invoice.payment_terms,
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

    item_dicts = [
        {
            "id": str(item.id),
            "sr_no": item.sr_no,
            "item_description": item.item_description,
            "qty": item.qty,
            "u_price": item.u_price,
            "total_amount": item.total_amount,
            "vendor_id": str(item.vendor_id) if item.vendor_id else None,
            "production_status": item.production_status.value if item.production_status else "ORDER_RECEIVED",
        }
        for item in items
    ]

    return {
        "ticket": {
            "id": str(ticket.id),
            "ticket_id": ticket.ticket_id,
            "customer_name": ticket.customer_name,
            "company_name": ticket.company_name,
            "email": ticket.email,
            "status": ticket.status.value,
        },
        "quote": {
            "id": str(quote.id),
            "quote_no": quote.quote_no,
            "lpo_no": quote.lpo_no,
            "status": quote.status.value,
            "overall_production_status": order_stage if order_stage else _overall_status(items),
            "items": item_dicts,
        },
        "delivery_assignments": assignments,
        "delivery_notes": delivery_notes,
        "invoice": invoice_data,
    }


@router.patch("/tickets/{ticket_id}/production-status")
async def update_order_production_status(
    ticket_id: uuid.UUID,
    data: dict,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Set the ticket-level order stage only. Does NOT touch individual item statuses."""
    from app.models.quote import ProductionStatusEnum
    result = await db.execute(
        select(Quote, Ticket)
        .join(Ticket, Ticket.id == Quote.ticket_id)
        .where(Ticket.id == ticket_id)
        .where(Quote.status == QuoteStatusEnum.APPROVED)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")

    quote, _ = row

    try:
        new_status = ProductionStatusEnum(data.get("production_status"))
    except (ValueError, KeyError):
        raise HTTPException(status_code=400, detail="Invalid production_status value")

    # Order stage cannot be set to COMPLETED unless every item is already COMPLETED.
    if new_status == ProductionStatusEnum.COMPLETED:
        items_result = await db.execute(select(QuoteItem).where(QuoteItem.quote_id == quote.id))
        items = items_result.scalars().all()
        incomplete = [i for i in items if i.production_status != ProductionStatusEnum.COMPLETED]
        if incomplete:
            raise HTTPException(
                status_code=400,
                detail=f"{len(incomplete)} item(s) are not yet at Completed status. Mark all items as Completed before setting the order stage to Completed.",
            )

    await db.execute(
        text("UPDATE quotes SET order_production_status = :status WHERE id = :qid"),
        {"status": new_status.value, "qid": str(quote.id)},
    )
    await db.commit()
    return {"overall_production_status": new_status.value}


@router.post("/tickets/{ticket_id}/mark-complete")
async def mark_order_complete(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from app.models.quote import ProductionStatusEnum
    from app.models.invoice import Invoice, InvoiceStatusEnum

    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status != TicketStatusEnum.ACTIVE_ORDER:
        raise HTTPException(status_code=400, detail="Only active orders can be marked as complete")

    # Guard 1: all items must be at COMPLETED production status
    if ticket.approved_quote_id:
        items_result = await db.execute(
            select(QuoteItem).join(Quote, Quote.id == QuoteItem.quote_id)
            .where(Quote.ticket_id == ticket.id)
        )
        items = items_result.scalars().all()
        incomplete = [i for i in items if i.production_status != ProductionStatusEnum.COMPLETED]
        if incomplete:
            raise HTTPException(
                status_code=400,
                detail=f"{len(incomplete)} item(s) are not yet at COMPLETED production status. Update all items before closing the order.",
            )

    # All guards passed — close the ticket
    ticket.status = TicketStatusEnum.CLOSED
    ticket.updated_at = datetime.now(timezone.utc)
    db.add(ticket)
    await db.commit()
    return {"message": "Order marked as complete and moved to completed orders"}


@router.post("/tickets/{ticket_id}/reactivate")
async def reactivate_order(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from app.models.user import UserRole
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only Admins can move orders back to active.")
        
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status != TicketStatusEnum.CLOSED:
        raise HTTPException(status_code=400, detail="Only closed orders can be reactivated")
    ticket.status = TicketStatusEnum.ACTIVE_ORDER
    ticket.updated_at = datetime.now(timezone.utc)
    db.add(ticket)
    await db.commit()
    return {"message": "Order reactivated and moved back to active orders"}


@router.post("/tickets/{ticket_id}/reset-to-quote")
async def reset_to_quote_prep(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from app.models.user import UserRole
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only Admins can reset orders to quote preparation.")
    
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Wipe Invoices
    from app.models.invoice import Invoice, InvoiceItem
    inv_result = await db.execute(select(Invoice).where(Invoice.ticket_id == ticket.id))
    invoices = inv_result.scalars().all()
    for inv in invoices:
        items_res = await db.execute(select(InvoiceItem).where(InvoiceItem.invoice_id == inv.id))
        for itm in items_res.scalars().all():
            await db.delete(itm)
        await db.delete(inv)
        
    # Wipe Quotes & Delivery Notes
    quotes_res = await db.execute(select(Quote).where(Quote.ticket_id == ticket.id))
    quotes = quotes_res.scalars().all()
    for q in quotes:
        notes_res = await db.execute(select(DeliveryNote).where(DeliveryNote.quote_id == q.id))
        for n in notes_res.scalars().all():
            n_items = await db.execute(select(DeliveryNoteItem).where(DeliveryNoteItem.delivery_note_id == n.id))
            for nitm in n_items.scalars().all():
                await db.delete(nitm)
            await db.delete(n)
            
        ass_res = await db.execute(select(DeliveryAssignment).where(DeliveryAssignment.quote_id == q.id))
        for a in ass_res.scalars().all():
            await db.delete(a)
            
        q_items = await db.execute(select(QuoteItem).where(QuoteItem.quote_id == q.id))
        for qi in q_items.scalars().all():
            await db.delete(qi)
            
        await db.delete(q)
        
    ticket.status = TicketStatusEnum.IN_QUOTE_PREPARATION
    ticket.approved_quote_id = None
    ticket.lpo_number = None
    ticket.quote_approved_at = None
    ticket.updated_at = datetime.now(timezone.utc)
    
    db.add(ticket)
    await db.commit()
    return {"message": "Order reset to Quote Preparation. All related documents deleted."}


@router.patch("/items/{item_id}/assign-vendor")
async def assign_vendor_to_item(
    item_id: uuid.UUID,
    data: VendorAssignRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    item = await db.get(QuoteItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Quote item not found")

    vendor = await db.get(Vendor, data.vendor_id)
    if not vendor or not vendor.is_active:
        raise HTTPException(status_code=404, detail="Vendor not found or inactive")

    item.vendor_id = data.vendor_id
    try:
        from app.models.quote import ProductionStatusEnum
        item.production_status = ProductionStatusEnum(data.production_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid production_status: {data.production_status}")

    db.add(item)
    await db.commit()
    await db.refresh(item)

    return {
        "id": str(item.id),
        "vendor_id": str(item.vendor_id),
        "production_status": item.production_status.value,
    }


@router.patch("/items/{item_id}/production-status")
async def update_production_status(
    item_id: uuid.UUID,
    data: dict,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    item = await db.get(QuoteItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Quote item not found")

    try:
        from app.models.quote import ProductionStatusEnum
        item.production_status = ProductionStatusEnum(data.get("production_status"))
    except (ValueError, KeyError):
        raise HTTPException(status_code=400, detail="Invalid production_status value")

    db.add(item)
    await db.commit()

    return {"id": str(item.id), "production_status": item.production_status.value}


@router.post("/assignments", response_model=DeliveryAssignmentPublic, status_code=status.HTTP_201_CREATED)
async def create_delivery_assignment(
    data: DeliveryAssignmentCreate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    quote = await db.get(Quote, data.quote_id)
    if not quote or quote.status != QuoteStatusEnum.APPROVED:
        raise HTTPException(status_code=400, detail="Assignment is only allowed for approved quotes")

    item = await db.get(QuoteItem, data.quote_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Quote item not found")

    driver = await db.get(Driver, data.driver_id)
    if not driver or not driver.is_active:
        raise HTTPException(status_code=404, detail="Driver not found or inactive")

    assignment = DeliveryAssignment(**data.model_dump())
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.patch("/assignments/{assignment_id}", response_model=DeliveryAssignmentPublic)
async def update_delivery_assignment(
    assignment_id: uuid.UUID,
    data: DeliveryAssignmentUpdate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    assignment = await db.get(DeliveryAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.status = data.status
    assignment.remark = data.remark
    assignment.updated_at = datetime.now(timezone.utc)
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.post("/delivery-notes", status_code=status.HTTP_201_CREATED)
async def create_delivery_note(
    data: DeliveryNoteCreate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ticket = await db.get(Ticket, data.ticket_id)
    quote = await db.get(Quote, data.quote_id)
    if not ticket or not quote:
        raise HTTPException(status_code=404, detail="Ticket or quote not found")

    # Determine the next version number for this order
    existing_result = await db.execute(
        select(DeliveryNote).where(DeliveryNote.quote_id == data.quote_id).order_by(DeliveryNote.version.desc())
    )
    existing = existing_result.scalars().all()
    next_version = (existing[0].version + 1) if existing else 1

    note_no = f"DN-{ticket.ticket_id}-V{next_version}"
    note = DeliveryNote(
        note_no=note_no,
        version=next_version,
        status=DeliveryNoteStatus.DRAFT,
        ticket_id=data.ticket_id,
        quote_id=data.quote_id,
        company_name=data.company_name or ticket.company_name,
        address=data.address or ticket.company_address,
        phone_number=data.phone_number or ticket.phone_number,
        order_no=quote.quote_no,
        lpo_no=data.lpo_no or quote.lpo_no or "",
        note_date=data.note_date,
        driver_signature_name=data.driver_signature_name,
    )

    db.add(note)
    await db.flush()  # Get the note.id before creating items

    for item_data in data.items:
        note_item = DeliveryNoteItem(
            delivery_note_id=note.id,
            quote_item_id=item_data.quote_item_id,
            sr_no=item_data.sr_no,
            item_description=item_data.item_description,
            qty=item_data.qty,
            remark=item_data.remark,
        )
        db.add(note_item)

    await db.commit()
    await db.refresh(note)

    return {"id": str(note.id), "note_no": note.note_no, "version": note.version}


@router.get("/delivery-notes/by-quote/{quote_id}")
async def list_delivery_notes_by_quote(
    quote_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DeliveryNote).where(DeliveryNote.quote_id == quote_id).order_by(DeliveryNote.version)
    )
    notes = result.scalars().all()
    return [
        {
            "id": str(n.id),
            "note_no": n.note_no,
            "version": n.version,
            "status": n.status.value,
            "note_date": n.note_date.isoformat(),
            "created_at": n.created_at.isoformat(),
        }
        for n in notes
    ]


@router.get("/delivery-notes/{note_id}")
async def get_delivery_note(
    note_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    note = await db.get(DeliveryNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Delivery note not found")

    items_result = await db.execute(
        select(DeliveryNoteItem)
        .where(DeliveryNoteItem.delivery_note_id == note.id)
        .order_by(DeliveryNoteItem.sr_no)
    )
    items = items_result.scalars().all()

    return {
        "id": str(note.id),
        "note_no": note.note_no,
        "version": note.version,
        "status": note.status.value,
        "company_name": note.company_name,
        "address": note.address,
        "phone_number": note.phone_number,
        "order_no": note.order_no,
        "lpo_no": note.lpo_no,
        "note_date": note.note_date.isoformat(),
        "driver_signature_name": note.driver_signature_name,
        "items": [
            {
                "sr_no": i.sr_no,
                "item_description": i.item_description,
                "qty": i.qty,
                "remark": i.remark,
            }
            for i in items
        ],
    }


@router.post("/delivery-notes/{note_id}/send")
async def send_delivery_note(
    note_id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    note = await db.get(DeliveryNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Delivery note not found")

    ticket = await db.get(Ticket, note.ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    items_result = await db.execute(
        select(DeliveryNoteItem)
        .where(DeliveryNoteItem.delivery_note_id == note.id)
        .order_by(DeliveryNoteItem.sr_no)
    )
    items = items_result.scalars().all()

    note_data = {
        "note_no": note.note_no,
        "version": note.version,
        "company_name": note.company_name,
        "address": note.address,
        "phone_number": note.phone_number,
        "order_no": note.order_no,
        "lpo_no": note.lpo_no,
        "note_date": note.note_date.isoformat(),
        "items": [
            {"sr_no": i.sr_no, "item_description": i.item_description, "qty": i.qty, "remark": i.remark}
            for i in items
        ],
    }

    access_token = request.cookies.get("access_token", "")
    frontend_url = f"{settings.FRONTEND_URL}/dashboard/delivery-notes/{note_id}"

    def _render_note_pdf() -> bytes:
        from playwright.sync_api import sync_playwright
        parsed = urlparse(settings.FRONTEND_URL)
        cookie_domain = parsed.hostname or "localhost"
        cookie_secure = parsed.scheme == "https"
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                ctx = browser.new_context()
                if access_token:
                    ctx.add_cookies([{
                        "name": "access_token",
                        "value": access_token,
                        "domain": cookie_domain,
                        "path": "/",
                        "httpOnly": True,
                        "secure": cookie_secure,
                    }])
                page = ctx.new_page()
                page.goto(frontend_url, wait_until="networkidle", timeout=30000)
                page.evaluate("() => { document.querySelectorAll('.print\\\\:hidden').forEach(el => el.style.display='none'); }")
                pdf_bytes = page.pdf(format="A4", print_background=True, margin={"top":"0","right":"0","bottom":"0","left":"0"})
                browser.close()
                return pdf_bytes
        except Exception as e:
            print(f"[PDF EMAIL ERROR] Delivery note {note_id}: {e}")
            return b""

    pdf_bytes = await asyncio.to_thread(_render_note_pdf)

    from app.services.emails import send_delivery_note_email
    background_tasks.add_task(send_delivery_note_email, ticket.email, ticket.customer_name, note_data, pdf_bytes)

    note.status = DeliveryNoteStatus.SENT
    db.add(note)
    await db.commit()

    return {"message": "Delivery note sent successfully", "status": "SENT"}
