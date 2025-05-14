import os
import sys
import logging
import uvicorn
import threading
import time
import requests
from urllib.parse import urljoin

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

def start_api_server():
    """Start the API server in a separate thread"""
    from telegram_bot.api import app
    
    uvicorn.run(
        app,
        host="localhost",
        port=3001,
        log_level="info"
    )

def test_api_connection():
    """Test connection to the API server"""
    try:
        response = requests.get("http://localhost:3001/")
        if response.status_code == 200:
            logger.info(f"API server response: {response.json()}")
            return True
        else:
            logger.error(f"API server returned status code {response.status_code}")
            return False
    except requests.RequestException as e:
        logger.error(f"Failed to connect to API server: {e}")
        return False

def test_verify_auth():
    """Test the verify-auth endpoint"""
    try:
        # First generate a valid auth token
        from telegram_bot.auth import generate_auth_data
        token, data = generate_auth_data(user_id=12345, first_name="Test", username="test_user")
        
        # Now try to verify it
        response = requests.post(
            "http://localhost:3001/verify-auth",
            headers={"X-BOT-API-KEY": "test-api-key"},
            json={"auth_token": token}
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Verify auth response: {result}")
            if result.get("is_valid"):
                logger.info("✅ Auth verification successful")
                return True
            else:
                logger.error("❌ Auth verification returned invalid token")
                return False
        else:
            logger.error(f"Verify auth endpoint returned status code {response.status_code}")
            return False
    except requests.RequestException as e:
        logger.error(f"Failed to test verify-auth endpoint: {e}")
        return False

def main():
    """Run API tests"""
    # Add the parent directory to path to handle imports properly
    parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    sys.path.insert(0, parent_dir)
    
    logger.info("Starting API server in a separate thread...")
    api_thread = threading.Thread(target=start_api_server, daemon=True)
    api_thread.start()
    
    # Wait for the server to start
    logger.info("Waiting for the API server to start...")
    time.sleep(5)
    
    # Test connection
    if not test_api_connection():
        logger.error("Failed to connect to API server")
        return False
    
    # Test auth verification
    if not test_verify_auth():
        logger.error("Auth verification test failed")
        return False
    
    logger.info("All API tests completed successfully")
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("Tests interrupted by user")
        sys.exit(1) 