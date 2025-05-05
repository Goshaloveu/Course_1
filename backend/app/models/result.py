# app/models/result.py
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship, UniqueConstraint
from datetime import datetime

# Import UserPublic directly for runtime usage
from .user import UserPublic

if TYPE_CHECKING:
    from .user import User
    from .competition import Competition

class ResultBase(SQLModel):
    # user_id и competition_id будут частью составного ключа ниже
    result_value: Optional[str] = Field(default=None) # Используем TEXT для гибкости
    rank: Optional[int] = Field(default=None, index=True) # Место

class Result(ResultBase, table=True):
    # Составной первичный ключ или просто уникальное ограничение?
    # Для простоты можно id, а уникальность через constraint
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    competition_id: int = Field(foreign_key="competition.id", index=True, nullable=False)
    submitted_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Уникальность пары пользователь-соревнование
    __table_args__ = (UniqueConstraint("user_id", "competition_id", name="uq_user_competition_result"),)

    # Связи
    user: 'User' = Relationship(back_populates="results")
    competition: 'Competition' = Relationship(back_populates="results")

# Модель для создания/загрузки результата
class ResultCreate(ResultBase):
     # При создании передаем ID явно
     user_id: int
     competition_id: int

# Модель для чтения результата
class ResultRead(ResultBase):
    id: int
    user_id: int
    competition_id: int
    submitted_at: datetime

# Модель для отображения результата с данными пользователя (в таблице результатов)
class ResultReadWithUser(ResultRead):
    user: Optional[UserPublic] = None