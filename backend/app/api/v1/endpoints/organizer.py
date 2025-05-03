# app/api/v1/endpoints/organizer.py
import csv
import io
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status, UploadFile, File, Form
from pydantic import ValidationError
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import SQLModel
from sqlmodel import select
import httpx
import asyncio

from app.api import deps
from app.crud import crud_competition, crud_registration, crud_result, crud_user
from app.models.competition import Competition, CompetitionCreate, CompetitionUpdate, CompetitionRead, CompetitionStatusEnum
from app.models.registration import RegistrationReadWithUser, Registration # Для participant list
from app.models.result import ResultCreate, ResultRead, Result # Для загрузки и отображения
from app.models.user import User, UserPublic # Для participant list
from app.models.message import Message
from app.core.config import Settings

router = APIRouter()

# --- Управление Соревнованиями ---

@router.get("/organizer/competitions", response_model=List[CompetitionRead])
async def read_organizer_competitions(
    current_user: User = Depends(deps.get_current_active_organizer),
    session: AsyncSession = Depends(deps.get_async_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
):
    """
    Получение списка соревнований, созданных текущим организатором.
    """
    competitions = await crud_competition.get_competitions_by_organizer(
        session, organizer_id=current_user.id, skip=skip, limit=limit
    )
    # Pydantic преобразует List[Competition] в List[CompetitionRead]
    return competitions

@router.post("/organizer/competitions", response_model=CompetitionRead, status_code=status.HTTP_201_CREATED)
async def create_new_competition(
    *,
    competition_in: CompetitionCreate,
    current_user: User = Depends(deps.get_current_active_organizer),
    session: AsyncSession = Depends(deps.get_async_session),
):
    """
    Создание нового соревнования текущим организатором.
    """
    # Устанавливаем статус по умолчанию 'upcoming', если не передан
    if not competition_in.status:
         competition_in.status = CompetitionStatusEnum.upcoming

    competition = await crud_competition.create_competition(
        session, competition_in=competition_in, organizer_id=current_user.id
    )
    return competition

@router.put("/organizer/competitions/{competition_id}", response_model=CompetitionRead)
async def update_existing_competition(
    competition_id: int,
    *,
    competition_in: CompetitionUpdate,
    current_user: User = Depends(deps.get_current_active_organizer),
    session: AsyncSession = Depends(deps.get_async_session),
):
    """
    Обновление данных соревнования. Организатор может обновлять только свои соревнования.
    """
    db_competition = await crud_competition.get_competition(session, competition_id=competition_id)
    if not db_competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")
    if db_competition.organizer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this competition")

    updated_competition = await crud_competition.update_competition(
        session, db_obj=db_competition, obj_in=competition_in
    )
    return updated_competition

# --- Управление Участниками и Результатами ---

@router.get("/organizer/competitions/{competition_id}/participants", response_model=List[RegistrationReadWithUser])
async def read_competition_participants(
    competition_id: int,
    current_user: User = Depends(deps.get_current_active_organizer),
    session: AsyncSession = Depends(deps.get_async_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000), # Лимит побольше для участников
):
    """
    Получение списка зарегистрированных участников для соревнования организатора.
    """
    # Проверка, что соревнование существует и принадлежит организатору
    db_competition = await crud_competition.get_competition(session, competition_id=competition_id)
    if not db_competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")
    if db_competition.organizer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this competition")

    registrations_db = await crud_registration.get_registrations_by_competition(
        session, competition_id=competition_id, skip=skip, limit=limit
    )

    # Преобразуем в формат ответа RegistrationReadWithUser
    participants = []
    for reg in registrations_db:
        user_public = None
        if reg.user: # User должен быть загружен через selectinload
            user_public = UserPublic.model_validate(reg.user)

        reg_read = RegistrationReadWithUser(registered_at=reg.registered_at, user=user_public)
        participants.append(reg_read)

    return participants


# --- Загрузка Результатов ---

# Определим модель для ручного ввода одного результата
class ManualResultEntry(SQLModel):
    telegram_id: int # Идентификатор пользователя
    result_value: Optional[str] = None
    rank: Optional[int] = None

@router.post("/organizer/competitions/{competition_id}/results", response_model=Message)
async def upload_competition_results(
    competition_id: int,
    *,
    current_user: User = Depends(deps.get_current_active_organizer),
    session: AsyncSession = Depends(deps.get_async_session),
    # Либо CSV файл, либо JSON список ручных записей
    results_file: Optional[UploadFile] = File(None, description="CSV file with results (columns: telegram_id, result_value, rank)"),
    manual_results: Optional[List[ManualResultEntry]] = Body(None, description="List of results for manual entry")
):
    """
    Загрузка результатов соревнования (CSV или ручной ввод).
    Обновляет или создает записи результатов. Не публикует их.
    """
     # Проверка, что соревнование существует и принадлежит организатору
    db_competition = await crud_competition.get_competition(session, competition_id=competition_id)
    if not db_competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")
    if db_competition.organizer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this competition")

    if results_file and manual_results:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide either 'results_file' (CSV) or 'manual_results' (JSON), not both.")

    results_to_process: List[ResultCreate] = []
    errors = []

    if results_file:
        # --- Обработка CSV ---
        if results_file.content_type not in ['text/csv', 'application/vnd.ms-excel']: # Проверка типа файла
             raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Invalid file type. Please upload a CSV file.")

        try:
            content = await results_file.read()
            stream = io.StringIO(content.decode("utf-8")) # Предполагаем UTF-8
            # Используем DictReader для удобства доступа по именам колонок
            csv_reader = csv.DictReader(stream)

            required_columns = {'telegram_id', 'result_value', 'rank'}
            if not required_columns.issubset(csv_reader.fieldnames or []):
                 raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"CSV must contain columns: {', '.join(required_columns)}")

            for row_num, row in enumerate(csv_reader, start=2): # start=2 т.к. 1-я строка - заголовки
                try:
                    telegram_id = int(row['telegram_id'].strip())
                    # Ищем пользователя по telegram_id
                    user = await crud_user.get_user_by_telegram_id(session, telegram_id=telegram_id)
                    if not user:
                         errors.append(f"Row {row_num}: User with telegram_id {telegram_id} not found in the platform.")
                         continue # Пропускаем строку, если юзер не найден

                    # Преобразуем ранк в int, если он есть
                    rank_val = None
                    if row.get('rank') and row['rank'].strip():
                        try:
                            rank_val = int(row['rank'].strip())
                        except ValueError:
                            errors.append(f"Row {row_num}: Invalid rank value '{row['rank']}' for user {telegram_id}. Must be an integer.")
                            continue

                    result_in = ResultCreate(
                        user_id=user.id,
                        competition_id=competition_id,
                        result_value=row.get('result_value', '').strip() or None, # Пустую строку считаем None
                        rank=rank_val
                    )
                    results_to_process.append(result_in)

                except KeyError as e:
                     errors.append(f"Row {row_num}: Missing column {e}.")
                except ValueError:
                     errors.append(f"Row {row_num}: Invalid telegram_id '{row.get('telegram_id')}'. Must be an integer.")
                except Exception as e:
                     errors.append(f"Row {row_num}: Unexpected error processing row - {e}")

        except Exception as e:
             # Ловим общие ошибки чтения/парсинга файла
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error processing CSV file: {e}")

    elif manual_results:
         # --- Обработка ручного ввода ---
         for entry_num, entry in enumerate(manual_results, start=1):
             user = await crud_user.get_user_by_telegram_id(session, telegram_id=entry.telegram_id)
             if not user:
                  errors.append(f"Entry {entry_num}: User with telegram_id {entry.telegram_id} not found.")
                  continue

             result_in = ResultCreate(
                 user_id=user.id,
                 competition_id=competition_id,
                 result_value=entry.result_value,
                 rank=entry.rank
             )
             results_to_process.append(result_in)
    else:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No results provided. Use 'results_file' or 'manual_results'.")

    # Массовое создание/обновление результатов
    if results_to_process:
        processed_results = await crud_result.bulk_create_results(session, results_in=results_to_process, competition_id=competition_id)
        processed_count = len(processed_results)
    else:
        processed_count = 0

    # Формируем сообщение об успехе/ошибках
    message = f"Successfully processed {processed_count} result(s)."
    if errors:
         message += f" Encountered {len(errors)} error(s): {'; '.join(errors[:5])}" # Показываем первые 5 ошибок
         # Возможно, стоит вернуть 207 Multi-Status или другой код, если были ошибки
         # но для MVP оставим 200 OK с сообщением

    return Message(message=message)


@router.post("/organizer/competitions/{competition_id}/results/publish", response_model=Message)
async def publish_competition_results(
    competition_id: int,
    *,
    current_user: User = Depends(deps.get_current_active_organizer),
    session: AsyncSession = Depends(deps.get_async_session),
    # TODO: Добавить зависимость для фоновых задач (BackgroundTasks) для отправки уведомлений
    # background_tasks: BackgroundTasks = Depends()
):
    """
    Публикация результатов соревнования и инициирование отправки уведомлений.
    Меняет статус соревнования на 'results_published'.
    """
    # Проверка владения
    db_competition = await crud_competition.get_competition(session, competition_id=competition_id)
    if not db_competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")
    if db_competition.organizer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this competition")

    # Проверка, что соревнование завершено (логически)
    # if db_competition.status not in [CompetitionStatusEnum.finished, CompetitionStatusEnum.closed]:
        # raise HTTPException(status_code=400, detail="Cannot publish results until the competition is finished or closed.")

    # Меняем статус
    updated_competition = await crud_competition.update_competition_status(
        session, competition_id=competition_id, status=CompetitionStatusEnum.results_published
    )

    if not updated_competition:
        # Не должно случиться, если проверка выше прошла, но все же
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update competition status")

    # --- Логика отправки уведомлений ---
    # Получаем список зарегистрированных пользователей (только telegram_id)
    registrations = await session.exec(
         select(Registration.user_id).where(Registration.competition_id == competition_id)
    )
    user_ids_to_notify = registrations.all()

    if user_ids_to_notify:
         users_to_notify = await session.exec(
             select(User.telegram_id).where(User.id.in_(user_ids_to_notify))
         )
         telegram_ids = users_to_notify.all()

         # Формируем сообщение
         message_text = (
             f"🎉 Результаты соревнования '{db_competition.title}' опубликованы!\n"
             f"Посмотреть их можно на платформе: {Settings.FRONTEND_HOST}/competitions/{competition_id}" # Пример ссылки
         )

         # Ставим задачу отправки в фон (используя BackgroundTasks или Celery/RQ)
         # background_tasks.add_task(send_telegram_notifications, telegram_ids, message_text)
         print(f"INFO: Would send notification to Telegram IDs: {telegram_ids} with message: '{message_text}'") # Заглушка для MVP

    return Message(message="Results published successfully. Notifications are being sent.")

# Функция для отправки уведомлений (вызывается в фоне)
async def send_telegram_notifications(telegram_ids: List[int], message: str):
     """ Отправляет сообщение указанным пользователям Telegram. """
     # Используем httpx для асинхронных запросов к Telegram Bot API
     bot_token = Settings.TELEGRAM_BOT_TOKEN
     tg_api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

     async with httpx.AsyncClient() as client:
         for tg_id in telegram_ids:
             try:
                 # chat_id для личного сообщения совпадает с telegram_id пользователя
                 response = await client.post(tg_api_url, json={
                     "chat_id": tg_id,
                     "text": message,
                     "parse_mode": "HTML" # Или Markdown, если нужно форматирование
                 })
                 response.raise_for_status() # Проверка на HTTP ошибки
                 print(f"Successfully sent notification to {tg_id}")
             except httpx.HTTPStatusError as e:
                 print(f"Error sending notification to {tg_id}: {e.response.status_code} - {e.response.text}")
             except Exception as e:
                 print(f"Unexpected error sending notification to {tg_id}: {e}")
             await asyncio.sleep(0.1) # Небольшая пауза, чтобы не перегружать API Telegram