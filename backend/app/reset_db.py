import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def drop_table():
    # Connects to your exact database
    engine = create_async_engine("postgresql+asyncpg://postgres:admin@localhost:5432/smartfab")
    async with engine.begin() as conn:
        # Destroys the old table completely
        await conn.execute(text("DROP TABLE IF EXISTS staff_availability CASCADE"))
        print("Table destroyed! You can now restart your FastAPI server.")

asyncio.run(drop_table())
