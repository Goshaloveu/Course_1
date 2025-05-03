# app/create_db.py
import asyncio
import logging

# Настраиваем логирование до импорта db, чтобы видеть SQL команды, если echo=True
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Импортируем асинхронный движок и функцию создания таблиц
from app.core.db import async_engine, create_db_and_tables

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
    # Используем asyncio.run() для запуска асинхронной функции
    asyncio.run(init_db())
    logger.info("DB creation process finished.")