#!/usr/bin/env python
# add_user_date_columns.py - Add registration_date and last_login columns to the user table
import os
import sqlite3
from datetime import datetime

# Get the path to the SQLite database
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")
print(f"Database path: {DB_PATH}")

def add_date_columns():
    print("Adding date columns to user table...")
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(user)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Existing columns: {columns}")
        
        # Add registration_date if it doesn't exist
        if "registration_date" not in columns:
            print("Adding registration_date column...")
            # SQLite doesn't support adding columns with non-constant defaults in ALTER TABLE
            cursor.execute("ALTER TABLE user ADD COLUMN registration_date TIMESTAMP")
            
            # Update existing rows with current timestamp
            current_time = datetime.now().isoformat()
            cursor.execute(f"UPDATE user SET registration_date = '{current_time}'")
            print("registration_date column added successfully and populated with current timestamp.")
        else:
            print("registration_date column already exists. No changes needed.")
            
        # Add last_login if it doesn't exist
        if "last_login" not in columns:
            print("Adding last_login column...")
            cursor.execute("ALTER TABLE user ADD COLUMN last_login TIMESTAMP")
            print("last_login column added successfully.")
        else:
            print("last_login column already exists. No changes needed.")
        
        # Commit changes
        conn.commit()
        
        # Close connection
        conn.close()
        
    except Exception as e:
        print(f"Error adding date columns: {e}")
        raise

if __name__ == "__main__":
    print("Initializing database schema update...")
    add_date_columns()
    print("Database schema update process finished.") 