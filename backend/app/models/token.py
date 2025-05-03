# app/models/token.py
# Модель для ответа с JWT токеном
from sqlmodel import SQLModel

class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

# Опционально: модель для данных из токена
class TokenPayload(SQLModel):
    sub: str | None = None # subject (обычно user ID или telegram ID)