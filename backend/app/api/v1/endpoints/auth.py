# app/api/v1/endpoints/auth.py
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import SQLModel
import httpx # Для запросов к Telegram API

from app.api import deps
from app.core.config import settings
from app.core import security
from app.models.token import Token
from app.models.user import User # Для type hint
from app.crud import crud_user

router = APIRouter()

# ПРИМЕР: Структура данных, ожидаемая от Telegram OAuth Widget
# Уточни реальную структуру по документации Telegram!
class TelegramLoginData(SQLModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str

async def verify_telegram_hash(data: dict) -> bool:
    """
    Проверяет хеш данных от Telegram Widget.
    ВНИМАНИЕ: Это критически важная функция для безопасности!
    Реализация зависит от способа получения данных (Widget, OAuth Flow).
    Нужно реализовать проверку подписи с использованием твоего BOT_TOKEN.
    См. документацию Telegram: https://core.telegram.org/widgets/login#checking-authorization
    """
    # --- ПРИМЕРНАЯ ЛОГИКА ПРОВЕРКИ (НЕ РАБОЧАЯ БЕЗ РЕАЛИЗАЦИИ) ---
    # data_check_string = ... # Собрать строку по правилам Telegram
    # secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
    # hmac_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    # return hmac.compare_digest(data['hash'], hmac_hash)
    # --- ЗАГЛУШКА ДЛЯ MVP (НЕ БЕЗОПАСНО!) ---
    print(f"WARNING: Telegram hash verification is skipped in MVP! Data: {data}")
    return True # ВРЕМЕННО! Замени на реальную проверку!

@router.post("/auth/telegram/callback", response_model=Token)
async def login_telegram_callback(
    *,
    session: AsyncSession = Depends(deps.get_async_session),
    # Мы ожидаем данные от Telegram OAuth Widget в теле POST запроса
    # (Если используется другой флоу, нужно изменить получение данных, например, code из query)
    tg_data_dict: dict = Body(...) # Принимаем как словарь для проверки хеша
    # tg_data: TelegramLoginData = Body(...) # Можно использовать модель после проверки хеша
):
    """
    Обработка callback от Telegram OAuth (предполагаем Widget Login).
    Проверяет хеш, находит или создает пользователя, возвращает JWT токен.
    """
    # 1. Проверка хеша (КРИТИЧЕСКИ ВАЖНО!)
    is_valid_hash = await verify_telegram_hash(tg_data_dict)
    if not is_valid_hash:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Telegram data hash",
        )

    # 2. Валидация данных (после проверки хеша)
    try:
        tg_data = TelegramLoginData(**tg_data_dict)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid Telegram data structure: {e}",
        )

    # 3. Поиск или создание пользователя в БД
    user_data_for_db = {
        "telegram_id": tg_data.id,
        "username": tg_data.username,
        "first_name": tg_data.first_name,
        "last_name": tg_data.last_name,
        "avatar_url": tg_data.photo_url
    }
    # Удаляем None значения, если они есть, чтобы не перезаписать существующие
    user_data_for_db = {k: v for k, v in user_data_for_db.items() if v is not None}

    user = await crud_user.create_or_update_user_from_oauth(session, user_data=user_data_for_db)
    if not user:
        # Это не должно произойти с create_or_update, но на всякий случай
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create or update user",
        )

    # 4. Создание JWT токена
    # В 'sub' (subject) токена записываем telegram_id, т.к. он уникален и используется для поиска юзера
    access_token = security.create_access_token(subject=user.telegram_id)

    return Token(access_token=access_token, token_type="bearer")

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