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

# --- НАСТРОЙКА CORS ---
# Список источников (origins), которым разрешено делать запросы к API
origins = [
    "http://localhost:5173",  # Адрес вашего Frontend в режиме разработки
    "http://localhost:5174",  # Добавим и этот, т.к. порт менялся
    "http://127.0.0.1:5173", # На всякий случай
    "http://127.0.0.1:5174", # На всякий случай
    # При развертывании приложения добавьте сюда URL вашего рабочего фронтенда
    # "https://your-production-frontend.com",
]
    
# Настройка CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).rstrip("/") for origin in settings.all_cors_origins] + origins, # Используем all_cors_origins из config
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Если настройки CORS не указаны в settings, используем список origins по умолчанию
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
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

def rebuild_models():
    """
    Rebuilds models with circular references to fix Pydantic validation issues
    """
    from app.models.user import UserPublic
    from app.models.competition import CompetitionReadWithOwner
    from app.models.result import ResultReadWithUser
    
    # Force model rebuilding to fix circular references
    CompetitionReadWithOwner.model_rebuild()
    ResultReadWithUser.model_rebuild()

print("Rebuilding models for forward references...")
rebuild_models()
print("Models rebuilt.")