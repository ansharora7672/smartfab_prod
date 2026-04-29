import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.user import User
from app.models.vendor import Vendor
from app.routers.auth import get_current_user
from app.schemas.vendor import VendorCreate, VendorPublic, VendorUpdate, VendorInquiryRequest
from app.services.emails import send_vendor_inquiry_email

router = APIRouter(prefix="/admin/vendors", tags=["Vendors"])


@router.get("/", response_model=list[VendorPublic])
async def list_vendors(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Vendor).order_by(Vendor.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=VendorPublic, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    data: VendorCreate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    vendor = Vendor(**data.model_dump())
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    return vendor


@router.patch("/{vendor_id}", response_model=VendorPublic)
async def update_vendor(
    vendor_id: str,
    data: VendorUpdate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    vendor = await db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    for k, v in data.model_dump(exclude_none=True).items():
        setattr(vendor, k, v)

    vendor.updated_at = datetime.now(timezone.utc)
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(
    vendor_id: str,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    vendor = await db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    await db.delete(vendor)
    await db.commit()


@router.post("/{vendor_id}/send-inquiry")
async def send_vendor_inquiry(
    vendor_id: str,
    data: VendorInquiryRequest,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    vendor = await db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    sent = send_vendor_inquiry_email(
        to_email=vendor.email,
        vendor_name=vendor.company_name,
        sender_name=current_user.full_name,
        subject=data.subject,
        item_name=data.item_name,
        item_description=data.item_description,
        quantity=data.quantity,
        message=data.message,
    )

    if not sent:
        raise HTTPException(status_code=502, detail="Failed to send inquiry email")

    return {"message": f"Inquiry sent to {vendor.company_name}"}
