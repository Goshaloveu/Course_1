# app/api/v1/endpoints/auth.py
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import SQLModel
import httpx # Для запросов к Telegram API
import hmac
import hashlib
import time
from datetime import datetime

from app.api import deps
from app.core.config import settings
from app.core import security
from app.models.token import Token
from app.models.user import User # Для type hint
from app.crud import crud_user

router = APIRouter()

# Структура данных от Telegram Login Widget
class TelegramLoginData(SQLModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str

# Модель для авторизации через Telegram бота
class TelegramBotAuthRequest(SQLModel):
    auth_token: str

async def verify_telegram_hash(data: Dict[str, Any]) -> bool:
    """
    Проверяет хеш данных от Telegram Widget.
    Реализация согласно документации Telegram:
    https://core.telegram.org/widgets/login#checking-authorization
    """
    if 'hash' not in data:
        return False
    
    # Получаем хеш из данных и удаляем его для формирования строки проверки
    received_hash = data.pop('hash')
    
    # Сортируем данные по ключу
    data_check_array = []
    for key in sorted(data.keys()):
        # Пропускаем поля, которые не участвуют в формировании хеша
        if key != 'hash':
            value = data[key]
            data_check_array.append(f"{key}={value}")
    
    # Формируем строку для проверки
    data_check_string = '\n'.join(data_check_array)
    
    # Создаем секретный ключ из токена бота
    secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
    
    # Вычисляем ожидаемый хеш
    hmac_hash = hmac.new(
        secret_key,
        data_check_string.encode(), 
        hashlib.sha256
    ).hexdigest()
    
    # Возвращаем хеш в данные для последующего использования
    data['hash'] = received_hash
    
    # Проверяем, совпадают ли хеши (безопасное сравнение)
    return hmac.compare_digest(received_hash, hmac_hash)

@router.post("/auth/telegram/callback", response_model=Token)
async def login_telegram_callback(
    *,
    session: AsyncSession = Depends(deps.get_async_session),
    tg_data_dict: dict = Body(...)
):
    """
    Обработка данных от Telegram Login Widget.
    Проверяет хеш, находит или создает пользователя, возвращает JWT токен.
    """
    # Режим отладки: если мы в dev-окружении и в данных есть признак мок-данных
    is_dev_mode = settings.ENVIRONMENT == "local" and tg_data_dict.get("hash") == "mockhash123"
    
    # 1. Проверка хеша (критически важно для безопасности)
    is_valid_hash = is_dev_mode or await verify_telegram_hash(tg_data_dict)
    if not is_valid_hash:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Telegram data hash",
        )

    # 2. Проверяем срок действия auth_date (не более 24 часов)
    if not is_dev_mode:  # Пропускаем проверку для дев-режима
        auth_date = tg_data_dict.get('auth_date', 0)
        current_time = int(time.time())
        if current_time - auth_date > 86400:  # 24 часа
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Authentication data expired",
            )

    # 3. Валидация данных
    try:
        tg_data = TelegramLoginData(**tg_data_dict)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid Telegram data structure: {e}",
        )

    # 4. Поиск или создание пользователя в БД
    user_data_for_db = {
        "telegram_id": tg_data.id,
        "username": tg_data.username,
        "first_name": tg_data.first_name,
        "last_name": tg_data.last_name,
        "avatar_url": tg_data.photo_url,
        "last_login": datetime.utcnow()
    }
    # Удаляем None значения
    user_data_for_db = {k: v for k, v in user_data_for_db.items() if v is not None}

    user = await crud_user.create_or_update_user_from_oauth(session, user_data=user_data_for_db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create or update user",
        )

    # 5. Создание JWT токена
    access_token = security.create_access_token(subject=str(user.telegram_id))

    return Token(access_token=access_token, token_type="bearer")

# Для обеспечения обратной совместимости оставляем эндпоинт для бота
@router.post("/auth/telegram-bot", response_model=Token)
async def login_via_telegram_bot(
    *,
    session: AsyncSession = Depends(deps.get_async_session),
    auth_req: TelegramBotAuthRequest = Body(...)
):
    """
    Авторизация через Telegram бота (используется только для обратной совместимости).
    В основном используется виджет Telegram Login.
    """
    # 1. Верифицируем токен с помощью API Telegram бота
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.TELEGRAM_BOT_API_URL}/verify-auth",
                headers={"X-BOT-API-KEY": settings.TELEGRAM_BOT_API_KEY},
                json={"auth_token": auth_req.auth_token}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token",
                )
            
            # Получаем данные пользователя от бота
            tg_auth_data = response.json()
            
            if not tg_auth_data.get("is_valid"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication data",
                )
            
            # 2. Извлекаем данные пользователя
            user_data_for_db = {
                "telegram_id": tg_auth_data.get("telegram_id"),
                "username": tg_auth_data.get("username"),
                "first_name": tg_auth_data.get("first_name"),
                "last_login": datetime.utcnow()
            }
            
            # Удаляем None значения
            user_data_for_db = {k: v for k, v in user_data_for_db.items() if v is not None}
            
            # 3. Находим или создаем пользователя
            user = await crud_user.create_or_update_user_from_oauth(session, user_data=user_data_for_db)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Could not create or update user",
                )
            
            # 4. Создаем JWT токен
            access_token = security.create_access_token(subject=str(user.telegram_id))
            
            return Token(access_token=access_token, token_type="bearer")
        
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Telegram bot service unavailable",
            )

# --- Альтернативный вариант OAuth через редирект (Более сложный) ---
# @router.get("/auth/telegram")
# async def redirect_to_telegram():
#     """Редирект на страницу авторизации Telegram."""
#     # Сформировать URL для редиректа на Telegram OAuth
#     # ...
#     # return RedirectResponse(telegram_oauth_url)
#     pass
#
# @router.get("/auth/telegram/callback")
# async def handle_telegram_callback(code: str = Query(...), session: AsyncSession = Depends(deps.get_async_session)):
#     """Обработка callback после редиректа с Telegram."""
#     # 1. Обменять 'code' на access_token Telegram
#     #    - Сделать POST запрос к API Telegram
#     # 2. Получить данные пользователя с помощью access_token Telegram
#     #    - Сделать GET запрос к API Telegram
#     # 3. Найти или создать пользователя в БД (как в widget flow)
#     # 4. Создать JWT токен нашего приложения
#     # 5. Вернуть токен (или редиректнуть на фронтенд с токеном)
#     pass
# --- Эндпоинт для получения токена (если бы был вход по паролю) ---
# @router.post("/auth/token", response_model=Token)
# async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(deps.get_async_session)):
#     # Здесь была бы проверка логина/пароля пользователя
#     pass