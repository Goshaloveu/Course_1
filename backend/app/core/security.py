# app/core/security.py
# Твой код здесь подходит. Убедись, что SECRET_KEY берется из config.
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt # из PyJWT или python-jose, убедись что зависимость верная
from passlib.context import CryptContext

from app.core.config import settings

# Используем bcrypt как рекомендуемый
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def create_access_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Используем время жизни из настроек, если не передано явно
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=ALGORITHM
    )
    return encoded_jwt

# Эти функции нужны, только если будет альтернативный вход по паролю
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ Проверяет пароль """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """ Хэширует пароль """
    return pwd_context.hash(password)

# Функция для декодирования токена (добавим, понадобится в deps.py)
def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        # Обработка истекшего токена
        return None
    except jwt.InvalidTokenError:
        # Обработка невалидного токена
        return None