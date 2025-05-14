import os
import logging
import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters.command import Command
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.deep_linking import create_start_link, decode_payload
import httpx

from .config import settings
from .auth import generate_auth_data, verify_auth_token, verify_telegram_data

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize bot and dispatcher
print(settings.BOT_TOKEN)
bot = Bot(token=settings.BOT_TOKEN)
dp = Dispatcher()

# Command handlers
@dp.message(Command("start"))
async def cmd_start(message: Message):
    """Handle the /start command"""
    payload = message.text.split()
    
    # Check if we have a payload (deep link)
    if len(payload) > 1:
        # If user came from website auth flow, process it
        try:
            auth_payload = payload[1]
            # Validate and process auth request
            await message.answer("🔐 Authentication request received. Please click 'Authorize' to log in to the website.")
            
            # Create inline keyboard for authorization
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="Authorize", callback_data=f"auth:{auth_payload}")]
            ])
            
            await message.answer("Do you want to authorize this login?", reply_markup=keyboard)
            return
        except Exception as e:
            logging.error(f"Error processing auth payload: {e}")
    
    # Regular start command
    await message.answer(f"Hello, {message.from_user.first_name}! I'm your authentication bot.")
    
    help_text = """
I can help you authenticate to our competition website.

Available commands:
/start - Start the bot
/auth - Get authentication code
/help - Show this help message
    """
    await message.answer(help_text)

@dp.message(Command("auth"))
async def cmd_auth(message: Message):
    """Handle the /auth command to generate authentication credentials"""
    user_id = message.from_user.id
    first_name = message.from_user.first_name
    username = message.from_user.username
    
    # Generate auth token and data
    auth_token, auth_data = generate_auth_data(
        user_id=user_id, 
        first_name=first_name,
        username=username
    )
    
    # Create login URL
    login_url = f"{settings.FRONTEND_URL}/auth/telegram?token={auth_token}"
    
    # Create inline keyboard with login button
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Login to Website", url=login_url)]
    ])
    
    await message.answer(
        "Click the button below to log in to our competition website:",
        reply_markup=keyboard
    )
    
    # Also provide auth code in case the button doesn't work
    await message.answer(f"Alternatively, use this code on the login page: {auth_token}")

@dp.callback_query(F.data.startswith("auth:"))
async def process_auth_callback(callback_query: types.CallbackQuery):
    """Process auth button clicks"""
    auth_payload = callback_query.data.split(":")[1]
    user_id = callback_query.from_user.id
    
    try:
        # Verify and complete auth process
        # In production, you'd make an API call to the backend here
        await bot.answer_callback_query(
            callback_query.id,
            text="Authorization successful! You can now return to the website.",
            show_alert=True
        )
        
        # Notify the user
        await bot.edit_message_text(
            "✅ Authorization successful! You can now return to the website and continue.",
            callback_query.message.chat.id,
            callback_query.message.message_id,
            reply_markup=None
        )
        
        # You could make a webhook call to your backend here to complete the auth flow
        
    except Exception as e:
        logging.error(f"Error processing authorization: {e}")
        await bot.answer_callback_query(
            callback_query.id,
            text="Authorization failed. Please try again.",
            show_alert=True
        )

@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    help_text = """
Available commands:
/start - Start the bot
/auth - Get authentication code
/help - Show this help message
    """
    await message.answer(help_text)

# Default handler for all other messages
@dp.message()
async def echo(message: types.Message):
    await message.answer("I don't understand. Use /help to see available commands.")

# Main function to start the bot
async def main():
    logging.info("Starting Telegram authentication bot")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main()) 