# app/models/message.py
# Простая модель для сообщений API
from sqlmodel import SQLModel

class Message(SQLModel):
    message: str