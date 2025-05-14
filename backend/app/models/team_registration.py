# app/models/team_registration.py
import enum
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel, Column
from sqlalchemy import Enum

if TYPE_CHECKING:
    from app.models.team import Team
    from app.models.competition import Competition


class TeamRegistrationStatus(str, enum.Enum):
    REGISTERED = "registered"
    WAITLISTED = "waitlisted" # If competition is full
    WITHDRAWN = "withdrawn"
    DISQUALIFIED = "disqualified"
    CHECKED_IN = "checked_in" # Optional: For day-of check-in


# Database model for Team Registration
class TeamRegistration(SQLModel, table=True):
    # Adding extend_existing=True to avoid the "Table already defined" error
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id", index=True)
    competition_id: int = Field(foreign_key="competition.id", index=True)
    registration_date: datetime = Field(default_factory=datetime.utcnow)
    status: TeamRegistrationStatus = Field(default=TeamRegistrationStatus.REGISTERED, sa_column=Column(Enum(TeamRegistrationStatus)))
    # roster_snapshot: Optional[dict] = Field(default=None, sa_column=Column(JSON)) # Consider adding later if roster lock is strictly enforced via snapshot

    # Viewonly relationships to prevent circular references
    team: "app.models.team.Team" = Relationship(sa_relationship_kwargs={"viewonly": True})
    competition: "app.models.competition.Competition" = Relationship(sa_relationship_kwargs={"viewonly": True})


# --- Update Competition Model ---
# Need to add relationship to Competition model in competition.py
# team_registrations: List["TeamRegistration"] = Relationship(back_populates="competition") 