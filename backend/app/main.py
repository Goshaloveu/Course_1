# app/main.py
from fastapi import FastAPI, Request, Response
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
# Конфигурация CORS для работы с конкретными доменами
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://4533-37-120-217-114.ngrok-free.app"  # Только фронтенд ngrok URL для теста
    ] + settings.all_cors_origins,
    allow_credentials=True,  # Необходимо для передачи заголовков авторизации
    allow_methods=["*"],
    allow_headers=["*"]
)

# ЭТО ДИАГНОСТИЧЕСКИЙ MIDDLEWARE - УДАЛИТЬ ПОСЛЕ ТЕСТИРОВАНИЯ
@app.middleware("http")
async def log_and_modify_headers_debug(request: Request, call_next):
    response: Response = await call_next(request)
    print(f"DEBUG: Headers before sending to client for path {request.url.path}: {response.headers}")
    # Часть с принудительным изменением заголовка закомментирована, FastAPI уже устанавливает правильный
    # if response.headers.get("access-control-allow-origin") == "*" and \
    #    response.headers.get("access-control-allow-credentials") == "true":
    #     print("DEBUG: Detected '*' in access-control-allow-origin with credentials, attempting to override.")
    #     correct_origin = "https://4533-37-120-217-114.ngrok-free.app"
    #     response.headers["access-control-allow-origin"] = correct_origin
    #     current_vary = response.headers.get("vary")
    #     if current_vary:
    #         if "Origin" not in current_vary.replace(" ", "").split(","):
    #             response.headers["vary"] = f"{current_vary}, Origin"
    #     else:
    #         response.headers["vary"] = "Origin"
    return response

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
    from app.models.competition import CompetitionReadWithOwner, CompetitionReadWithTeams
    from app.models.result import ResultReadWithUser
    # Import new schemas with potential forward references
    from app.schemas.team import TeamReadWithMembers, TeamMemberRead
    from app.schemas.team_registration import TeamRegistrationReadDetailed, TeamRegistrationRead

    # Force model rebuilding to fix circular references
    CompetitionReadWithOwner.model_rebuild()
    ResultReadWithUser.model_rebuild()
    # Rebuild new models/schemas
    TeamReadWithMembers.model_rebuild()
    TeamMemberRead.model_rebuild()
    CompetitionReadWithTeams.model_rebuild() # Added in competition model file
    TeamRegistrationReadDetailed.model_rebuild()
    TeamRegistrationRead.model_rebuild() # If it includes nested models


print("Rebuilding models for forward references...")
rebuild_models()
print("Models rebuilt.")