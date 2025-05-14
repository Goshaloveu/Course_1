# app/schemas/team.py
from typing import List, Optional
from pydantic import BaseModel, Field as PydanticField
from datetime import datetime

from app.models.team import TeamBase, TeamRole, TeamStatus, TeamVisibility
from app.models.user import UserPublic # Import UserPublic for member details

# --- Team Schemas ---

# Properties to receive via API on creation
class TeamCreate(TeamBase):
    name: str = PydanticField(..., max_length=50)
    tag: Optional[str] = PydanticField(None, max_length=10)


# Properties to receive via API on update
class TeamUpdate(BaseModel):
    name: Optional[str] = PydanticField(None, max_length=50)
    tag: Optional[str] = PydanticField(None, max_length=10)
    description: Optional[str] = PydanticField(None, max_length=500)
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    status: Optional[TeamStatus] = None
    visibility: Optional[TeamVisibility] = None


# Properties shared by models stored in DB
class TeamInDBBase(TeamBase):
    id: int
    leader_id: int
    creation_date: datetime

    class Config:
        from_attributes = True # Pydantic V2 alias for orm_mode


# Properties to return to client (base team info)
class TeamRead(TeamInDBBase):
    pass


# --- Team Member Schemas ---

class TeamMemberBase(BaseModel):
    team_id: int
    user_id: int
    role: TeamRole


class TeamMemberRead(TeamMemberBase):
    join_date: datetime
    user: UserPublic # Include public user details

    class Config:
        from_attributes = True


# Properties to return team details including members
class TeamReadWithMembers(TeamRead):
    leader: UserPublic # Include leader details
    members: List[TeamMemberRead] = []


# Schema for transferring leadership
class TeamTransferLeadership(BaseModel):
    new_leader_user_id: int

# Schema for updating a member's role
class TeamMemberUpdateRole(BaseModel):
    role: TeamRole

# Schema for adding a member (simplified for now)
# In a real app, this might involve invites or requests
class TeamAddMember(BaseModel):
    user_id: int
    role: TeamRole = TeamRole.MEMBER # Default role when adding 