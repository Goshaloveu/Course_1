from typing import List, Optional

from sqlmodel import select, and_
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload # Use selectinload for eager loading

from app.models.team import Team, TeamMember, TeamRole
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate, TeamMemberUpdateRole
from app.crud.base import CRUDBase


class CRUDTeam(CRUDBase[Team, TeamCreate, TeamUpdate]):
    async def create_with_leader(self, db: AsyncSession, *, obj_in: TeamCreate, leader: User) -> Team:
        """ Creates a team and adds the creator as the leader. """
        # Check if user is already a leader of another team (optional rule)
        # statement = select(Team).where(Team.leader_id == leader.id)
        # results = await db.exec(statement)
        # if results.first():
        #     raise ValueError("User is already a leader of another team")

        db_obj = Team(**obj_in.model_dump(), leader_id=leader.id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        # Add the leader as a member
        leader_member = TeamMember(team_id=db_obj.id, user_id=leader.id, role=TeamRole.LEADER)
        db.add(leader_member)
        await db.commit()
        await db.refresh(db_obj) # Refresh again to potentially load the members relationship
        return db_obj

    async def get_by_name(self, db: AsyncSession, *, name: str) -> Optional[Team]:
        statement = select(self.model).where(self.model.name == name)
        results = await db.exec(statement)
        return results.first()

    async def get_multi_with_details(self, db: AsyncSession, *, skip: int = 0, limit: int = 100) -> List[Team]:
        """ Get multiple teams, eagerly loading leader and members. """
        statement = (
            select(self.model)
            .options(
                selectinload(self.model.leader), # Eager load leader
                selectinload(self.model.members).selectinload(TeamMember.user) # Eager load members and their users
            )
            .offset(skip)
            .limit(limit)
        )
        results = await db.exec(statement)
        return results.unique().all() # Use unique() to handle potential duplicates from eager loading

    async def get_with_details(self, db: AsyncSession, *, id: int) -> Optional[Team]:
        """ Get a single team by ID, eagerly loading leader and members. """
        statement = (
            select(self.model)
            .where(self.model.id == id)
            .options(
                selectinload(self.model.leader),
                selectinload(self.model.members).selectinload(TeamMember.user)
            )
        )
        results = await db.exec(statement)
        return results.unique().first()

    async def get_teams_led_by_user(self, db: AsyncSession, *, user_id: int) -> List[Team]:
        statement = select(self.model).where(self.model.leader_id == user_id)
        results = await db.exec(statement)
        return results.all()

    async def get_teams_for_user(self, db: AsyncSession, *, user_id: int) -> List[Team]:
        """ Get all teams a user is a member of (including led teams). """
        statement = (
            select(Team)
            .join(TeamMember)
            .where(TeamMember.user_id == user_id)
            .options(selectinload(Team.leader), selectinload(Team.members).selectinload(TeamMember.user)) # Eager load details
        )
        results = await db.exec(statement)
        return results.unique().all()

    async def add_member(self, db: AsyncSession, *, team: Team, user: User, role: TeamRole = TeamRole.MEMBER) -> TeamMember:
        """ Adds a user to a team. """
        # Check if already a member
        member = await self.get_member(db, team_id=team.id, user_id=user.id)
        if member:
            # Maybe update role instead of raising error?
            # Or just return the existing membership
            return member
            # raise ValueError("User is already a member of this team")

        db_member = TeamMember(team_id=team.id, user_id=user.id, role=role)
        db.add(db_member)
        await db.commit()
        await db.refresh(db_member)
        return db_member

    async def get_member(self, db: AsyncSession, *, team_id: int, user_id: int) -> Optional[TeamMember]:
        statement = select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        results = await db.exec(statement)
        return results.first()

    async def update_member_role(self, db: AsyncSession, *, member: TeamMember, role_in: TeamMemberUpdateRole) -> TeamMember:
        member_data = role_in.model_dump(exclude_unset=True)
        for key, value in member_data.items():
            setattr(member, key, value)
        db.add(member)
        await db.commit()
        await db.refresh(member)
        return member

    async def remove_member(self, db: AsyncSession, *, member: TeamMember) -> None:
        await db.delete(member)
        await db.commit()

    async def transfer_leadership(self, db: AsyncSession, *, team: Team, current_leader: User, new_leader: User) -> Team:
        """ Transfers leadership from current_leader to new_leader. """
        if team.leader_id != current_leader.id:
            raise ValueError("Current user is not the leader of this team")
        if current_leader.id == new_leader.id:
            raise ValueError("New leader cannot be the same as the current leader")

        # Ensure new leader is a member of the team
        new_leader_membership = await self.get_member(db, team_id=team.id, user_id=new_leader.id)
        if not new_leader_membership:
            raise ValueError("New leader must be a member of the team")

        # Get current leader's membership
        current_leader_membership = await self.get_member(db, team_id=team.id, user_id=current_leader.id)
        if not current_leader_membership:
             # Should not happen if they are the leader, but good check
             raise ValueError("Current leader membership not found")

        # Update team leader_id
        team.leader_id = new_leader.id
        db.add(team)

        # Update roles
        new_leader_membership.role = TeamRole.LEADER
        current_leader_membership.role = TeamRole.OFFICER # Or MEMBER, depending on desired behavior
        db.add(new_leader_membership)
        db.add(current_leader_membership)

        await db.commit()
        await db.refresh(team)
        return team

    # Consider adding methods for handling invites/requests later


team = CRUDTeam(Team) 