import asyncio
import logging
import uvicorn
import multiprocessing
import time
import os
from aiogram import Bot
import sys

# Add parent directory to path to ensure module imports work
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, parent_dir)

from telegram_bot.config import settings
from telegram_bot.main import main as run_bot
from telegram_bot.api import app as api_app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

def run_api_server():
    """Run the FastAPI server for API integration"""
    logger.info(f"Starting API server on {settings.WEBAPP_HOST}:{settings.WEBAPP_PORT}")
    uvicorn.run(
        api_app,
        host=settings.WEBAPP_HOST,
        port=settings.WEBAPP_PORT,
        log_level="info",
    )

async def start_bot():
    """Start the Telegram bot"""
    logger.info("Starting Telegram bot")
    try:
        await run_bot()
    except Exception as e:
        logger.error(f"Error running bot: {e}")
        sys.exit(1)

def run_bot_process():
    """Run the bot in a separate process"""
    asyncio.run(start_bot())

def main():
    """Main entry point to run both the bot and API server"""
    logger.info("Starting Telegram Bot integration services")
    
    # Check if token is available
    if not settings.BOT_TOKEN:
        logger.error("BOT_TOKEN is not set. Please set it in .env file or environment variables.")
        sys.exit(1)
    
    # Check API key is set
    if not settings.API_BOT_KEY:
        logger.warning("API_BOT_KEY is not set. API security will be compromised.")
    
    # Print configuration info
    logger.info(f"Bot API will be available at: http://{settings.WEBAPP_HOST}:{settings.WEBAPP_PORT}")
    logger.info(f"Frontend URL configured as: {settings.FRONTEND_URL}")
    logger.info(f"Backend API URL configured as: {settings.API_BASE_URL}")
    
    # Start the API server in a separate process
    api_process = multiprocessing.Process(target=run_api_server)
    api_process.start()
    
    try:
        # Allow API server to start
        time.sleep(1)
        
        # Start the bot in the main process
        run_bot_process()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received, shutting down...")
    finally:
        # Clean up process
        if api_process.is_alive():
            logger.info("Stopping API server")
            api_process.terminate()
            api_process.join()
    
    logger.info("All services stopped")

if __name__ == "__main__":
    main() 