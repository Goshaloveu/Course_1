from fastapi import FastAPI, Depends, HTTPException, status, Security, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
import httpx

from .config import settings
from .auth import verify_auth_token, verify_telegram_data

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Telegram Bot API", description="API for Telegram Bot integration")

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API key security for backend-to-bot communication
api_key_header = APIKeyHeader(name="X-BOT-API-KEY")

def validate_api_key(api_key: str = Security(api_key_header)) -> bool:
    """Validate the API key from the backend"""
    if api_key != settings.API_BOT_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )
    return True

# Request and response models
class VerifyAuthRequest(BaseModel):
    auth_token: str
    
class AuthResponse(BaseModel):
    is_valid: bool
    telegram_id: Optional[int] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    auth_date: Optional[int] = None

class TelegramDataRequest(BaseModel):
    data: Dict[str, Any]
    
# API routes
@app.get("/")
async def root():
    return {"message": "Telegram Bot API is running"}

@app.post("/verify-auth", response_model=AuthResponse)
async def verify_auth(
    request: VerifyAuthRequest, 
    is_valid_key: bool = Depends(validate_api_key)
):
    """
    Verify an authentication token from the frontend
    """
    is_valid, auth_data = verify_auth_token(request.auth_token)
    
    if not is_valid or not auth_data:
        return AuthResponse(is_valid=False)
    
    return AuthResponse(
        is_valid=True,
        telegram_id=auth_data.get("id"),
        username=auth_data.get("username"),
        first_name=auth_data.get("first_name"),
        auth_date=auth_data.get("auth_date")
    )

@app.post("/verify-telegram-data", response_model=AuthResponse)
async def verify_telegram_login_data(
    request: TelegramDataRequest, 
    is_valid_key: bool = Depends(validate_api_key)
):
    """
    Verify data received from Telegram Login Widget
    """
    is_valid = verify_telegram_data(request.data)
    
    if not is_valid:
        return AuthResponse(is_valid=False)
    
    return AuthResponse(
        is_valid=True,
        telegram_id=request.data.get("id"),
        username=request.data.get("username"),
        first_name=request.data.get("first_name"),
        auth_date=request.data.get("auth_date")
    )

# Start FastAPI with uvicorn when run directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:app", 
        host=settings.WEBAPP_HOST, 
        port=settings.WEBAPP_PORT,
        reload=True,
    ) 