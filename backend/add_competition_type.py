#!/usr/bin/env python
# add_competition_type.py - Update existing competition records to have valid type values
import asyncio
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

# Default type value to set for all competitions
DEFAULT_TYPE = "individual"

def update_competition_types():
    logger.info("Updating competition types...")
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if there are any NULL or empty type values
        cursor.execute("SELECT COUNT(*) FROM competition WHERE type IS NULL OR type = ''")
        count = cursor.fetchone()[0]
        
        if count > 0:
            logger.info(f"Found {count} competitions without type values. Updating...")
            
            # Update all competitions with NULL or empty type values
            cursor.execute(
                "UPDATE competition SET type = ?, updated_at = ? WHERE type IS NULL OR type = ''",
                (DEFAULT_TYPE, datetime.utcnow())
            )
            
            # Commit the changes
            conn.commit()
            logger.info(f"Updated {cursor.rowcount} competition records with default type '{DEFAULT_TYPE}'")
        else:
            logger.info("All competitions already have type values. No updates needed.")
        
        # Close the connection
        conn.close()
        
        logger.info("Competition type update completed successfully.")
    except Exception as e:
        logger.error(f"Error updating competition types: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    logger.info("Initializing competition type update...")
    update_competition_types()
    logger.info("Competition type update process finished.") 