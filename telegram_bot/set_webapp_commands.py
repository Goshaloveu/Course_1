#!/usr/bin/env python
import os
from dotenv import load_dotenv
import asyncio
from aiogram import Bot
from aiogram.types import BotCommand, MenuButtonWebApp, WebAppInfo

# Загружаем переменные окружения
load_dotenv()

# Получаем токен бота из переменных окружения
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# URL вашего веб-приложения
WEBAPP_URL = "https://yl.com.ru"

# Текст для кнопки меню WebApp
WEBAPP_BUTTON_TEXT = "Платформа"

async def set_commands(bot: Bot):
    """Установка команд для бота"""
    commands = [
        BotCommand(command="start", description="Запустить бота"),
        BotCommand(command="help", description="Получить помощь"),
        BotCommand(command="auth", description="Получить код авторизации"),
        BotCommand(command="webapp", description="Открыть платформу")
    ]
    await bot.set_my_commands(commands)
    print("✅ Команды бота настроены")

async def set_webapp_button(bot: Bot):
    """Установка кнопки WebApp в меню бота"""
    webapp_info = WebAppInfo(url=WEBAPP_URL)
    menu_button = MenuButtonWebApp(text=WEBAPP_BUTTON_TEXT, web_app=webapp_info)
    await bot.set_chat_menu_button(menu_button=menu_button)
    print(f"✅ Кнопка WebApp настроена с URL: {WEBAPP_URL}")

async def main():
    """Основная функция настройки бота"""
    if not TELEGRAM_BOT_TOKEN:
        print("❌ Ошибка: TELEGRAM_BOT_TOKEN не найден в переменных окружения")
        return
    
    print(f"🔄 Настройка Telegram бота для WebApp...")
    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    
    try:
        # Устанавливаем команды бота
        await set_commands(bot)
        
        # Устанавливаем кнопку WebApp
        await set_webapp_button(bot)
        
        print("✅ Настройка завершена успешно")
        
        # Дополнительная информация о настройке бота
        print("\n📝 Чтобы завершить настройку, выполните следующие шаги:")
        print("1. Откройте @BotFather в Telegram")
        print("2. Отправьте команду /setdomain")
        print("3. Выберите вашего бота")
        print("4. Введите домен: 2.58.69.254 (без http:// и порта)")
        
    except Exception as e:
        print(f"❌ Ошибка при настройке бота: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main()) 