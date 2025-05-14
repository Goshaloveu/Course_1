# app/api/v1/endpoints/competitions.py
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, Path, Body
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime

from app.api import deps
from app.crud import crud_competition, crud_result, crud_registration, crud_user
from app.models.registration import RegistrationCreate
from app.models.message import Message
from app.models.competition import Competition, CompetitionPublic, CompetitionStatusEnum, CompetitionReadWithOwner, CompetitionFormat
from app.models.result import ResultReadWithUser, Result # Импорт моделей
from app.models.user import User, UserPublic # Импорт моделей
from app.schemas.competition import CompetitionRead, CompetitionCreate, CompetitionUpdate, CompetitionReadDetailed
from app.schemas.result import ResultReadWithUser
from app.schemas.message import Message
from app.schemas.team_registration import TeamRegistrationRead, TeamRegistrationReadDetailed
from app.schemas.team import TeamRead
from app.models.team import TeamRole

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

# --- Team Registration Endpoints ---

@router.post("/{competition_id}/register-team", response_model=TeamRegistrationRead)
async def register_team_for_competition(
    competition_id: int = Path(...),
    team_id_in: TeamRead = Body(..., embed=True, alias="team"), # Expecting {"team": {"id": team_id}}
    session: AsyncSession = Depends(deps.get_async_session),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """ Register a team led by the current user for a competition. """
    competition = await crud_competition.get_competition(session, id=competition_id)
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    # Check if competition is team-based
    if competition.format != CompetitionFormat.TEAM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This competition is not for teams."
        )

    # Check registration dates/status (Add more robust checks)
    now = datetime.utcnow()
    if competition.reg_start_at and now < competition.reg_start_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration has not opened yet.")
    if competition.reg_end_at and now > competition.reg_end_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration is closed.")
    # Add check for competition status (e.g., must be REGISTRATION_OPEN)

    team = await crud_user.get_with_details(session, id=team_id_in.id) # Load members
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Team with id {team_id_in.id} not found")

    # Check if current user is the leader of the team
    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team leader can register the team for a competition."
        )

    # CRUD operation handles member count validation now
    try:
        registration = await crud_team_registration.create_registration(
            session, team=team, competition=competition
        )
        return registration
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{competition_id}/withdraw-team/{team_id}", response_model=TeamRegistrationRead)
async def withdraw_team_from_competition(
    competition_id: int = Path(...),
    team_id: int = Path(...),
    session: AsyncSession = Depends(deps.get_async_session),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """ Withdraw a team's registration (only team leader). """
    team = await crud_team.get(session, id=team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    # Check if current user is the leader
    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team leader can withdraw the registration."
        )

    registration = await crud_team_registration.get_registration(
        session, team_id=team_id, competition_id=competition_id
    )
    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team registration not found for this competition.")

    # Add checks: Cannot withdraw after roster lock date or competition start?
    competition = await crud_competition.get(session, id=competition_id) # Needed for dates
    now = datetime.utcnow()
    if competition.roster_lock_date and now > competition.roster_lock_date:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot withdraw registration after roster lock date.")
    # if competition.start_date and now > competition.start_date:
    #     raise HTTPException(status_code=400, detail="Cannot withdraw registration after competition has started.")

    updated_registration = await crud_team_registration.withdraw_registration(session, registration=registration)
    return updated_registration

@router.get("/{competition_id}/teams", response_model=List[TeamRegistrationReadDetailed])
async def list_registered_teams(
    competition_id: int = Path(...),
    session: AsyncSession = Depends(deps.get_async_session),
    # current_user: User = Depends(deps.get_current_active_user), # Public endpoint? Or logged-in only?
) -> Any:
    """ List teams registered for a specific competition. """
    competition = await crud_competition.get(session, id=competition_id)
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    if competition.format != CompetitionFormat.TEAM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This competition is not for teams."
        )

    registrations = await crud_team_registration.get_registrations_for_competition(
        session, competition_id=competition_id
    )
    
    # Convert to Detailed schema including team info
    detailed_registrations = []
    for reg in registrations:
        # Use model_validate for Pydantic v2
        reg_data = TeamRegistrationRead.model_validate(reg).model_dump()
        # Team data should be eager loaded by the CRUD function
        team_data = TeamRead.model_validate(reg.team).model_dump()
        
        detailed_registrations.append(
            TeamRegistrationReadDetailed(**reg_data, team=TeamRead(**team_data))
        )
        
    return detailed_registrations