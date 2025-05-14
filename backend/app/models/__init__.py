# app/models/__init__.py

# Import all models here to ensure they are registered with SQLModel metadata
# when create_db_and_tables is called.

from .user import User, UserCreate, UserRead, UserPublic
from .token import Token, TokenPayload
from .message import Message
from .competition import (
    Competition, CompetitionCreate, CompetitionUpdate,
    CompetitionReadWithOwner, CompetitionPublic, CompetitionStatusEnum, CompetitionReadWithTeams
)
from .registration import Registration, RegistrationCreate, RegistrationRead, RegistrationUpdate
from .result import Result, ResultCreate, ResultRead, ResultUpdate, ResultReadWithUser
from .team import Team, TeamBase, TeamMember, TeamRole, TeamStatus, TeamVisibility # New Team models
from .team_registration import TeamRegistration, TeamRegistrationStatus

# You might want to organize schemas separately, but if they are in model files:
# from .team import TeamCreate, TeamRead, TeamUpdate, TeamMemberRead, TeamReadWithMembers, TeamTransferLeadership # Team schemas
# from .team_registration import TeamRegistrationCreate, TeamRegistrationRead, TeamRegistrationUpdate # TeamRegistration schemas

# It's generally better practice to keep SQLModel models and Pydantic schemas in separate directories (e.g., app/models and app/schemas)
# and import only the SQLModel table models here. 