# app/core/config.py
import secrets
from typing import Annotated, Any, Literal, Optional

from pydantic import AnyUrl, BeforeValidator, computed_field, HttpUrl, EmailStr
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Определяем путь к .env относительно этого файла config.py
        # Если config.py в backend/app/core/, то ../../.env указывает на файл в корне проекта
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'),
        env_ignore_empty=True,
        extra="ignore",
    )
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 минут * 24 часа = 1 день (для MVP можно и поменьше, но пусть будет)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Адрес фронтенда для CORS
    FRONTEND_HOST: str = "http://localhost:5173" # Убедись, что порт верный для твоего React/Vite

    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    # CORS Origins - разрешаем фронтенд по умолчанию
    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    @computed_field # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        # Убедимся, что FRONTEND_HOST всегда в списке разрешенных
        computed_origins = [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS]
        if self.FRONTEND_HOST not in computed_origins:
             computed_origins.append(self.FRONTEND_HOST)
        return computed_origins

    PROJECT_NAME: str = "YL Competitions MVP"

    # --- Настройки SQLite ---
    # Файл будет создан в директории backend/sqlitedb/
    # SQLITE_DB_FILE: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'sqlitedb', 'database.db')
    SQLITE_DB_FILE: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "users.db")

    @computed_field # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Используем async-драйвер aiosqlite
        return f"sqlite+aiosqlite:///{self.SQLITE_DB_FILE}"

    # --- Настройки Telegram ---
    TELEGRAM_BOT_TOKEN: str = "YOUR_TELEGRAM_BOT_TOKEN" # !!! ЗАМЕНИ НА СВОЙ ТОКЕН !!!
    TELEGRAM_BOT_API_KEY: str = secrets.token_urlsafe(32) # Ключ для защиты эндпоинта бота

    # --- Настройки Telegram OAuth (примерные, уточни по документации Telegram) ---
    # Эти значения ты получишь при регистрации приложения в Telegram
    TELEGRAM_CLIENT_ID: str = "YOUR_TELEGRAM_CLIENT_ID" # !!! ЗАМЕНИ !!!
    TELEGRAM_CLIENT_SECRET: str = "YOUR_TELEGRAM_CLIENT_SECRET" # !!! ЗАМЕНИ !!!
    TELEGRAM_REDIRECT_URI: str = f"{API_V1_STR}/auth/telegram/callback" # Относительный путь

    # --- Sentry (опционально, для MVP можно закомментировать) ---
    SENTRY_DSN: HttpUrl | None = None

    # --- Удаленные настройки (не нужны для SQLite/Telegram MVP) ---
    # POSTGRES_SERVER: str
    # POSTGRES_PORT: int = 5432
    # POSTGRES_USER: str
    # POSTGRES_PASSWORD: str = ""
    # POSTGRES_DB: str = ""
    # SMTP_TLS: bool = True
    # SMTP_SSL: bool = False
    # SMTP_PORT: int = 587
    # SMTP_HOST: str | None = None
    # SMTP_USER: str | None = None
    # SMTP_PASSWORD: str | None = None
    # EMAILS_FROM_EMAIL: EmailStr | None = None
    # EMAILS_FROM_NAME: str | None = None
    # EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48
    # EMAIL_TEST_USER: EmailStr = "test@example.com"
    # FIRST_SUPERUSER: EmailStr
    # FIRST_SUPERUSER_PASSWORD: str


settings = Settings()

# Создаем директорию для файла БД, если ее нет
# os.makedirs(os.path.dirname(settings.SQLITE_DB_FILE), exist_ok=True)