# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api.v1.api import api_router # Импортируем собранный роутер

# Опционально: добавить обработку событий startup/shutdown
# from app.core.db import create_db_and_tables # Если нужно создавать таблицы при старте
# import asyncio

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    # docs_url=None, # Можно отключить Swagger UI
    # redoc_url=None, # Можно отключить ReDoc
)

# Настройка CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).rstrip("/") for origin in settings.all_cors_origins], # Используем all_cors_origins из config
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Подключаем роутер с префиксом /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)

# @app.on_event("startup")
# async def on_startup():
#     # Не рекомендуется создавать таблицы при каждом запуске в проде,
#     # лучше использовать миграции или отдельный скрипт.
#     # Но для разработки/MVP может быть удобно:
#     # print("Creating database tables on startup...")
#     # await create_db_and_tables()
#     # print("Database tables created.")
#     pass

@app.get("/")
async def root():
    """ Простой эндпоинт для проверки работы """
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}