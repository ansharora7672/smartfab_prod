import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def drop_table():
    # Connects using the same config as the rest of the app
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        # Destroys the old table completely
        await conn.execute(text("DROP TABLE IF EXISTS staff_availability CASCADE"))
        print("Table destroyed! You can now restart your FastAPI server.")

asyncio.run(drop_table())
