# app/models/registration.py
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship, UniqueConstraint
from datetime import datetime

# Import models needed at runtime
from .user import UserPublic
from .competition import CompetitionPublic

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.competition import Competition

class RegistrationBase(SQLModel):
    user_id: int = Field(foreign_key="user.id", primary_key=True, index=True) # Составной ПК
    competition_id: int = Field(foreign_key="competition.id", primary_key=True, index=True) # Составной ПК

class Registration(RegistrationBase, table=True):
    # Определяем составной первичный ключ и уникальность пары
    __table_args__ = (
        UniqueConstraint("user_id", "competition_id", name="uq_user_competition_registration"),
        {'extend_existing': True}
    )

    registered_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships with viewonly to prevent circular references
    user: "app.models.user.User" = Relationship(sa_relationship_kwargs={"viewonly": True})
    competition: "app.models.competition.Competition" = Relationship(sa_relationship_kwargs={"viewonly": True})

# Модель для создания регистрации (просто ID)
class RegistrationCreate(SQLModel):
    user_id: int
    competition_id: int

# Модель для чтения регистрации (возможно, с деталями)
class RegistrationRead(RegistrationBase):
    registered_at: datetime

# Модель для обновления регистрации
class RegistrationUpdate(SQLModel):
    # Usually just status or other metadata that might change
    # Since our registration doesn't have status field yet, this is empty
    pass

# Модель для отображения участника в админке
class RegistrationReadWithUser(SQLModel):
    registered_at: datetime
    user: Optional[UserPublic] = None

# Модель для отображения соревнования, на которое зарегистрирован юзер
class RegistrationReadWithCompetition(SQLModel):
    registered_at: datetime
    competition: Optional[CompetitionPublic] = None