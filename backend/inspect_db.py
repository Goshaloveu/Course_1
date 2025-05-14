#!/usr/bin/env python
# inspect_db.py - Print information about the database schema
import os
import sqlite3

# Get the path to the SQLite database
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")
print(f"Database path: {DB_PATH}")

def inspect_database():
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get list of all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        table_names = [table[0] for table in tables]
        print("Tables in database:")
        for table in table_names:
            print(f"  - {table}")
        
        # For each table, get column info
        for table_name in table_names:
            print(f"\nTable: {table_name}")
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            print("Columns:")
            for col in columns:
                # Each column has: (id, name, type, notnull, default_value, pk)
                col_id, col_name, col_type, not_null, default_val, is_pk = col
                print(f"  - {col_name} ({col_type}), {'NOT NULL' if not_null else 'NULL'}, Default: {default_val}, PK: {is_pk}")
        
        # Close connection
        conn.close()
        
    except Exception as e:
        print(f"Error inspecting database: {e}")
        raise

if __name__ == "__main__":
    print("Inspecting database schema...")
    inspect_database()
    print("\nDatabase inspection complete.") 