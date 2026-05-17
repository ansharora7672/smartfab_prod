import asyncio
import uuid
import datetime as dt
from typing import List, Optional
from pydantic import BaseModel
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatusEnum
from app.models.quote import Quote, QuoteStatusEnum
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.user import User
from app.routers.auth import get_current_user
from app.config import settings

invoices_router = APIRouter(prefix="/admin/invoices", tags=["Invoices"])


class InvoiceItemCreate(BaseModel):
    sr_no: int
    description_of_service: str
    quantity: int
    per: str = "pcs"
    rate_excl_vat: float
    rate_incl_vat: float
    discount_aed: float = 0.0
    vat_percentage: float = 5.0
    amount: float
    total_incl_vat: float


class InvoiceCreate(BaseModel):
    ticket_id: uuid.UUID
    quote_id: uuid.UUID
    delivery_note: Optional[str] = ""
    payment_terms: Optional[str] = ""
    supplier_reference: Optional[str] = ""
    other_references: Optional[str] = ""
    buyers_order_no: Optional[str] = ""
    buyers_order_dated: Optional[str] = ""
    despatch_doc_no: Optional[str] = ""
    delivery_note_date: Optional[str] = ""
    despatched_through: Optional[str] = ""
    destination: Optional[str] = ""
    terms_of_delivery: Optional[str] = ""
    amount_chargeable_words: Optional[str] = ""
    taxable_value: float = 0.0
    vat_total: float = 0.0
    invoice_total: float = 0.0
    items: List[InvoiceItemCreate] = []


def _invoice_to_dict(inv: Invoice, items: list) -> dict:
    return {
        "id": str(inv.id),
        "invoice_no": inv.invoice_no,
        "ticket_id": str(inv.ticket_id),
        "status": inv.status.value,
        "delivery_note": inv.delivery_note,
        "payment_terms": inv.payment_terms,
        "supplier_reference": inv.supplier_reference,
        "other_references": inv.other_references,
        "buyers_order_no": inv.buyers_order_no or "",
        "buyers_order_dated": inv.buyers_order_dated or "",
        "despatch_doc_no": inv.despatch_doc_no or "",
        "delivery_note_date": inv.delivery_note_date or "",
        "despatched_through": inv.despatched_through,
        "destination": inv.destination,
        "terms_of_delivery": inv.terms_of_delivery,
        "amount_chargeable_words": inv.amount_chargeable_words,
        "taxable_value": inv.taxable_value,
        "vat_total": inv.vat_total,
        "invoice_total": inv.invoice_total,
        "created_at": inv.created_at.isoformat(),
        "items": [
            {
                "id": str(i.id),
                "sr_no": i.sr_no,
                "description_of_service": i.description_of_service,
                "quantity": i.quantity,
                "per": i.per,
                "rate_excl_vat": i.rate_excl_vat,
                "rate_incl_vat": i.rate_incl_vat,
                "discount_aed": i.discount_aed,
                "vat_percentage": i.vat_percentage,
                "amount": i.amount,
                "total_incl_vat": i.total_incl_vat,
            }
            for i in items
        ],
    }


@invoices_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_invoice(
    data: InvoiceCreate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    ticket = await db.get(Ticket, data.ticket_id)
    quote = await db.get(Quote, data.quote_id)
    if not ticket or not quote:
        raise HTTPException(status_code=404, detail="Ticket or quote not found")

    # Count existing invoices for this ticket to version them
    existing_res = await db.execute(
        select(Invoice).where(Invoice.ticket_id == data.ticket_id).order_by(Invoice.created_at.desc())
    )
    existing = existing_res.scalars().all()
    version = len(existing) + 1
    invoice_no = f"INV-{ticket.ticket_id}" if version == 1 else f"INV-{ticket.ticket_id}-V{version}"

    inv = Invoice(
        ticket_id=data.ticket_id,
        invoice_no=invoice_no,
        delivery_note=data.delivery_note,
        payment_terms=data.payment_terms,
        supplier_reference=data.supplier_reference,
        other_references=data.other_references,
        buyers_order_no=data.buyers_order_no,
        buyers_order_dated=data.buyers_order_dated,
        despatch_doc_no=data.despatch_doc_no,
        delivery_note_date=data.delivery_note_date,
        despatched_through=data.despatched_through,
        destination=data.destination,
        terms_of_delivery=data.terms_of_delivery,
        amount_chargeable_words=data.amount_chargeable_words,
        taxable_value=data.taxable_value,
        vat_total=data.vat_total,
        invoice_total=data.invoice_total,
        status=InvoiceStatusEnum.DRAFT,
    )
    db.add(inv)
    await db.flush()

    for item_data in data.items:
        item = InvoiceItem(**item_data.model_dump(), invoice_id=inv.id)
        db.add(item)

    await db.commit()
    await db.refresh(inv)

    items_res = await db.execute(select(InvoiceItem).where(InvoiceItem.invoice_id == inv.id))
    items = items_res.scalars().all()

    return _invoice_to_dict(inv, items)


@invoices_router.get("/by-ticket/{ticket_id}")
async def list_invoices_by_ticket(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(
        select(Invoice).where(Invoice.ticket_id == ticket_id).order_by(Invoice.created_at.desc())
    )
    invoices = res.scalars().all()
    result = []
    for inv in invoices:
        items_res = await db.execute(select(InvoiceItem).where(InvoiceItem.invoice_id == inv.id))
        result.append(_invoice_to_dict(inv, items_res.scalars().all()))
    return result


@invoices_router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    items_res = await db.execute(select(InvoiceItem).where(InvoiceItem.invoice_id == inv.id).order_by(InvoiceItem.sr_no))
    items = items_res.scalars().all()

    ticket = await db.get(Ticket, inv.ticket_id)
    return {
        "invoice": _invoice_to_dict(inv, items),
        "ticket": {
            "ticket_id": ticket.ticket_id if ticket else "",
            "customer_name": ticket.customer_name if ticket else "",
            "company_name": ticket.company_name if ticket else "",
            "company_address": ticket.company_address if ticket else "",
            "phone_number": ticket.phone_number if ticket else "",
            "email": ticket.email if ticket else "",
            "lpo_number": ticket.lpo_number if ticket else "",
        } if ticket else {},
    }


@invoices_router.post("/{invoice_id}/send")
async def send_invoice(
    invoice_id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    inv = await db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    ticket = await db.get(Ticket, inv.ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    items_res = await db.execute(select(InvoiceItem).where(InvoiceItem.invoice_id == inv.id).order_by(InvoiceItem.sr_no))
    items = items_res.scalars().all()

    invoice_data = _invoice_to_dict(inv, items)
    # Supplement with extra fields the PDF generator expects
    invoice_data["dated"] = inv.created_at.strftime("%d/%m/%Y")
    invoice_data["display_invoice_no"] = ticket.ticket_id  # show ticket short code as Invoice No
    invoice_data["buyers_order_no"] = inv.buyers_order_no or ticket.lpo_number or ""
    invoice_data["buyers_order_dated"] = inv.buyers_order_dated or ""

    ticket_data = {
        "customer_name": ticket.customer_name,
        "company_name": ticket.company_name,
        "company_address": ticket.company_address,
        "phone_number": ticket.phone_number,
    }

    access_token = request.cookies.get("access_token", "")
    frontend_url = f"{settings.FRONTEND_URL}/dashboard/invoices/{invoice_id}"

    def _render_invoice_pdf() -> bytes:
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
            print(f"[PDF EMAIL ERROR] Invoice {invoice_id}: {e}")
            return b""

    pdf_bytes = await asyncio.to_thread(_render_invoice_pdf)

    from app.services.emails import send_invoice_email
    background_tasks.add_task(send_invoice_email, ticket.email, ticket.customer_name, invoice_data, ticket_data, pdf_bytes)

    # Mark invoice sent and ticket CLOSED (completed)
    inv.status = InvoiceStatusEnum.SENT
    inv.updated_at = dt.datetime.now(dt.timezone.utc)
    db.add(inv)

    ticket.status = TicketStatusEnum.CLOSED
    ticket.updated_at = dt.datetime.now(dt.timezone.utc)
    db.add(ticket)

    await db.commit()

    return {"message": f"Invoice {inv.invoice_no} sent. Order marked as completed.", "status": "SENT"}
