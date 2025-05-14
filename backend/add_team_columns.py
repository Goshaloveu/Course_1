#!/usr/bin/env python
# add_team_columns.py - Add team-related columns to the competition table
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

def add_team_columns():
    logger.info("Adding team columns to competition table...")
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if columns already exist (in case script is run multiple times)
        cursor.execute("PRAGMA table_info(competition)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add min_team_members if it doesn't exist
        if "min_team_members" not in columns:
            logger.info("Adding min_team_members column...")
            cursor.execute("ALTER TABLE competition ADD COLUMN min_team_members INTEGER")
        
        # Add max_team_members if it doesn't exist
        if "max_team_members" not in columns:
            logger.info("Adding max_team_members column...")
            cursor.execute("ALTER TABLE competition ADD COLUMN max_team_members INTEGER")
        
        # Add roster_lock_date if it doesn't exist
        if "roster_lock_date" not in columns:
            logger.info("Adding roster_lock_date column...")
            cursor.execute("ALTER TABLE competition ADD COLUMN roster_lock_date TIMESTAMP")
        
        # Commit changes
        conn.commit()
        
        # Close connection
        conn.close()
        
        logger.info("Team columns added successfully to competition table.")
    except Exception as e:
        logger.error(f"Error adding team columns: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    logger.info("Initializing database schema update...")
    add_team_columns()
    logger.info("Database schema update process finished.") 