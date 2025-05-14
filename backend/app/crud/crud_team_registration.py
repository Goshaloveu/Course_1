from typing import List, Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.team_registration import TeamRegistration, TeamRegistrationStatus
from app.models.team import Team
from app.models.competition import Competition
from app.schemas.team_registration import TeamRegistrationCreate, TeamRegistrationUpdate # Schemas not created yet!
from app.crud.base import CRUDBase


class CRUDTeamRegistration(CRUDBase[TeamRegistration, TeamRegistrationCreate, TeamRegistrationUpdate]):
    async def create_registration(self, db: AsyncSession, *, team: Team, competition: Competition) -> TeamRegistration:
        """ Creates a registration record for a team in a competition. """
        # Check if already registered
        existing = await self.get_registration(db, team_id=team.id, competition_id=competition.id)
        if existing:
            # Handle re-registration? Update status? For now, raise error.
            raise ValueError("Team already registered for this competition")

        # Basic validation (more complex validation in the endpoint/service layer)
        if competition.min_team_members is not None:
            if len(team.members) < competition.min_team_members:
                raise ValueError(f"Team does not meet minimum member requirement ({competition.min_team_members})")
        if competition.max_team_members is not None:
            if len(team.members) > competition.max_team_members:
                raise ValueError(f"Team exceeds maximum member limit ({competition.max_team_members})")

        # Create the registration object implicitly using IDs
        # obj_in = TeamRegistrationCreate(team_id=team.id) # Not needed if creating directly
        db_obj = TeamRegistration(team_id=team.id, competition_id=competition.id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_registration(self, db: AsyncSession, *, team_id: int, competition_id: int) -> Optional[TeamRegistration]:
        statement = select(self.model).where(
            self.model.team_id == team_id,
            self.model.competition_id == competition_id
        )
        results = await db.exec(statement)
        return results.first()

    async def get_registrations_for_competition(self, db: AsyncSession, *, competition_id: int, skip: int = 0, limit: int = 100) -> List[TeamRegistration]:
        statement = (
            select(self.model)
            .where(self.model.competition_id == competition_id)
            .options(selectinload(self.model.team).selectinload(Team.leader)) # Eager load team and its leader
            .offset(skip)
            .limit(limit)
        )
        results = await db.exec(statement)
        return results.unique().all()

    async def get_registrations_for_team(self, db: AsyncSession, *, team_id: int) -> List[TeamRegistration]:
        statement = (
            select(self.model)
            .where(self.model.team_id == team_id)
            .options(selectinload(self.model.competition)) # Eager load competition
        )
        results = await db.exec(statement)
        return results.unique().all()

    async def withdraw_registration(self, db: AsyncSession, *, registration: TeamRegistration) -> TeamRegistration:
        """ Sets the registration status to withdrawn. """
        # Could add checks, e.g., cannot withdraw after competition starts
        registration.status = TeamRegistrationStatus.WITHDRAWN
        db.add(registration)
        await db.commit()
        await db.refresh(registration)
        return registration


team_registration = CRUDTeamRegistration(TeamRegistration) 