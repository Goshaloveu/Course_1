# app/models/user.py
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

# Remove the aliases to avoid confusion
from app.models.team import Team, TeamMember

# Импортируем связанные модели для Relationship type hints
if TYPE_CHECKING:
    # Переносим сюда или удаляем, если строки в Relationship достаточны
    from app.models.competition import Competition
    from app.models.registration import Registration
    from app.models.result import Result

class UserBase(SQLModel):
    telegram_id: int = Field(index=True, unique=True, sa_column_kwargs={"nullable": False})
    username: Optional[str] = Field(default=None, index=True)
    first_name: Optional[str] = Field(default=None)
    last_name: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    is_organizer: bool = Field(default=False, nullable=False)
    is_active: bool = Field(default=True) # Added is_active field

class User(UserBase, table=True):
    # Adding extend_existing=True to avoid the "Table already defined" error
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: Optional[str] = Field(nullable=True) # Nullable for TG-only users
    registration_date: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow}, nullable=False)

    # Simplified relationships - using default SQLModel behavior
    organized_competitions: List["app.models.competition.Competition"] = Relationship(sa_relationship_kwargs={"viewonly": True})
    registrations: List["app.models.registration.Registration"] = Relationship(sa_relationship_kwargs={"viewonly": True})
    results: List["app.models.result.Result"] = Relationship(sa_relationship_kwargs={"viewonly": True})
    led_teams: List["app.models.team.Team"] = Relationship(sa_relationship_kwargs={"viewonly": True})
    team_memberships: List["app.models.team.TeamMember"] = Relationship(sa_relationship_kwargs={"viewonly": True})

# Модель для создания пользователя (например, через API, хотя у нас OAuth)
class UserCreate(UserBase):
    pass # Для Telegram OAuth поля берутся из ответа TG

# Модель для чтения данных пользователя (возвращается API)
class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

# Модель для обновления данных пользователя
class UserUpdate(SQLModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_organizer: Optional[bool] = None
    is_active: Optional[bool] = None

# Модель для публичного отображения пользователя (например, в результатах)
class UserPublic(SQLModel):
    id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    avatar_url: Optional[str] = None # Можно добавить аватарку в таблицу результатов