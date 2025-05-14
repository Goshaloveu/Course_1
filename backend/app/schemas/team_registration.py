# app/schemas/team_registration.py
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from app.models.team_registration import TeamRegistrationStatus
from app.schemas.team import TeamRead # To show basic team info
from app.schemas.competition import CompetitionRead # Import from schemas instead of models

# --- Team Registration Schemas ---

# Properties to receive via API on creation (usually just team_id from context, competition_id from path)
class TeamRegistrationCreate(BaseModel):
    team_id: int
    # competition_id is usually taken from the URL path parameter


# Properties to receive via API on update (e.g., admin changing status)
class TeamRegistrationUpdate(BaseModel):
    status: Optional[TeamRegistrationStatus] = None


# Base properties stored in DB
class TeamRegistrationInDBBase(BaseModel):
    id: int
    team_id: int
    competition_id: int
    registration_date: datetime
    status: TeamRegistrationStatus

    class Config:
        from_attributes = True


# Properties to return to client
class TeamRegistrationRead(TeamRegistrationInDBBase):
    # Optionally include nested data
    # team: Optional[TeamRead] = None
    # competition: Optional[CompetitionRead] = None # Be careful about payload size
    pass

# Properties to return with nested team/competition details
class TeamRegistrationReadDetailed(TeamRegistrationRead):
    team: TeamRead
    # competition: CompetitionRead # Might still be too much, consider specific fields 