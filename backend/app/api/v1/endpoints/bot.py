# app/api/v1/endpoints/bot.py
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Security
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime, timedelta

from app.api import deps
from app.crud import crud_competition
from app.models.competition import Competition, CompetitionPublic, CompetitionStatusEnum # Используем CompetitionPublic для ответа

router = APIRouter()

@router.get("/bot/upcoming_competitions", response_model=List[CompetitionPublic])
async def get_upcoming_competitions_for_bot(
    *,
    session: AsyncSession = Depends(deps.get_async_session),
    # Проверка API ключа бота
    is_valid_key: bool = Security(deps.validate_bot_api_key),
    limit: int = Query(5, ge=1, le=20, description="Max number of competitions to return"),
    # days_ahead: int = Query(7, ge=1, le=30, description="Look ahead period in days") # Можно добавить
):
    """
    Возвращает список ближайших предстоящих или идущих соревнований.
    Доступно только для авторизованного бота (по API ключу).
    """
    # Определяем статусы, которые интересны боту
    relevant_statuses = [CompetitionStatusEnum.upcoming, CompetitionStatusEnum.registration_open, CompetitionStatusEnum.ongoing]

    # Получаем соревнования с нужными статусами, сортируем по дате начала
    statement = crud_competition.get_competitions(session, limit=limit)
    # statement = (
    #     select(Competition)
    #     .where(Competition.status.in_(relevant_statuses))
    #     # Можно добавить фильтр по дате начала, если нужно
    #     # .where(Competition.comp_start_at >= datetime.utcnow())
    #     # .where(Competition.comp_start_at <= datetime.utcnow() + timedelta(days=days_ahead))
    #     .order_by(Competition.comp_start_at.asc())
    #     .limit(limit)
    # )
    result = await session.exec(statement)
    competitions = result.all()

    # Преобразуем в CompetitionPublic для ответа
    return competitions