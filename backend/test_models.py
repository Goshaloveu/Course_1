#!/usr/bin/env python
"""
Simple test script to check if all models load correctly without circular import issues.
"""

import sys
from sqlmodel import SQLModel, create_engine

# Import all models to test them
from app.models.user import User
from app.models.competition import Competition
from app.models.registration import Registration
from app.models.result import Result
from app.models.team import Team, TeamMember
from app.models.team_registration import TeamRegistration

def test_models():
    """Test that all models can be correctly loaded and mapped."""
    # Create in-memory database for testing
    engine = create_engine("sqlite:///:memory:")
    
    print("Creating all tables...")
    # This will fail if there are any model relationship issues
    SQLModel.metadata.create_all(engine)
    print("SUCCESS: All models were loaded correctly!")
    return 0

if __name__ == "__main__":
    sys.exit(test_models()) 