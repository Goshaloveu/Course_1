# app/crud/__init__.py
# Опционально: импортируй сюда функции для удобства
from .crud_user import User
from .crud_competition import Competition
from .crud_registration import Registration
from .crud_result import Result

# Или создай объекты классов CRUD
# user = CRUDUser(User)
# ...