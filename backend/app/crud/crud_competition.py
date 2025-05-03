# app/crud/crud_competition.py
from typing import Optional, List, Sequence
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload # Для жадной загрузки связей
# Добавим datetime для фильтрации по дате, если нужно будет раскомментировать
# from datetime import datetime 

from app.models.user import User
from app.models.competition import Competition, CompetitionCreate, CompetitionUpdate, CompetitionStatusEnum

async def get_competition(db: AsyncSession, competition_id: int) -> Optional[Competition]:
    # Загружаем организатора сразу, чтобы избежать доп. запросов (N+1 problem)
    statement = select(Competition).where(Competition.id == competition_id).options(selectinload(Competition.organizer))
    # Используем execute и scalars().first() для AsyncSession
    result = await db.execute(statement)
    return result.scalars().first()

async def get_competitions(
    db: AsyncSession, *, skip: int = 0, limit: int = 100,
    status: Optional[CompetitionStatusEnum] = None, # Пример фильтра
    include_past: bool = False # Пример флага для фильтрации по дате
    # TODO: Добавить сортировку по дате
) -> Sequence[Competition]:
    statement = select(Competition).offset(skip).limit(limit).order_by(Competition.comp_start_at) # Сортировка по дате начала
    if status:
        statement = statement.where(Competition.status == status)
    # if not include_past: # Логика для фильтрации по дате (сравнение с datetime.utcnow())
    #    statement = statement.where(Competition.comp_end_at >= datetime.utcnow())
    # Используем execute и scalars().all() для AsyncSession
    result = await db.execute(statement)
    return result.scalars().all()

async def get_competitions_by_organizer(
    db: AsyncSession, *, organizer_id: int, skip: int = 0, limit: int = 100
) -> Sequence[Competition]:
    statement = select(Competition).where(Competition.organizer_id == organizer_id).offset(skip).limit(limit).order_by(Competition.created_at.desc())
    # Используем execute и scalars().all() для AsyncSession
    result = await db.execute(statement)
    return result.scalars().all()

async def create_competition(db: AsyncSession, *, competition_in: CompetitionCreate, organizer_id: int) -> Competition:
    # Преобразуем Pydantic модель в словарь, убирая None значения, если нужно
    # competition_data = competition_in.model_dump(exclude_unset=True) # Или используй jsonable_encoder
    db_obj = Competition.model_validate(competition_in) # Используем model_validate для SQLModel >= 0.0.14
    db_obj.organizer_id = organizer_id
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_competition(
    db: AsyncSession, *, db_obj: Competition, obj_in: CompetitionUpdate
) -> Competition:
    # Получаем словарь из Pydantic модели, исключая не установленные поля
    update_data = obj_in.model_dump(exclude_unset=True)
    # Обновляем поля объекта БД
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_competition_status(db: AsyncSession, competition_id: int, status: CompetitionStatusEnum) -> Optional[Competition]:
    """ Обновляет только статус соревнования """
    # get_competition уже использует правильный execute
    db_competition = await get_competition(db, competition_id)
    if db_competition:
        db_competition.status = status
        db.add(db_competition)
        await db.commit()
        await db.refresh(db_competition)
    return db_competition