# app/crud/crud_registration.py
from typing import Optional, List, Sequence
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload # Для жадной загрузки
from sqlalchemy.exc import IntegrityError # Для отлова дублей

from app.models.user import User
from app.models.competition import Competition
from app.models.registration import Registration, RegistrationCreate
from app.models.result import Result

async def create_registration(db: AsyncSession, *, obj_in: RegistrationCreate) -> Optional[Registration]:
    """ Создает регистрацию. Возвращает None если уже существует. """
    # Проверка на дубликат перед вставкой (хотя UNIQUE constraint тоже сработает)
    existing = await get_registration_by_user_and_competition(db, user_id=obj_in.user_id, competition_id=obj_in.competition_id)
    if existing:
        return None # Или можно бросать исключение

    db_obj = Registration.model_validate(obj_in)
    db.add(db_obj)
    try:
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    except IntegrityError: # Ловим ошибку UNIQUE constraint
        await db.rollback()
        return None # Или бросаем специфическую ошибку

async def get_registration_by_user_and_competition(
    db: AsyncSession, *, user_id: int, competition_id: int
) -> Optional[Registration]:
    statement = select(Registration).where(
        Registration.user_id == user_id,
        Registration.competition_id == competition_id
    )
    result = await db.execute(statement)
    return result.scalar_one_or_none()

async def get_registrations_by_competition(
    db: AsyncSession, *, competition_id: int, skip: int = 0, limit: int = 100
) -> Sequence[Registration]:
    """ Получает регистрации для соревнования, включая данные пользователя """
    statement = (
        select(Registration)
        .where(Registration.competition_id == competition_id)
        .options(selectinload(Registration.user)) # Загружаем юзера сразу
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(statement)
    return result.scalars().all()

async def get_registrations_by_user(
    db: AsyncSession, *, user_id: int, skip: int = 0, limit: int = 100
) -> Sequence[Registration]:
    """ Получает соревнования, на которые зарегистрирован пользователь """
    statement = (
        select(Registration)
        .where(Registration.user_id == user_id)
        .options(selectinload(Registration.competition)) # Загружаем соревнование сразу
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(statement)
    return result.all()

async def delete_registration(db: AsyncSession, *, user_id: int, competition_id: int) -> bool:
    """ Удаляет регистрацию """
    reg = await get_registration_by_user_and_competition(db, user_id=user_id, competition_id=competition_id)
    if reg:
        await db.delete(reg)
        await db.commit()
        return True
    return False