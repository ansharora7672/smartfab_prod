from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.driver import Driver
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.driver import DriverCreate, DriverPublic, DriverUpdate


router = APIRouter(prefix="/admin/drivers", tags=["Drivers"])


@router.get("/", response_model=list[DriverPublic])
async def list_drivers(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Driver).order_by(Driver.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=DriverPublic, status_code=status.HTTP_201_CREATED)
async def create_driver(
    data: DriverCreate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    driver = Driver(**data.model_dump())
    db.add(driver)
    await db.commit()
    await db.refresh(driver)
    return driver


@router.patch("/{driver_id}", response_model=DriverPublic)
async def update_driver(
    driver_id: str,
    data: DriverUpdate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    driver = await db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    for k, v in data.model_dump(exclude_none=True).items():
        setattr(driver, k, v)

    driver.updated_at = datetime.now(timezone.utc)
    db.add(driver)
    await db.commit()
    await db.refresh(driver)
    return driver


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    driver_id: str,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    driver = await db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    await db.delete(driver)
    await db.commit()
