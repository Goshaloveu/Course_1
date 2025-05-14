# app/core/db.py
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel # Убедись, что все модели импортированы где-то до вызова create_all

from .config import settings
# Важно: импортируй здесь все твои модели, чтобы SQLModel знал о них при создании таблиц
# Либо убедись, что они импортируются в другом месте до вызова create_db
import sys
import os
# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.user import User, UserPublic
from models.competition import Competition, CompetitionBase, CompetitionStatusEnum, CompetitionReadWithOwner, CompetitionPublic
from models.registration import Registration
from models.result import Result, ResultReadWithUser
from models.team import Team, TeamMember, TeamBase, TeamRole, TeamStatus, TeamVisibility
from models.team_registration import TeamRegistration, TeamRegistrationStatus

# --- ВАЖНО: Вызов model_rebuild ПОСЛЕ импорта всех моделей ---
print("Rebuilding models for forward references...")
User.model_rebuild()
Competition.model_rebuild()
Registration.model_rebuild()
Result.model_rebuild()
Team.model_rebuild()
TeamMember.model_rebuild()
TeamRegistration.model_rebuild()
print("Models rebuilt.")

# Создаем асинхронный движок
# connect_args нужен для SQLite для корректной работы с FastAPI/asyncio
async_engine = create_async_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    echo=False, # Поставь True для отладки SQL-запросов
    future=True,
    connect_args={"check_same_thread": False} # Только для SQLite!
)

# Создаем фабрику асинхронных сессий
AsyncSessionFactory = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False, # Важно для асинхронных задач FastAPI
    autocommit=False,
    autoflush=False,
)

# Dependency для получения сессии в эндпоинтах FastAPI
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionFactory() as session:
        yield session

# Функция для создания таблиц (вызывать отдельно)
async def create_db_and_tables():
    async with async_engine.begin() as conn:
        # В SQLModel 0.0.14+ create_all асинхронный по умолчанию не работает с asyncpg/aiosqlite
        # Используем синхронный create_all через run_sync
        # await conn.run_sync(SQLModel.metadata.drop_all) # Раскомментируй для удаления таблиц при перезапуске (для тестов)
        await conn.run_sync(SQLModel.metadata.create_all)