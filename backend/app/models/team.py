# app/models/team.py
import enum
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel, Column
from sqlalchemy import Enum
from sqlalchemy.orm import foreign, remote

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.team_registration import TeamRegistration


class TeamRole(str, enum.Enum):
    LEADER = "leader"
    OFFICER = "officer"
    MEMBER = "member"
    SUBSTITUTE = "substitute"


class TeamStatus(str, enum.Enum):
    ACTIVE = "active"
    LOOKING_FOR_MEMBERS = "looking_for_members"
    DISBANDED = "disbanded"
    PRIVATE = "private" # Maybe same as InviteOnly?


class TeamVisibility(str, enum.Enum):
    PUBLIC = "public"
    INVITE_ONLY = "invite_only"


# Shared properties for Team
class TeamBase(SQLModel):
    name: str = Field(index=True, unique=True, max_length=50)
    tag: Optional[str] = Field(default=None, index=True, max_length=10)
    description: Optional[str] = Field(default=None, max_length=500)
    logo_url: Optional[str] = Field(default=None)
    banner_url: Optional[str] = Field(default=None)
    status: TeamStatus = Field(default=TeamStatus.ACTIVE, sa_column=Column(Enum(TeamStatus)))
    visibility: TeamVisibility = Field(default=TeamVisibility.PUBLIC, sa_column=Column(Enum(TeamVisibility)))


# Database model for Team
class Team(TeamBase, table=True):
    # Adding extend_existing=True to avoid the "Table already defined" error
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    leader_id: int = Field(foreign_key="user.id") # Direct link to leader User
    creation_date: datetime = Field(default_factory=datetime.utcnow)

    # All relationships set to viewonly to prevent circular references
    leader: "app.models.user.User" = Relationship(sa_relationship_kwargs={"viewonly": True})
    members: List["app.models.team.TeamMember"] = Relationship(sa_relationship_kwargs={"viewonly": True})
    registrations: List["app.models.team_registration.TeamRegistration"] = Relationship(sa_relationship_kwargs={"viewonly": True})


# Database model for Team Membership (Link table)
class TeamMember(SQLModel, table=True):
    # Adding extend_existing=True to avoid the "Table already defined" error
    __table_args__ = {'extend_existing': True}
    
    team_id: int = Field(foreign_key="team.id", primary_key=True)
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    role: TeamRole = Field(default=TeamRole.MEMBER, sa_column=Column(Enum(TeamRole)))
    join_date: datetime = Field(default_factory=datetime.utcnow)

    # Simplified relationships with viewonly
    team: "app.models.team.Team" = Relationship(sa_relationship_kwargs={"viewonly": True})
    user: "app.models.user.User" = Relationship(sa_relationship_kwargs={"viewonly": True})


# --- Update User Model ---
# Need to add relationships to User model in user.py
# led_teams: List["Team"] = Relationship(back_populates="leader")
# team_memberships: List["TeamMember"] = Relationship(back_populates="user")

# Note: We will need to create corresponding Pydantic schemas in a separate file or location.
# For now, focusing on the SQLModel definitions. 