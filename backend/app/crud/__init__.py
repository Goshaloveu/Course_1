# app/crud/__init__.py
# Опционально: импортируй сюда функции для удобства
from .crud_user import User
from .crud_competition import Competition
from .crud_registration import Registration, registration
from .crud_result import Result, result
from .crud_team import team
from .crud_team_registration import team_registration

# Или создай объекты классов CRUD
# user = CRUDUser(User)
# ...

# Make all CRUD objects available for import from app.crud