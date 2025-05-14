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
        # Путь к .env файлу в корне проекта
        env_file="C:/Users/gosha/Course_1/.env",
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
        
        # Добавляем поддержку ngrok для тестирования
        ngrok_domains = ["https://4533-37-120-217-114.ngrok-free.app"]
        for domain in ngrok_domains:
            if domain not in computed_origins:
                computed_origins.append(domain)
                
        return computed_origins

    PROJECT_NAME: str = "YL Competitions MVP"

    # --- Настройки SQLite ---
    # Файл будет создан в директории backend/sqlitedb/
    # SQLITE_DB_FILE: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'sqlitedb', 'database.db')
    # Поднимаемся на ТРИ уровня от backend/app/core/ чтобы попасть в корень Course_1
    SQLITE_DB_FILE: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "users.db")

    @computed_field # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Используем async-драйвер aiosqlite
        return f"sqlite+aiosqlite:///{self.SQLITE_DB_FILE}"

    # --- Настройки Telegram ---
    # Токен бота, полученный от BotFather (необходим для верификации данных от Telegram Login)
    TELEGRAM_BOT_TOKEN: str = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    
    # Имя бота для отображения в виджете
    TELEGRAM_BOT_NAME: str = os.environ.get("TELEGRAM_BOT_NAME", "")
    
    # API ключ для обеспечения безопасности между сервисами
    TELEGRAM_BOT_API_KEY: str = os.environ.get("TELEGRAM_BOT_API_KEY", "")
    
    # --- Настройки API Telegram бота (для обратной совместимости) ---
    TELEGRAM_BOT_API_URL: str = os.environ.get("TELEGRAM_BOT_API_URL", "http://localhost:3001")

    # --- Sentry (опционально, для мониторинга ошибок) ---
    SENTRY_DSN: HttpUrl | None = None


settings = Settings()

# Создаем директорию для файла БД, если ее нет
# os.makedirs(os.path.dirname(settings.SQLITE_DB_FILE), exist_ok=True)