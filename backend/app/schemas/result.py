from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from app.schemas.user import UserPublic  # Import UserPublic for nested data

# --- Result Schemas ---

class ResultBase(BaseModel):
    result_value: Optional[str] = None
    rank: Optional[int] = None

class ResultCreate(ResultBase):
    user_id: int
    competition_id: int

class ResultUpdate(BaseModel):
    result_value: Optional[str] = None
    rank: Optional[int] = None

class ResultRead(ResultBase):
    id: int
    user_id: int
    competition_id: int
    submitted_at: datetime

    class Config:
        from_attributes = True

class ResultReadWithUser(ResultRead):
    user: Optional[UserPublic] = None 