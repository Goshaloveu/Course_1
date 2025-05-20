import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Загружаем переменные из корневого .env файла
load_dotenv("/root/Course_1/.env")

class BotSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="/root/Course_1/.env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
    )
    
    # Bot token
    BOT_TOKEN: str = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    
    # Backend API configuration
    API_BASE_URL: str = os.environ.get("API_BASE_URL", "http://yl.com.ru/api/v1")
    API_BOT_KEY: str = os.environ.get("TELEGRAM_BOT_API_KEY", "")
    
    # Frontend URL
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://yl.com.ru")
    
    # Webhook settings (for production)
    WEBHOOK_HOST: str = os.environ.get("WEBHOOK_HOST", "")
    WEBHOOK_PATH: str = os.environ.get("WEBHOOK_PATH", "/webhook")
    WEBHOOK_URL: str = os.environ.get("WEBHOOK_URL", "")
    
    # Webhook server settings
    WEBAPP_HOST: str = os.environ.get("WEBAPP_HOST", "yl.com.ru")
    WEBAPP_PORT: int = int(os.environ.get("WEBAPP_PORT", 3001))
    
    # Redis settings (for FSM storage in production)
    # REDIS_HOST: str = os.environ.get("REDIS_HOST", "localhost")
    # REDIS_PORT: int = int(os.environ.get("REDIS_PORT", 6379))
    # REDIS_DB: int = int(os.environ.get("REDIS_DB", 0))
    
    # Security
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "")
    
    # @property
    # def REDIS_DSN(self) -> str:
    #     return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    @property
    def WEBHOOK_FULL_URL(self) -> str:
        if self.WEBHOOK_URL:
            return self.WEBHOOK_URL
        elif self.WEBHOOK_HOST:
            return f"{self.WEBHOOK_HOST}{self.WEBHOOK_PATH}"
        return ""
    
    @property
    def is_webhook_configured(self) -> bool:
        return bool(self.WEBHOOK_FULL_URL)


# Create settings instance
settings = BotSettings() 