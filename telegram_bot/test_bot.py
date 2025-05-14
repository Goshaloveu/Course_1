import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set test environment variables
os.environ["BOT_TOKEN"] = "dummy_token_123"
os.environ["API_BASE_URL"] = "http://localhost:8000/api/v1"
os.environ["API_BOT_KEY"] = "test-api-key"
os.environ["FRONTEND_URL"] = "http://localhost:5173"
os.environ["WEBAPP_HOST"] = "localhost"
os.environ["WEBAPP_PORT"] = "3001"
os.environ["SECRET_KEY"] = "test-secret-key"

def main():
    """Test the bot setup"""
    try:
        # Import config to test if it loads properly
        from telegram_bot.config import settings
        logger.info(f"Config loaded successfully. BOT_TOKEN={settings.BOT_TOKEN[:3]}...")
        
        # Import auth module to test
        from telegram_bot.auth import generate_auth_data, verify_auth_token
        logger.info("Auth module loaded successfully")
        
        # Test auth token generation
        token, data = generate_auth_data(user_id=12345, first_name="Test", username="test_user")
        logger.info(f"Generated auth token: {token}")
        logger.info(f"Auth data: {data}")
        
        # Test token verification
        is_valid, verified_data = verify_auth_token(token)
        logger.info(f"Token verification: {'✅ Success' if is_valid else '❌ Failed'}")
        if is_valid:
            logger.info(f"Verified data: {verified_data}")
        
        logger.info("All tests completed successfully")
        return True
    except Exception as e:
        logger.error(f"Test failed: {e}")
        return False

if __name__ == "__main__":
    # Add the parent directory to path to handle imports properly
    parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    sys.path.insert(0, parent_dir)
    
    success = main()
    sys.exit(0 if success else 1) 