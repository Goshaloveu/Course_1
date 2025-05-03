# app/models/registration.py
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship, UniqueConstraint
from datetime import datetime

if TYPE_CHECKING:
    from .user import User, UserPublic
    from .competition import Competition, CompetitionPublic

class RegistrationBase(SQLModel):
    user_id: int = Field(foreign_key="user.id", primary_key=True, index=True) # Составной ПК
    competition_id: int = Field(foreign_key="competition.id", primary_key=True, index=True) # Составной ПК

class Registration(RegistrationBase, table=True):
    # Определяем составной первичный ключ и уникальность пары
    __table_args__ = (UniqueConstraint("user_id", "competition_id", name="uq_user_competition_registration"),)

    registered_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Связи
    user: 'User' = Relationship(back_populates="registrations")
    competition: 'Competition' = Relationship(back_populates="registrations")

# Модель для создания регистрации (просто ID)
class RegistrationCreate(SQLModel):
    user_id: int
    competition_id: int

# Модель для чтения регистрации (возможно, с деталями)
class RegistrationRead(RegistrationBase):
    registered_at: datetime

# Модель для отображения участника в админке
class RegistrationReadWithUser(SQLModel):
    registered_at: datetime
    user: Optional['UserPublic'] = None

# Модель для отображения соревнования, на которое зарегистрирован юзер
class RegistrationReadWithCompetition(SQLModel):
    registered_at: datetime
    competition: Optional['CompetitionPublic'] = None