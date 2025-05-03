# app/models/competition.py
from typing import Optional, List, TYPE_CHECKING, Literal
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from enum import Enum
import json # Для external_links_json

# Предотвращаем циклические импорты для type hints
if TYPE_CHECKING:
    from .user import User, UserPublic
    from .registration import Registration
    from .result import Result, ResultReadWithUser

# Возможные статусы соревнования
class CompetitionStatusEnum(str, Enum):
    UPCOMING = 'upcoming'
    REGISTRATION_OPEN = 'registration_open'
    ONGOING = 'ongoing'
    CLOSED = 'closed'
    FINISHED = 'finished'
    RESULTS_PUBLISHED = 'results_published'

class CompetitionBase(SQLModel):
    title: str = Field(index=True, nullable=False)
    description: Optional[str] = Field(default=None)
    # Можно использовать Enum, но для MVP строка проще
    type: Optional[str] = Field(default=None, index=True)
    reg_start_at: Optional[datetime] = Field(default=None)
    reg_end_at: Optional[datetime] = Field(default=None)
    comp_start_at: Optional[datetime] = Field(default=None)
    comp_end_at: Optional[datetime] = Field(default=None)
    status: CompetitionStatusEnum = Field(default=CompetitionStatusEnum.UPCOMING, nullable=False, index=True)
    # Храним ссылки как JSON-строку в SQLite
    external_links_json: Optional[str] = Field(default='{}') # Пример: '{"rules": "url", "platform": "url"}'

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

class Competition(CompetitionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organizer_id: int = Field(foreign_key="user.id", nullable=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow}, nullable=False)

    # Связи
    organizer: 'User' = Relationship(back_populates="organized_competitions")
    registrations: List['Registration'] = Relationship(back_populates="competition")
    results: List['Result'] = Relationship(back_populates="competition")

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

# Модель для чтения полного объекта соревнования (админка)
class CompetitionRead(CompetitionBase):
    id: int
    organizer_id: int
    created_at: datetime
    updated_at: datetime

# Модель для чтения соревнования с данными организатора
class CompetitionReadWithOwner(CompetitionRead):
     organizer: Optional['UserPublic'] = None # Включаем публичные данные организатора

# Модель для публичного отображения соревнования (список, детали для юзера)
class CompetitionPublic(CompetitionBase):
    id: int
    # Можно добавить organizer.username если нужно