# app/api/deps.py
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from jose import jwt
from pydantic import ValidationError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core import security
from app.core.db import get_async_session # Импортируем из твоего db.py
from app.models.user import User
from app.models.token import TokenPayload
from app.crud import crud_user, crud_team # Импортируем CRUD пользователя и команды
from app.models.team import Team, TeamMember, TeamRole # Import Team models

# Схема OAuth2 для получения токена из заголовка Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token") # URL для получения токена (если бы была форма)

# Заголовок для API ключа бота
api_key_header_auth = APIKeyHeader(name="X-BOT-API-KEY", auto_error=True)

async def get_current_user(
    session: AsyncSession = Depends(get_async_session), token: str = Depends(oauth2_scheme)
) -> User:
    """
    Декодирует JWT токен и возвращает объект пользователя из БД.
    Бросает HTTPException 401 если токен невалиден или пользователь не найден.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = security.decode_access_token(token)
    if payload is None:
        raise credentials_exception

    telegram_id: Optional[str] = payload.get("sub")
    if telegram_id is None:
        raise credentials_exception

    try:
        # Ожидаем, что 'sub' в токене - это telegram_id
        user = await crud_user.get_user_by_telegram_id(session, telegram_id=int(telegram_id))
    except (ValueError, TypeError): # Если telegram_id не int
         raise credentials_exception

    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Проверяет, активен ли пользователь (пока просто возвращает).
    В будущем здесь можно добавить проверку статуса (is_active).
    """
    # if not current_user.is_active: # Если бы было поле is_active
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_active_organizer(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Проверяет, является ли текущий пользователь организатором.
    """
    if not current_user.is_organizer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges (Organizer role required)",
        )
    return current_user

async def validate_bot_api_key(api_key_header: str = Security(api_key_header_auth)) -> bool:
    """
    Проверяет API-ключ, переданный ботом.
    """
    if api_key_header == settings.TELEGRAM_BOT_API_KEY:
        return True
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials: Invalid API Key for bot",
        )

# Зависимость для проверки владения соревнованием (пока не добавлена в эндпоинты ниже,
# но ее легко добавить при необходимости)
# async def get_competition_owner_dependency(
#     competition_id: int,
#     current_user: User = Depends(get_current_active_organizer),
#     session: AsyncSession = Depends(get_async_session),
# ) -> Competition:
#     competition = await crud_competition.get_competition(session, competition_id=competition_id)
#     if not competition:
#         raise HTTPException(status_code=404, detail="Competition not found")
#     if competition.organizer_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Not the owner of this competition")
#     return competition

# --- Team Permission Dependencies ---

async def get_team_from_path( 
    team_id: int, 
    session: AsyncSession = Depends(get_async_session)
) -> Team:
    """ Dependency to get a team by ID from the path parameter. """
    team = await crud_team.get_with_details(session, id=team_id) # Load details
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team

async def get_current_team_member(
    team: Team = Depends(get_team_from_path),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
) -> TeamMember:
    """ Dependency to get the current user's membership record for a specific team. """
    member = await crud_team.get_member(session, team_id=team.id, user_id=current_user.id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team."
        )
    return member

async def get_current_team_leader(
    team: Team = Depends(get_team_from_path),
    current_user: User = Depends(get_current_active_user),
    # member: TeamMember = Depends(get_current_team_member) # Could reuse, but direct check is clearer
) -> User:
    """ Dependency to ensure the current user is the leader of the team. """
    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be the leader of this team to perform this action."
        )
    # We already know the user is active from get_current_active_user
    # We already know the team exists from get_team_from_path
    return current_user

async def get_current_team_leader_or_officer(
    member: TeamMember = Depends(get_current_team_member),
    # team: Team = Depends(get_team_from_path), # Included via get_current_team_member -> get_team_from_path
    current_user: User = Depends(get_current_active_user),
) -> User:
    """ Dependency to ensure the current user is the leader or an officer of the team. """
    if member.role not in [TeamRole.LEADER, TeamRole.OFFICER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a leader or officer of this team to perform this action."
        )
    return current_user