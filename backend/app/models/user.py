# app/models/user.py
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

# Импортируем связанные модели для Relationship type hints
if TYPE_CHECKING:
    # Переносим сюда или удаляем, если строки в Relationship достаточны
    from .competition import Competition
    from .registration import Registration
    from .result import Result

class UserBase(SQLModel):
    telegram_id: int = Field(index=True, unique=True, sa_column_kwargs={"nullable": False})
    username: Optional[str] = Field(default=None, index=True)
    first_name: Optional[str] = Field(default=None)
    last_name: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    is_organizer: bool = Field(default=False, nullable=False)

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow}, nullable=False)

    # Связи (для ORM)
    organized_competitions: List['Competition'] = Relationship(back_populates="organizer")
    registrations: List['Registration'] = Relationship(back_populates="user")
    results: List['Result'] = Relationship(back_populates="user")

# Модель для создания пользователя (например, через API, хотя у нас OAuth)
class UserCreate(UserBase):
    pass # Для Telegram OAuth поля берутся из ответа TG

# Модель для чтения данных пользователя (возвращается API)
class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

# Модель для публичного отображения пользователя (например, в результатах)
class UserPublic(SQLModel):
    id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    avatar_url: Optional[str] = None # Можно добавить аватарку в таблицу результатов