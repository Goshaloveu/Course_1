# Fixing Database Schema Issues in FastAPI Backend

## Problem 1: "no such column: competition.format" Error

The application was encountering the following error when trying to access competitions:

```
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such column: competition.format
```

The error occurred because our SQLAlchemy model referenced a `format` column in the `competition` table, but this column doesn't exist in the actual database schema.

### Solution

The fix involves the following changes:

1. Removed the separate `format` column from the SQLAlchemy model definition
2. Modified the model to use the existing `type` field in the database
3. Added Python properties to provide a `format` property that maps to/from the `type` field:
   ```python
   @property
   def format(self) -> CompetitionFormat:
       return self.type
   
   @format.setter
   def format(self, value: CompetitionFormat):
       self.type = value
   ```
4. Set default values on the `type` field to ensure it's properly initialized
5. Created a migration script (`add_competition_type.py`) to update any existing competitions with missing type values

## Problem 2: "no such column: competition.min_team_members" Error

After fixing the format column issue, we encountered another error related to missing team-related columns:

```
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such column: competition.min_team_members
```

These columns were defined in the model but didn't exist in the actual database.

### Solution

1. Created a migration script (`add_team_columns.py`) to add the missing columns to the database:
   - `min_team_members` (INTEGER)
   - `max_team_members` (INTEGER)
   - `roster_lock_date` (TIMESTAMP)

## Problem 3: "no such column: user.is_active" Error

We also encountered an error related to a missing column in the user table:

```
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such column: user.is_active
```

### Solution

1. Created a migration script (`add_user_is_active.py`) to add the missing column to the database:
   - `is_active` (BOOLEAN, NOT NULL, DEFAULT TRUE)

## Problem 4: "no such column: user.hashed_password" Error

The final error we encountered was:

```
sqlite3.OperationalError: no such column: user.hashed_password
```

This error occurred because the User model referenced a hashed_password field that didn't exist in the database schema.

### Solution

We created a migration script (`add_user_hashed_password.py`) that:

1. Connects to the SQLite database
2. Checks if the column already exists
3. Adds the missing column:
   - hashed_password (TEXT)

## Problem 5: "no such column: user.registration_date" and "user.last_login" Error

Our inspection showed that the User model referenced two date columns that were missing from the database:

```
✗ registration_date is missing
✗ last_login is missing
```

### Solution

We created a migration script (`add_user_date_columns.py`) that:

1. Connects to the SQLite database
2. Checks if the columns already exist
3. Adds the missing columns:
   - registration_date (TIMESTAMP) - with current timestamp for existing users
   - last_login (TIMESTAMP)

This script handled SQLite's limitation with non-constant default values by first adding the columns and then updating values in a separate step.

## Applying the Fixes

To fix these issues, we ran the following scripts in order:

```bash
python add_competition_type.py
python add_team_columns.py
python add_user_is_active.py
python add_user_hashed_password.py
python add_user_date_columns.py
```

## Recommended Process for Future Database Schema Changes

To avoid similar issues in the future, we recommend:

1. Using a database migration tool like Alembic to manage schema changes
2. Creating a pre-start validation that compares SQLAlchemy models with the actual database schema
3. Documenting schema changes clearly for other developers
4. Always create migration scripts when modifying database models
5. Run automatic database validation scripts during application startup to ensure the database schema matches the SQLAlchemy models
6. Use alembic or a similar tool for database migrations to track schema changes
7. Implement proper version control for the database schema 