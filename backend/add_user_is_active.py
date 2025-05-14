#!/usr/bin/env python
# add_user_is_active.py - Add is_active column to the user table
import logging
import os
import sqlite3
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the path to the SQLite database
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")
logger.info(f"Database path: {DB_PATH}")

def add_is_active_column():
    logger.info("Adding is_active column to user table...")
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if column already exists (in case script is run multiple times)
        cursor.execute("PRAGMA table_info(user)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add is_active if it doesn't exist
        if "is_active" not in columns:
            logger.info("Adding is_active column...")
            cursor.execute("ALTER TABLE user ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE")
            
            # Commit changes
            conn.commit()
            logger.info("is_active column added successfully to user table.")
        else:
            logger.info("is_active column already exists. No changes needed.")
        
        # Close connection
        conn.close()
        
    except Exception as e:
        logger.error(f"Error adding is_active column: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    logger.info("Initializing database schema update...")
    add_is_active_column()
    logger.info("Database schema update process finished.") 