"""
Models package - all database models are imported here.

This makes imports cleaner throughout the app:
  from app.models import User
instead of:
  from app.models.user import User
"""

from app.models.user import User, UserRole

__all__ = ["User", "UserRole"]
