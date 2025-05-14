import hmac
import hashlib
import time
from typing import Dict, Optional, Tuple, Any
import logging

from .config import settings

# Simplified in-memory storage for auth requests
# In production, use Redis or a database
auth_requests = {}  # user_id -> auth_data


def generate_auth_data(user_id: int, first_name: Optional[str] = None, 
                      username: Optional[str] = None, auth_type: str = "login") -> Tuple[str, Dict[str, Any]]:
    """
    Generate authentication data for a user
    
    Args:
        user_id: Telegram user ID
        first_name: User's first name
        username: User's username
        auth_type: Type of authentication (login, registration, etc.)
        
    Returns:
        Tuple[str, Dict]: Auth token and auth data
    """
    # Create auth data
    auth_data = {
        "id": user_id,
        "auth_date": int(time.time()),
        "auth_type": auth_type
    }
    
    if first_name:
        auth_data["first_name"] = first_name
    
    if username:
        auth_data["username"] = username
    
    # Store auth data
    auth_requests[user_id] = auth_data
    
    # Generate token
    auth_token = f"{user_id}_{auth_data['auth_date']}"
    
    return auth_token, auth_data


def verify_auth_token(auth_token: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    Verify an authentication token
    
    Args:
        auth_token: Auth token from frontend
        
    Returns:
        Tuple[bool, Optional[Dict]]: (is_valid, auth_data)
    """
    try:
        user_id, auth_date = auth_token.split('_')
        user_id = int(user_id)
        
        # Check if we have this auth request
        if user_id in auth_requests:
            stored_auth = auth_requests[user_id]
            if str(stored_auth['auth_date']) == auth_date:
                # Check if token isn't too old (30 minutes)
                current_time = int(time.time())
                if current_time - stored_auth['auth_date'] <= 1800:  # 30 minutes
                    # Token is valid, remove it to prevent reuse
                    auth_data = auth_requests.pop(user_id)
                    return True, auth_data
        
        return False, None
        
    except Exception as e:
        logging.error(f"Error verifying auth token: {e}")
        return False, None


def verify_telegram_data(data: Dict[str, Any]) -> bool:
    """
    Verify data received from Telegram 
    (for Telegram Login Widget or custom auth flow)
    
    Args:
        data: Data dict received from Telegram
        
    Returns:
        bool: True if data is valid, False otherwise
    """
    if 'hash' not in data:
        return False
    
    # Get hash from data
    received_hash = data.pop('hash')
    
    # Sort remaining data
    data_check_list = []
    for key, value in sorted(data.items()):
        if key != 'hash':
            data_check_list.append(f"{key}={value}")
    
    # Create data check string
    data_check_string = '\n'.join(data_check_list)
    
    # Create secret key
    secret_key = hashlib.sha256(settings.BOT_TOKEN.encode()).digest()
    
    # Calculate expected hash
    hmac_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Restore the hash for subsequent operations
    data['hash'] = received_hash
    
    # Compare hashes
    return hmac.compare_digest(received_hash, hmac_hash) 