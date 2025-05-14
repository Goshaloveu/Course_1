# app/crud/crud_result.py
from typing import Optional, List, Sequence
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload # Для жадной загрузки
from sqlalchemy.exc import IntegrityError # Для отлова дублей

from app.models.user import User
from app.models.result import Result, ResultCreate
from app.crud.base import CRUDBase

class CRUDResult(CRUDBase[Result, ResultCreate, ResultCreate]):
    """ CRUD operations for Results """
    
    async def create_result(self, db: AsyncSession, *, obj_in: ResultCreate) -> Optional[Result]:
        """ Создает или обновляет результат для пользователя в соревновании """
        # Проверяем, есть ли уже результат для этой пары
        statement = select(Result).where(
            Result.user_id == obj_in.user_id,
            Result.competition_id == obj_in.competition_id
        )
        existing_result = (await db.execute(statement)).scalar_one_or_none()

        if existing_result:
            # Обновляем существующий
            update_data = obj_in.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(existing_result, key, value)
            db_obj = existing_result
        else:
            # Создаем новый
            db_obj = Result.model_validate(obj_in)

        db.add(db_obj)
        try:
            await db.commit()
            await db.refresh(db_obj)
            return db_obj
        except IntegrityError: # На случай гонки потоков или других проблем
            await db.rollback()
            return None # Или обработай ошибку иначе

    async def bulk_create_results(self, db: AsyncSession, *, results_in: List[ResultCreate], competition_id: int) -> List[Result]:
        """ Массово создает/обновляет результаты для соревнования.
            Это простой вариант, для больших объемов лучше использовать bulk_insert_mappings/bulk_update_mappings.
        """
        created_results = []
        for result_in in results_in:
            # Убедимся, что результат относится к нужному соревнованию
            if result_in.competition_id == competition_id:
                # Используем create_result для логики create/update
                created = await self.create_result(db, obj_in=result_in)
                if created:
                    created_results.append(created)
                # Можно добавить обработку ошибок, если created is None
        return created_results

    async def get_results_by_competition(
        self, db: AsyncSession, *, competition_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[Result]:
        """ Получает результаты для соревнования, включая данные пользователя, сортированные по рангу """
        statement = (
            select(Result)
            .where(Result.competition_id == competition_id)
            .options(selectinload(Result.user)) # Загружаем юзера
            .order_by(Result.rank.asc(), Result.submitted_at.asc()) # Сортируем по месту, потом по времени
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(statement)
        return result.all()

# Create CRUD object
result = CRUDResult(Result)