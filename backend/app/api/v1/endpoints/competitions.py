# app/api/v1/endpoints/competitions.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime

from app.api import deps
from app.crud import crud_competition, crud_result, crud_registration, crud_user
from app.models.registration import RegistrationCreate
from app.models.message import Message
from app.models.competition import Competition, CompetitionPublic, CompetitionStatusEnum, CompetitionReadWithOwner
from app.models.result import ResultReadWithUser, Result # Импорт моделей
from app.models.user import User, UserPublic # Импорт моделей

router = APIRouter()

@router.get("/competitions", response_model=List[CompetitionPublic])
async def read_competitions(
    session: AsyncSession = Depends(deps.get_async_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    # Для MVP пока без фильтров, но можно добавить:
    # status: Optional[CompetitionStatusEnum] = Query(None),
    # include_past: bool = Query(False)
):
    """
    Получение списка актуальных соревнований (сортировка по дате начала).
    MVP: Простой список без фильтров, ближайшие сверху.
    """
    # TODO: Добавить логику для "актуальных" (предстоящие, идущие, недавно завершенные)
    # Пока просто получаем все по дате начала
    competitions = await crud_competition.get_competitions(
        session, skip=skip, limit=limit #, status=status, include_past=include_past
    )
    # Pydantic автоматически преобразует List[Competition] в List[CompetitionPublic]
    return competitions

@router.get("/competitions/{competition_id}", response_model=CompetitionReadWithOwner)
async def read_competition_details(
    competition_id: int,
    session: AsyncSession = Depends(deps.get_async_session),
):
    """
    Получение полной информации о конкретном соревновании, включая данные организатора.
    """
    competition = await crud_competition.get_competition(session, competition_id=competition_id)
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    # Преобразуем данные организатора в UserPublic перед возвратом
    # Если organizer был загружен через selectinload, он уже тут
    organizer_public = None
    if competition.organizer:
         organizer_public = UserPublic.model_validate(competition.organizer) # Преобразование

    # Собираем финальный ответ
    response_data = CompetitionReadWithOwner.model_validate(competition)
    response_data.organizer = organizer_public

    return response_data

@router.get("/competitions/{competition_id}/results", response_model=List[ResultReadWithUser])
async def read_competition_results(
    competition_id: int,
    session: AsyncSession = Depends(deps.get_async_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500), # Можно увеличить лимит для результатов
):
    """
    Получение опубликованных результатов для соревнования.
    Возвращает пустой список, если результаты не опубликованы или соревнование не найдено.
    """
    # 1. Проверяем статус соревнования
    competition = await crud_competition.get_competition(session, competition_id=competition_id)
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    if competition.status != CompetitionStatusEnum.RESULTS_PUBLISHED:
         # Согласно MVP, раздел появляется после публикации. Отдаем пустой список.
         # Или можно 403 Forbidden, если нужно явно указать причину.
         # raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Results are not published yet")
         return []

    # 2. Получаем результаты с данными пользователей
    results_db = await crud_result.get_results_by_competition(
        session, competition_id=competition_id, skip=skip, limit=limit
    )

    # 3. Преобразуем в нужный формат ответа (ResultReadWithUser)
    results_with_user = []
    for res in results_db:
        user_public = None
        if res.user: # User должен быть загружен через selectinload в CRUD
            user_public = UserPublic.model_validate(res.user)

        result_read = ResultReadWithUser.model_validate(res)
        result_read.user = user_public
        results_with_user.append(result_read)

    return results_with_user

@router.post("/competitions/{competition_id}/register", status_code=status.HTTP_201_CREATED, response_model=Message)
async def register_for_competition(
    competition_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    session: AsyncSession = Depends(deps.get_async_session),
):
    """
    Регистрация текущего пользователя на соревнование.
    """
    # 1. Найти соревнование
    competition = await crud_competition.get_competition(session, competition_id=competition_id)
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    # 2. Проверить статус и даты регистрации
    now = datetime.utcnow()
    
    # Competition status should be updated by get_competition, but double-check registration period
    if competition.status != CompetitionStatusEnum.REGISTRATION_OPEN:
        if now < competition.reg_start_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Registration has not started yet"
            )
        elif now > competition.reg_end_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Registration period has ended"
            )
        else:
            # If dates are ok but status is wrong, update it and proceed
            competition.status = CompetitionStatusEnum.REGISTRATION_OPEN
            session.add(competition)
            await session.commit()
            await session.refresh(competition)

    # 3. Попытка создать регистрацию
    registration_in = RegistrationCreate(user_id=current_user.id, competition_id=competition_id)
    created_registration = await crud_registration.create_registration(session, obj_in=registration_in)

    if created_registration is None:
        # crud_registration возвращает None, если регистрация уже существует
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already registered for this competition",
        )

    return Message(message="Successfully registered for the competition")