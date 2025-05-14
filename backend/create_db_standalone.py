#!/usr/bin/env python
# create_db_standalone.py
import asyncio
import logging
import os
import sqlite3

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the path to the SQLite database
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")
logger.info(f"Database path: {DB_PATH}")

# SQL statements to create the tables
CREATE_TABLES_SQL = """
-- User table
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    is_organizer BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    hashed_password TEXT,
    registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Competition table
CREATE TABLE IF NOT EXISTS competition (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    reg_start_at TIMESTAMP,
    reg_end_at TIMESTAMP,
    comp_start_at TIMESTAMP,
    comp_end_at TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'upcoming',
    external_links_json TEXT DEFAULT '{}',
    organizer_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    min_team_members INTEGER,
    max_team_members INTEGER,
    roster_lock_date TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES user(id)
);

-- Registration table
CREATE TABLE IF NOT EXISTS registration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    competition_id INTEGER NOT NULL,
    registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'registered',
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (competition_id) REFERENCES competition(id),
    UNIQUE (user_id, competition_id)
);

-- Result table
CREATE TABLE IF NOT EXISTS result (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    competition_id INTEGER NOT NULL,
    score REAL NOT NULL,
    place INTEGER,
    submission_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details_json TEXT DEFAULT '{}',
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (competition_id) REFERENCES competition(id)
);

-- Team table
CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    tag TEXT,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    visibility TEXT NOT NULL DEFAULT 'public',
    leader_id INTEGER NOT NULL,
    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES user(id)
);

-- Team Member table (link table)
CREATE TABLE IF NOT EXISTS team_member (
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    join_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES team(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Team Registration table
CREATE TABLE IF NOT EXISTS team_registration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    competition_id INTEGER NOT NULL,
    registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'registered',
    FOREIGN KEY (team_id) REFERENCES team(id),
    FOREIGN KEY (competition_id) REFERENCES competition(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_telegram_id ON user(telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_username ON user(username);
CREATE INDEX IF NOT EXISTS idx_competition_title ON competition(title);
CREATE INDEX IF NOT EXISTS idx_competition_type ON competition(type);
CREATE INDEX IF NOT EXISTS idx_competition_status ON competition(status);
CREATE INDEX IF NOT EXISTS idx_team_name ON team(name);
CREATE INDEX IF NOT EXISTS idx_team_tag ON team(tag);
CREATE INDEX IF NOT EXISTS idx_team_registration_team_id ON team_registration(team_id);
CREATE INDEX IF NOT EXISTS idx_team_registration_competition_id ON team_registration(competition_id);
"""

def create_db_tables():
    logger.info("Creating database tables...")
    try:
        # Connect to SQLite database (creates it if it doesn't exist)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Execute the SQL to create tables
        cursor.executescript(CREATE_TABLES_SQL)
        
        # Commit the changes and close the connection
        conn.commit()
        conn.close()
        
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    logger.info("Initializing DB creation...")
    create_db_tables()
    logger.info("DB creation process finished.") 