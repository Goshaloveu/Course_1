# app/schemas/competition.py
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.models.competition import CompetitionStatusEnum, CompetitionFormat

# --- Competition Schemas ---

# Properties to receive via API on creation
class CompetitionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    format: CompetitionFormat = CompetitionFormat.INDIVIDUAL
    type: Optional[str] = None  # For backward compatibility
    reg_start_at: Optional[datetime] = None
    reg_end_at: Optional[datetime] = None
    comp_start_at: Optional[datetime] = None
    comp_end_at: Optional[datetime] = None
    status: Optional[CompetitionStatusEnum] = None
    external_links_json: Optional[str] = None
    min_team_members: Optional[int] = None
    max_team_members: Optional[int] = None
    roster_lock_date: Optional[datetime] = None


# Properties to receive via API on update
class CompetitionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    format: Optional[CompetitionFormat] = None
    type: Optional[str] = None  # For backward compatibility
    reg_start_at: Optional[datetime] = None
    reg_end_at: Optional[datetime] = None
    comp_start_at: Optional[datetime] = None
    comp_end_at: Optional[datetime] = None
    status: Optional[CompetitionStatusEnum] = None
    external_links_json: Optional[str] = None
    min_team_members: Optional[int] = None
    max_team_members: Optional[int] = None
    roster_lock_date: Optional[datetime] = None


# Base properties stored in DB
class CompetitionRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    format: CompetitionFormat
    type: Optional[str] = None
    reg_start_at: Optional[datetime] = None
    reg_end_at: Optional[datetime] = None
    comp_start_at: Optional[datetime] = None
    comp_end_at: Optional[datetime] = None
    status: CompetitionStatusEnum
    external_links_json: Optional[str] = None
    min_team_members: Optional[int] = None
    max_team_members: Optional[int] = None
    roster_lock_date: Optional[datetime] = None
    organizer_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Competition with detailed information
class CompetitionReadDetailed(CompetitionRead):
    # Additional fields or nested objects could be included here
    pass 