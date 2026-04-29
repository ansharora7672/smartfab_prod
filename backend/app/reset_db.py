import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def drop_table():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        # New delivery tables (drop first due to FK dependencies)
        await conn.execute(text("DROP TABLE IF EXISTS delivery_note_items CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS delivery_notes CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS delivery_assignments CASCADE"))
        # Old delivery table (from old model — safe to drop even if not present)
        await conn.execute(text("DROP TABLE IF EXISTS deliveries CASCADE"))
        # Core tables
        await conn.execute(text("DROP TABLE IF EXISTS invoice_items CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS invoices CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS quote_items CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS quotes CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS tickets CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS staff_availabilities CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS vendors CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS drivers CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))

        print("All tables dropped. Restart the FastAPI server to rebuild from scratch.")

asyncio.run(drop_table())
