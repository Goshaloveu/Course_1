# app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api import deps
from app.models.user import User, UserRead # Импортируем нужные модели

router = APIRouter()

@router.get("/users/me", response_model=UserRead)
async def read_users_me(
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Получение данных текущего авторизованного пользователя.
    """
    # current_user уже содержит все нужные поля из БД благодаря зависимости
    # Pydantic автоматически преобразует User в UserRead
    return current_user

# --- Примеры других возможных эндпоинтов (не требуются по MVP) ---
# @router.get("/users/{user_id}", response_model=UserRead)
# async def read_user_by_id(
#     user_id: int,
#     session: AsyncSession = Depends(deps.get_async_session),
#     current_user: User = Depends(deps.get_current_active_organizer) # Пример: только для админов
# ):
#     """Получение пользователя по ID (пример)."""
#     user = await crud_user.get_user(session, user_id=user_id)
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#     return user