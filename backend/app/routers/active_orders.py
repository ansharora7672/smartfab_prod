import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.delivery import DeliveryAssignment, DeliveryNote, DeliveryNoteItem, DeliveryNoteStatus
from app.models.driver import Driver
from app.models.quote import Quote, QuoteItem, QuoteStatusEnum
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.user import User
from app.routers.auth import get_current_user
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
                    "items": [
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
                    ],
                },
                "delivery_assignments": assignments,
                "delivery_notes": delivery_notes,
                "invoice": invoice_data,
            }
        )

    return response


@router.post("/tickets/{ticket_id}/mark-complete")
async def mark_order_complete(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status != TicketStatusEnum.ACTIVE_ORDER:
        raise HTTPException(status_code=400, detail="Only active orders can be marked as complete")

    ticket.status = TicketStatusEnum.CLOSED
    ticket.updated_at = datetime.now(timezone.utc)
    db.add(ticket)
    await db.commit()
    return {"message": "Order marked as complete and moved to completed orders"}


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

    from app.services.emails import send_delivery_note_email
    background_tasks.add_task(send_delivery_note_email, ticket.email, ticket.customer_name, note_data)

    note.status = DeliveryNoteStatus.SENT
    db.add(note)
    await db.commit()

    return {"message": "Delivery note sent successfully", "status": "SENT"}
