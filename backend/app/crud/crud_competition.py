# app/crud/crud_competition.py
from typing import Optional, List, Sequence
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload # Для жадной загрузки связей
# Import datetime for status calculations
from datetime import datetime 

from app.models.user import User
from app.models.competition import Competition, CompetitionCreate, CompetitionUpdate, CompetitionStatusEnum

# Helper function to determine competition status based on dates
def calculate_competition_status(competition: Competition) -> CompetitionStatusEnum:
    now = datetime.utcnow()
    
    # If competition has ended and results are published, keep that status
    if competition.status == CompetitionStatusEnum.RESULTS_PUBLISHED:
        return CompetitionStatusEnum.RESULTS_PUBLISHED
        
    # Check each stage based on dates
    if competition.reg_start_at and now < competition.reg_start_at:
        return CompetitionStatusEnum.UPCOMING
    elif competition.reg_end_at and now > competition.reg_end_at:
        if competition.comp_end_at and now > competition.comp_end_at:
            return CompetitionStatusEnum.FINISHED
        elif competition.comp_start_at and now >= competition.comp_start_at:
            return CompetitionStatusEnum.ONGOING
        else:
            return CompetitionStatusEnum.REGISTRATION_CLOSED
    elif competition.reg_start_at and now >= competition.reg_start_at:
        if competition.comp_start_at and now >= competition.comp_start_at:
            return CompetitionStatusEnum.ONGOING
        else:
            return CompetitionStatusEnum.REGISTRATION_OPEN
            
    # Default fallback
    return competition.status

async def get_competition(db: AsyncSession, competition_id: int) -> Optional[Competition]:
    # Загружаем организатора сразу, чтобы избежать доп. запросов (N+1 problem)
    statement = select(Competition).where(Competition.id == competition_id).options(selectinload(Competition.organizer))
    # Используем execute и scalars().first() для AsyncSession
    result = await db.execute(statement)
    competition = result.scalar_one_or_none()
    
    # Update status based on current date
    if competition:
        calculated_status = calculate_competition_status(competition)
        if calculated_status != competition.status:
            competition.status = calculated_status
            db.add(competition)
            await db.commit()
            await db.refresh(competition)
            
    return competition

async def get_competitions(
    db: AsyncSession, *, skip: int = 0, limit: int = 100,
    status: Optional[CompetitionStatusEnum] = None, # Пример фильтра
    include_past: bool = False # Пример флага для фильтрации по дате
    # TODO: Добавить сортировку по дате
) -> Sequence[Competition]:
    statement = select(Competition).offset(skip).limit(limit).order_by(Competition.comp_start_at) # Сортировка по дате начала
    if status:
        statement = statement.where(Competition.status == status)
    
    # Fetch competitions
    result = await db.execute(statement)
    competitions = result.scalars().all()
    
    # Update status for each competition based on current date
    now = datetime.utcnow()
    updated = False
    
    for competition in competitions:
        calculated_status = calculate_competition_status(competition)
        if calculated_status != competition.status:
            competition.status = calculated_status
            db.add(competition)
            updated = True
    
    # Commit changes if any updates were made
    if updated:
        await db.commit()
        # Refresh all competitions after commit
        for competition in competitions:
            await db.refresh(competition)
    
    return competitions

async def get_competitions_by_organizer(
    db: AsyncSession, *, organizer_id: int, skip: int = 0, limit: int = 100
) -> Sequence[Competition]:
    statement = select(Competition).where(Competition.organizer_id == organizer_id).offset(skip).limit(limit).order_by(Competition.created_at.desc())
    # Используем execute и scalars().all() для AsyncSession
    result = await db.execute(statement)
    return result.scalars().all()

async def create_competition(db: AsyncSession, *, competition_in: CompetitionCreate, organizer_id: int) -> Competition:
    # Преобразуем данные из CompetitionCreate в словарь
    competition_data = competition_in.model_dump(exclude_unset=True)
    # Добавляем organizer_id к данным
    competition_data["organizer_id"] = organizer_id
    # Создаем объект Competition с правильными данными
    db_obj = Competition(**competition_data)
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