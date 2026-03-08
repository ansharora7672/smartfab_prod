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

from app.database import init_db
from app.config import settings
from app.routers import auth_router


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

    yield  # App is running and handling requests here

    # --- SHUTDOWN ---
    print(" Shutting down SmartFab Lathe API")


# ============================================================
# CREATE THE FASTAPI APP
# ============================================================
app = FastAPI(
    title="SmartFab Lathe API",
    description="Order and workflow management API for SmartFab Lathe manufacturing services",
    version="0.1.0",
    lifespan=lifespan,
)

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
