"""
main.py — FastAPI Application Entry Point

This is where the app starts. It creates the FastAPI instance,
sets up CORS, registers routes, and handles startup/shutdown events.

TO RUN THIS APP:
  cd backend
  uvicorn app.main:app --reload

  - app.main → the file path (app/main.py)
  - :app → the variable name (the FastAPI() instance below)
  - --reload → auto-restart when you save code changes (dev only)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db, bootstrap_admin
from app.config import settings
from app.routers import auth_router, admin_users_router, availability_router, ticket_router, vendors_router, drivers_router, active_orders_router, invoices_router, track_order_router
from app.routers.quotes import quotes_router, public_quotes_router
from app.routers.dashboard import dashboard_router

# Import models so SQLModel metadata registers them before initialization
from app.models.vendor import Vendor
from app.models.driver import Driver
from app.models.delivery import DeliveryAssignment, DeliveryNote, DeliveryNoteItem

# Start our background email scheduler!
from app.services.scheduler import start_scheduler, stop_scheduler

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


# ============================================================
# LIFESPAN — Startup & Shutdown Events
# ============================================================
# The "lifespan" function runs code when the app starts and stops.
# This is the modern way in FastAPI (replaces old @app.on_event).
#
# Code BEFORE 'yield' runs on STARTUP (connect to DB, etc.)
# Code AFTER 'yield' runs on SHUTDOWN (close connections, cleanup)
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs when the app starts up and shuts down.
    """
    # --- STARTUP ---
    print(f" Starting SmartFab Lathe API in {settings.APP_ENV} mode")
    await init_db()  # Create database tables
    print(" Database tables initialized")
    await bootstrap_admin()  # Create first admin if DB is empty
    
    start_scheduler()

    yield  # App is running and handling requests here

    # --- SHUTDOWN ---
    print(" Shutting down SmartFab Lathe API")
    stop_scheduler()


# ============================================================
# CREATE THE FASTAPI APP
# ============================================================
app = FastAPI(
    title="SmartFab Lathe API",
    description="Order and workflow management API for SmartFab Lathe manufacturing services",
    version="0.1.0",
    lifespan=lifespan,
)

# Set up global rate limiting to mitigate DDoS vectors
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================================
# CORS MIDDLEWARE
# ============================================================
# CORS = Cross-Origin Resource Sharing
#
# In production, you'd replace ["*"] with your actual domain:
# ["https://smartfablathe.com"]
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],        # Which frontends can call us (* = all, restrict in production)
    allow_credentials=True,      # Allow cookies/auth headers
    allow_methods=["*"],         # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],         # Allow all headers
)


# ============================================================
# HEALTH CHECK ROUTE
# ============================================================
@app.get("/")
async def health_check():
    """Simple health check — returns OK if the app is running."""
    return {
        "status": "healthy",
        "service": "SmartFab Lathe API",
        "environment": settings.APP_ENV
    }

# Register routers
app.include_router(auth_router)
app.include_router(admin_users_router)
app.include_router(availability_router)
app.include_router(ticket_router)
app.include_router(quotes_router)
app.include_router(public_quotes_router)
app.include_router(vendors_router)
app.include_router(drivers_router)
app.include_router(active_orders_router)
app.include_router(invoices_router)
app.include_router(dashboard_router)
app.include_router(track_order_router)
