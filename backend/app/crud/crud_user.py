# app/crud/crud_user.py
from typing import Optional
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.user import User, UserCreate # UserUpdate пока не определен, но может понадобиться

async def get_user(db: AsyncSession, user_id: int) -> Optional[User]:
    statement = select(User).where(User.id == user_id)
    result = await db.exec(statement)
    return result.first()

async def get_user_by_telegram_id(db: AsyncSession, telegram_id: int) -> Optional[User]:
    statement = select(User).where(User.telegram_id == telegram_id)
    result = await db.exec(statement)
    return result.first()

# В нашем случае UserCreate может не использоваться, т.к. данные приходят от TG
# Эта функция может быть для создания или обновления юзера после OAuth
async def create_or_update_user_from_oauth(db: AsyncSession, *, user_data: dict) -> User:
    # Ожидаем user_data с полями: telegram_id, username, first_name, last_name, avatar_url
    existing_user = await get_user_by_telegram_id(db, user_data["telegram_id"])

    if existing_user:
        # Обновляем данные, если они изменились
        update_data = user_data.copy()
        updated = False
        for key, value in update_data.items():
            if hasattr(existing_user, key) and getattr(existing_user, key) != value:
                setattr(existing_user, key, value)
                updated = True
        if updated:
            db.add(existing_user)
            await db.commit()
            await db.refresh(existing_user)
        return existing_user
    else:
        # Создаем нового пользователя
        # Можно использовать UserCreate или напрямую User
        new_user = User(**user_data) # Предполагаем, что user_data содержит все нужные поля UserBase
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

async def set_organizer_role(db: AsyncSession, user_id: int, is_organizer: bool) -> Optional[User]:
    """ Устанавливает или снимает роль организатора """
    user = await get_user(db, user_id)
    if user:
        user.is_organizer = is_organizer
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user

# Добавь CRUDUser если используешь base.py
# from .base import CRUDBase
# from app.models.user import User, UserCreate, UserUpdate
# class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
#     # Дополнительные методы специфичные для User
#     async def get_by_telegram_id(self, db: AsyncSession, *, telegram_id: int) -> Optional[User]:
#         # ... реализация ...
# user = CRUDUser(User)