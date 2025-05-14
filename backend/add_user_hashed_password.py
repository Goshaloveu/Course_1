#!/usr/bin/env python
# add_user_hashed_password.py - Add hashed_password column to the user table
import logging
import os
import sqlite3
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Get the path to the SQLite database
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")
print(f"Database path: {DB_PATH}")
logger.info(f"Database path: {DB_PATH}")

def add_hashed_password_column():
    print("Adding hashed_password column to user table...")
    logger.info("Adding hashed_password column to user table...")
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if column already exists (in case script is run multiple times)
        cursor.execute("PRAGMA table_info(user)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Existing columns: {columns}")
        logger.info(f"Existing columns: {columns}")
        
        # Add hashed_password if it doesn't exist
        if "hashed_password" not in columns:
            print("Adding hashed_password column...")
            logger.info("Adding hashed_password column...")
            cursor.execute("ALTER TABLE user ADD COLUMN hashed_password TEXT")
            
            # Commit changes
            conn.commit()
            print("hashed_password column added successfully to user table.")
            logger.info("hashed_password column added successfully to user table.")
        else:
            print("hashed_password column already exists. No changes needed.")
            logger.info("hashed_password column already exists. No changes needed.")
        
        # Close connection
        conn.close()
        
    except Exception as e:
        print(f"Error adding hashed_password column: {e}")
        logger.error(f"Error adding hashed_password column: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    print("Initializing database schema update...")
    logger.info("Initializing database schema update...")
    add_hashed_password_column()
    print("Database schema update process finished.")
    logger.info("Database schema update process finished.") 