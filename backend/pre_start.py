# pre_start.py
import logging
import asyncio

# Используем асинхронные версии
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession
from sqlmodel import select
from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

# Импортируем асинхронный движок
from .app.core.db import async_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

max_tries = 60 * 1  # 1 минута для старта БД
wait_seconds = 1

# Делаем функцию init асинхронной
@retry(
    stop=stop_after_attempt(max_tries),
    wait=wait_fixed(wait_seconds),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
async def init(db_engine: AsyncEngine) -> None:
    try:
        # Используем асинхронный контекстный менеджер
        async with AsyncSession(db_engine) as session:
            # Выполняем простой запрос
            await session.execute(select(1))
        logger.info("Database connection successful.")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise e

async def main() -> None:
    logger.info("Initializing service database check...")
    await init(async_engine)
    logger.info("Service database check finished successfully.")

if __name__ == "__main__":
    # Запускаем асинхронную функцию main
    asyncio.run(main())