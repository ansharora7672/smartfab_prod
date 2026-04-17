import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def drop_tables():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS quote_items CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS quotes CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS invoice_items CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS invoices CASCADE"))
        print("Required tables have been dropped! FastAPI will recreate them structurally correct.")

asyncio.run(drop_tables())
