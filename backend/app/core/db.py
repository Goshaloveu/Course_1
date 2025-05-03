# app/core/db.py
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel # Убедись, что все модели импортированы где-то до вызова create_all

from .config import settings
# Важно: импортируй здесь все твои модели, чтобы SQLModel знал о них при создании таблиц
# Либо убедись, что они импортируются в другом месте до вызова create_db
from app.models.user import User, UserPublic
from app.models.competition import Competition, CompetitionPublic
from app.models.registration import Registration
from app.models.result import Result, ResultReadWithUser

# --- ВАЖНО: Вызов model_rebuild ПОСЛЕ импорта всех моделей ---
print("Rebuilding models for forward references...")
User.model_rebuild()
Competition.model_rebuild()
Registration.model_rebuild()
Result.model_rebuild()
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