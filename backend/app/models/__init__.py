"""
Models package - all database models are imported here.

This makes imports cleaner throughout the app:
  from app.models import User
instead of:
  from app.models.user import User
"""

from app.models.user import User, UserRole
from app.models.availability import StaffAvailability
from app.models.ticket import Ticket, TicketStatusEnum
from app.models.quote import Quote, QuoteItem, QuoteStatusEnum

__all__ = ["User", "UserRole", "StaffAvailability", "Ticket", "TicketStatusEnum", "Quote", "QuoteItem", "QuoteStatusEnum"]
