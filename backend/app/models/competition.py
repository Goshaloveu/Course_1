# app/models/competition.py
from typing import Optional, List, TYPE_CHECKING, Literal, ForwardRef, Union, Any
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy import Enum, Index
from sqlalchemy.orm import foreign, remote
from datetime import datetime
from enum import Enum as PythonEnum
import json # Для external_links_json

# Import UserPublic outside TYPE_CHECKING to ensure it's available at runtime
from .user import UserPublic

# Предотвращаем циклические импорты для type hints
if TYPE_CHECKING:
    from app.models.user import User
    from app.models.registration import Registration
    from app.models.result import Result, ResultReadWithUser
    from app.models.team_registration import TeamRegistration
    # Reference schema types in TYPE_CHECKING
    from app.schemas.team_registration import TeamRegistrationRead

# Возможные статусы соревнования
class CompetitionStatusEnum(str, PythonEnum):
    UPCOMING = 'upcoming'
    REGISTRATION_OPEN = 'registration_open'
    REGISTRATION_CLOSED = 'registration_closed'
    ONGOING = 'ongoing'
    FINISHED = 'finished'
    RESULTS_PUBLISHED = 'results_published'

# Competition format enum
class CompetitionFormat(str, PythonEnum):
    INDIVIDUAL = 'individual'
    TEAM = 'team'

class CompetitionBase(SQLModel):
    title: str = Field(index=True, nullable=False)
    description: Optional[str] = Field(default=None)
    # Use the existing 'type' field instead of creating a new 'format' column
    type: Optional[str] = Field(default=CompetitionFormat.INDIVIDUAL.value, index=True)
    reg_start_at: Optional[datetime] = Field(default=None)
    reg_end_at: Optional[datetime] = Field(default=None)
    comp_start_at: Optional[datetime] = Field(default=None)
    comp_end_at: Optional[datetime] = Field(default=None)
    status: CompetitionStatusEnum = Field(default=CompetitionStatusEnum.UPCOMING, sa_column=Column(Enum(CompetitionStatusEnum)))
    # Храним ссылки как JSON-строку в SQLite
    external_links_json: Optional[str] = Field(default='{}') # Пример: '{"rules": "url", "platform": "url"}'
    # Team specific fields
    min_team_members: Optional[int] = Field(default=None) # Min members per team
    max_team_members: Optional[int] = Field(default=None) # Max members per team
    roster_lock_date: Optional[datetime] = Field(default=None) # Date after which team roster cannot be changed

    # Свойство для удобного доступа к ссылкам как к словарю
    @property
    def external_links(self) -> dict:
        try:
            return json.loads(self.external_links_json or '{}')
        except json.JSONDecodeError:
            return {}

    @external_links.setter
    def external_links(self, value: dict):
        self.external_links_json = json.dumps(value)
        
    # Add a format property that maps to/from the type field
    @property
    def format(self) -> CompetitionFormat:
        try:
            return CompetitionFormat(self.type) if self.type else CompetitionFormat.INDIVIDUAL
        except ValueError:
            return CompetitionFormat.INDIVIDUAL
    
    @format.setter
    def format(self, value: CompetitionFormat):
        self.type = value.value if value else CompetitionFormat.INDIVIDUAL.value

class Competition(CompetitionBase, table=True):
    # Adding extend_existing=True to avoid the "Table already defined" error
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    organizer_id: int = Field(foreign_key="user.id", nullable=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow}, nullable=False)

    # Simplified relationships with viewonly
    organizer: "app.models.user.User" = Relationship(sa_relationship_kwargs={"viewonly": True})
    registrations: List["app.models.registration.Registration"] = Relationship(sa_relationship_kwargs={"viewonly": True})
    results: List["app.models.result.Result"] = Relationship(sa_relationship_kwargs={"viewonly": True})
    team_registrations: List["app.models.team_registration.TeamRegistration"] = Relationship(sa_relationship_kwargs={"viewonly": True})

# Модель для создания соревнования
class CompetitionCreate(CompetitionBase):
    pass

# Модель для обновления соревнования
class CompetitionUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    reg_start_at: Optional[datetime] = None
    reg_end_at: Optional[datetime] = None
    comp_start_at: Optional[datetime] = None
    comp_end_at: Optional[datetime] = None
    status: Optional[CompetitionStatusEnum] = None
    external_links_json: Optional[str] = None
    min_team_members: Optional[int] = None
    max_team_members: Optional[int] = None
    roster_lock_date: Optional[datetime] = None

# Модель для чтения соревнования с данными организатора
class CompetitionReadWithOwner(CompetitionBase):
    id: int
    organizer_id: int
    created_at: datetime
    updated_at: datetime
    # Включаем организатора в ответ
    organizer: Optional[UserPublic] = None

# Для публичного API
class CompetitionPublic(CompetitionBase):
    id: int
    organizer_id: int

# Schema for reading a competition including team registration details
class CompetitionReadWithTeams(CompetitionReadWithOwner):
    # Use string annotation to avoid circular import
    team_registrations: List['TeamRegistrationRead'] = []