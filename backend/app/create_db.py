# app/create_db.py
import asyncio
import logging
import sys
import os

# Configure logging before importing anything else
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the parent directory to sys.path so we can import the app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine

# Import all models to ensure they're registered with SQLModel metadata
from models.user import User, UserBase, UserCreate, UserRead, UserPublic, UserUpdate
from models.token import Token, TokenPayload
from models.message import Message
from models.competition import (
    Competition, CompetitionBase, CompetitionCreate, CompetitionUpdate,
    CompetitionReadWithOwner, CompetitionPublic, 
    CompetitionStatusEnum, CompetitionReadWithTeams
)
from models.registration import Registration, RegistrationCreate, RegistrationRead, RegistrationUpdate
from models.result import Result, ResultCreate, ResultRead, ResultUpdate, ResultReadWithUser
from models.team import Team, TeamBase, TeamMember, TeamRole, TeamStatus, TeamVisibility
from models.team_registration import TeamRegistration, TeamRegistrationStatus

# Get database URL from config
from core.config import settings

# Create async engine
async_engine = create_async_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False}  # Only for SQLite
)

async def create_db_and_tables():
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def init_db():
    logger.info("Creating database and tables...")
    try:
        await create_db_and_tables()
        logger.info("Database and tables created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    logger.info("Initializing DB creation...")
    # Use asyncio.run() to run the async function
    asyncio.run(init_db())
    logger.info("DB creation process finished.")