from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings

# ============================================================
# CREATE THE ASYNC ENGINE
# ============================================================
# The engine is the "connection factory" — it manages a POOL of
# connections to PostgreSQL so we don't open/close connections
# for every single request (that would be slow).
#
# echo=True → prints all SQL queries to console (GREAT for learning,
#             turn this OFF in production for performance)
# ============================================================
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=5,        # Keep 5 connections ready (default)
    max_overflow=10,    # If all 5 are busy, create up to 10 more temporarily
    pool_timeout=30,    # Wait 30 sec for a free connection before giving up
    echo=settings.APP_ENV == "development",  # Only print SQL queries in development mode
    future=True  # Use SQLAlchemy 2.0 style
)
# ============================================================
# CREATE THE SESSION FACTORY
# ============================================================
# A session factory is like a "template" for creating sessions.
# Each API request gets its own session, uses it, then closes it.
#
# expire_on_commit=False → after we save something, the data
# stays accessible in Python. Without this, accessing saved
# data after commit would trigger another database query.
# ============================================================
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)
async def get_session():
    async with async_session() as session:
        yield session

async def init_db():
    """
    Create all database tables based on our SQLModel models.
    This runs once when the app starts. It looks at all the SQLModel
    classes we've defined and creates the corresponding tables in
    PostgreSQL IF they don't already exist.
    NOTE: Later we'll use Alembic migrations instead of this,
    but for development/testing this is a quick way to get started.
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def bootstrap_admin():
    """ 
    Problem: To create users, you need to be an Admin.
             But if the database is empty, there are no Admins.
    
    Solution: On every startup, check if ANY user exists.
              If the table is empty, create a Super Admin using
              credentials from the .env file.
    
    Safety: Once at least one user exists, this function does NOTHING.
            It will never overwrite or duplicate existing users.
    """
    from sqlmodel import select
    from app.models.user import User, UserRole
    from app.services.auth import hash_password
    
    async with async_session() as session:
        # Check if ANY user exists in the database
        result = await session.execute(select(User).limit(1))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            # Users already exist — do nothing
            return
        
        # No users found — create the bootstrap admin
        admin = User(
            email=settings.ADMIN_EMAIL,
            full_name=settings.ADMIN_FULLNAME,
            role=UserRole.ADMIN,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
        )
        
        session.add(admin)
        await session.commit()
        print(f"  [BOOTSTRAP] Admin user created: {settings.ADMIN_EMAIL}")
