# app/api/v1/api.py
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, competitions, organizer, bot, teams

api_router = APIRouter()

# Подключаем роутеры из других модулей
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(users.router, tags=["Users"])
api_router.include_router(competitions.router, tags=["Competitions (Public)"])
api_router.include_router(organizer.router, tags=["Organizer Actions"])
api_router.include_router(teams.router, prefix="/teams", tags=["Teams"])
api_router.include_router(bot.router, prefix="/bot", tags=["Telegram Bot Interaction"]) # Добавляем префикс /bot