# =============================================================================
# LPO SUBMISSION SCHEMAS
# =============================================================================
# These Pydantic models validate the data when a customer submits their
# Local Purchase Order (LPO) number after approving a quote.
#
# WHY A SEPARATE FILE?
#   Each schema file maps to one "domain concept". LPO submission is its own
#   concept — it's not a quote action or a ticket action, it's a unique
#   customer-initiated step that bridges the two.
# =============================================================================

from pydantic import BaseModel, Field


class LPOSubmitRequest(BaseModel):
    """
    What the customer sends when they submit their LPO number.
    
    - token: The same JWT from their approval email (proves identity)
    - lpo_number: Their company's purchase order reference number
    """
    token: str
    lpo_number: str = Field(..., min_length=1, max_length=100)


class LPOStaffEntryRequest(BaseModel):
    """
    What staff/admin sends when manually entering an LPO number
    from the dashboard (for cases where the customer emails the LPO
    instead of using the web form).
    """
    lpo_number: str = Field(..., min_length=1, max_length=100)
