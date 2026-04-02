import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone, timedelta
from sqlmodel import select
from app.database import async_session
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.user import User
from app.services.emails import send_ticket_lifecycle_notification
import logging
logger = logging.getLogger(__name__)

# The global scheduler instance
scheduler = AsyncIOScheduler()

async def check_upcoming_and_past_calls():
    """ Runs every 5 minutes to check for upcoming or recently passed consultations. """
    async with async_session() as session:
        # Find all tickets that are CLAIMED (meaning they haven't been completed yet)
        statement = select(Ticket).where(Ticket.status == TicketStatusEnum.CLAIMED)
        result = await session.execute(statement)
        tickets = result.scalars().all()
        
        now = datetime.now() # Naive datetime is used since the ticket's consultation time is naive
        
        for ticket in tickets:
            if not ticket.assigned_to_id:
                continue
                
            # Get the user to send the email
            user_stmt = select(User).where(User.id == ticket.assigned_to_id)
            user_res = await session.execute(user_stmt)
            user = user_res.scalars().first()
            if not user:
                continue

            # Calculate datetime of the consultation
            call_dt = datetime.combine(ticket.consultation_date, ticket.consultation_time)
            
            # If call is exactly 60 minutes away (allow a 5 min window to catch it)
            time_diff = call_dt - now
            if timedelta(minutes=55) <= time_diff <= timedelta(minutes=60):
                await asyncio.to_thread(
                    send_ticket_lifecycle_notification,
                    user.email, "UPCOMING_REMINDER", {"ticket": ticket, "user": user}
                )
                
            # If call time has just passed (0 to 5 mins past)
            if timedelta(minutes=-5) <= time_diff <= timedelta(minutes=0):
                await asyncio.to_thread(
                    send_ticket_lifecycle_notification,
                    user.email, "CALL_COMPLETED_PROMPT", {"ticket": ticket, "user": user}
                )

def start_scheduler():
    logger.info("Starting Background APScheduler...")
    scheduler.add_job(check_upcoming_and_past_calls, IntervalTrigger(minutes=5))
    scheduler.start()

def stop_scheduler():
    logger.info("Stopping Background APScheduler...")
    scheduler.shutdown(wait=False)
