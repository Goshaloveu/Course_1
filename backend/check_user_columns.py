#!/usr/bin/env python
# check_user_columns.py - Check for missing columns in the user table
import os
import sqlite3

# Get the path to the SQLite database
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")
print(f"Database path: {DB_PATH}")

def check_user_columns():
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get user table columns
        cursor.execute("PRAGMA table_info(user)")
        columns = cursor.fetchall()
        
        print("User table columns:")
        for col in columns:
            # Each column has: (id, name, type, notnull, default_value, pk)
            col_id, col_name, col_type, not_null, default_val, is_pk = col
            print(f"  - {col_name} ({col_type}), {'NOT NULL' if not_null else 'NULL'}, Default: {default_val}, PK: {is_pk}")
        
        # Check for specific columns that might be missing
        column_names = [col[1] for col in columns]
        required_columns = [
            "hashed_password", 
            "is_active", 
            "registration_date", 
            "last_login", 
            "created_at", 
            "updated_at"
        ]
        
        print("\nChecking for required columns:")
        for col in required_columns:
            if col in column_names:
                print(f"  ✓ {col} exists")
            else:
                print(f"  ✗ {col} is missing")
        
        # Close connection
        conn.close()
        
    except Exception as e:
        print(f"Error checking user columns: {e}")
        raise

if __name__ == "__main__":
    print("Checking user table schema...")
    check_user_columns()
    print("\nCheck complete.") 