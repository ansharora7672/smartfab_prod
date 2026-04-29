from app.routers.auth import router as auth_router
from app.routers.admin_users import router as admin_users_router
from app.routers.availability import router as availability_router
from app.routers.ticket import ticket_router
from app.routers.vendors import router as vendors_router
from app.routers.drivers import router as drivers_router
from app.routers.active_orders import router as active_orders_router
from app.routers.invoices import invoices_router
from app.routers.track_order import track_order_router

__all__ = [
    "auth_router",
    "admin_users_router",
    "availability_router",
    "ticket_router",
    "vendors_router",
    "drivers_router",
    "active_orders_router",
    "invoices_router",
    "track_order_router",
]
