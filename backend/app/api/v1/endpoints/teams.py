# app/api/v1/endpoints/teams.py
from typing import List, Any

from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlmodel.ext.asyncio.session import AsyncSession

from app import crud
from app.models import User, Team, TeamMember, TeamRole
from app.schemas.team import (
    TeamCreate, TeamRead, TeamUpdate, TeamReadWithMembers,
    TeamMemberRead, TeamAddMember, TeamMemberUpdateRole, TeamTransferLeadership
)
from app.schemas.message import Message
from app.api import deps

router = APIRouter()

# --- Team Endpoints ---

@router.post("/", response_model=TeamReadWithMembers, status_code=status.HTTP_201_CREATED)
async def create_team(
    *, 
    session: AsyncSession = Depends(deps.get_async_session),
    team_in: TeamCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """ Creates a new team. The creator becomes the leader. """
    existing_team = await crud.team.get_by_name(session, name=team_in.name)
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team with this name already exists.",
        )
    
    # Optional: Check if user already leads a team
    # led_teams = await crud.team.get_teams_led_by_user(session, user_id=current_user.id)
    # if led_teams:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="You are already leading another team.",
    #     )

    team = await crud.team.create_with_leader(session, obj_in=team_in, leader=current_user)
    # Fetch the team again with details to include leader and members in the response
    team_details = await crud.team.get_with_details(session, id=team.id)
    return team_details

@router.get("/", response_model=List[TeamRead])
async def read_teams(
    session: AsyncSession = Depends(deps.get_async_session),
    skip: int = 0,
    limit: int = 100,
    # current_user: User = Depends(deps.get_current_active_user), # Add if needed
) -> Any:
    """ Retrieve all teams (consider pagination and filtering). """
    teams = await crud.team.get_multi(session, skip=skip, limit=limit)
    return teams

@router.get("/my-teams", response_model=List[TeamReadWithMembers])
async def read_my_teams(
    session: AsyncSession = Depends(deps.get_async_session),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """ Retrieve teams the current user is a member of. """
    teams = await crud.team.get_teams_for_user(session, user_id=current_user.id)
    return teams

@router.get("/{team_id}", response_model=TeamReadWithMembers)
async def read_team(
    team_id: int = Path(...),
    session: AsyncSession = Depends(deps.get_async_session),
    # current_user: User = Depends(deps.get_current_active_user), # Add if visibility checks needed
) -> Any:
    """ Retrieve a specific team by ID with its members. """
    team = await crud.team.get_with_details(session, id=team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    # Add visibility checks here if needed based on team.visibility and current_user
    return team

@router.put("/{team_id}", response_model=TeamReadWithMembers)
async def update_team(
    team_id: int = Path(...),
    team_in: TeamUpdate = Body(...),
    session: AsyncSession = Depends(deps.get_async_session),
    current_user: User = Depends(deps.get_current_active_user), # Need leader check
) -> Any:
    """ Update team details (only leader or maybe officers). """
    team = await crud.team.get_with_details(session, id=team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    
    # Check permissions (is user the leader?)
    if team.leader_id != current_user.id:
        # Allow officers later? Check member role
        # member = await crud.team.get_member(session, team_id=team_id, user_id=current_user.id)
        # if not member or member.role not in [TeamRole.LEADER, TeamRole.OFFICER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this team."
        )

    # Check for name uniqueness if name is being changed
    if team_in.name and team_in.name != team.name:
        existing_team = await crud.team.get_by_name(session, name=team_in.name)
        if existing_team and existing_team.id != team_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A team with this name already exists.",
            )

    updated_team = await crud.team.update(session, db_obj=team, obj_in=team_in)
    # Re-fetch with details
    team_details = await crud.team.get_with_details(session, id=updated_team.id)
    return team_details

@router.delete("/{team_id}", response_model=Message)
async def delete_team(
    team_id: int = Path(...),
    session: AsyncSession = Depends(deps.get_async_session),
    current_user: User = Depends(deps.get_current_active_user), # Only leader
) -> Any:
    """ Delete a team (only leader). Consider implications (registrations, etc.). """
    team = await crud.team.get(session, id=team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team leader can delete the team."
        )

    # TODO: Add checks - cannot delete if registered for active competitions?
    # Or handle cascading deletes / setting team status to disbanded?

    await crud.team.remove(session, id=team_id) # This needs refinement - delete members first?
    return Message(message="Team deleted successfully")


# --- Team Member Endpoints ---

@router.post("/{team_id}/members", response_model=TeamMemberRead)
async def add_team_member(
    team_id: int = Path(...),
    member_in: TeamAddMember = Body(...),
    session: AsyncSession = Depends(deps.get_async_session),
    current_user: User = Depends(deps.get_current_active_user), # Leader/Officer check
) -> Any:
    """ Add a member to a team (requires Leader/Officer permissions). Simplified: directly adds. """
    team = await crud.team.get(session, id=team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    # Permission Check (Leader or Officer)
    requesting_member = await crud.team.get_member(session, team_id=team_id, user_id=current_user.id)
    if not requesting_member or requesting_member.role not in [TeamRole.LEADER, TeamRole.OFFICER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Leaders or Officers can add members."
        )
    
    # Get user to add
    user_to_add = await crud.user.get(session, id=member_in.user_id)
    if not user_to_add:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User to add not found")
    
    # Check if user is already a member
    existing_member = await crud.team.get_member(session, team_id=team_id, user_id=user_to_add.id)
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this team."
        )
        
    # Ensure added role is not Leader unless transferring leadership explicitly
    if member_in.role == TeamRole.LEADER:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot directly add a member with the Leader role. Use transfer leadership endpoint."
        )

    new_member = await crud.team.add_member(session, team=team, user=user_to_add, role=member_in.role)
    # Need to fetch the user details for the response model
    member_read = TeamMemberRead.model_validate(new_member) # Use model_validate in Pydantic v2
    member_read.user = await crud.user.get_public_user_info(session, user_id=new_member.user_id)
    return member_read

@router.get("/{team_id}/members", response_model=List[TeamMemberRead])
async def list_team_members(
    team_id: int = Path(...),
    session: AsyncSession = Depends(deps.get_async_session),
    # current_user: User = Depends(deps.get_current_active_user), # Add if visibility needed
) -> Any:
    """ List members of a specific team. """
    team = await crud.team.get_with_details(session, id=team_id) # Use get_with_details to eager load members
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    # Convert TeamMember to TeamMemberRead, ensuring user details are included
    members_read = []
    for member in team.members:
         member_read = TeamMemberRead.model_validate(member) # Use model_validate in Pydantic v2
         # User details should be loaded by get_with_details' eager loading
         member_read.user = member.user # Assuming user object is loaded 
         members_read.append(member_read)

    return members_read

@router.put("/{team_id}/members/{user_id}/role", response_model=TeamMemberRead)
async def update_member_role(
    team_id: int = Path(...),
    user_id: int = Path(...),
    role_in: TeamMemberUpdateRole = Body(...),
    session: AsyncSession = Depends(deps.get_async_session),
    current_user: User = Depends(deps.get_current_active_user), # Leader/Officer check
) -> Any:
    """ Update the role of a team member (Leader/Officer only). """
    team = await crud.team.get(session, id=team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    # Permission Check (Leader or Officer)
    requesting_member = await crud.team.get_member(session, team_id=team_id, user_id=current_user.id)
    if not requesting_member or requesting_member.role not in [TeamRole.LEADER, TeamRole.OFFICER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Leaders or Officers can change member roles."
        )
        
    # Prevent changing Leader role directly here
    if role_in.role == TeamRole.LEADER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot set role to Leader via this endpoint. Use transfer leadership."
        )

    member_to_update = await crud.team.get_member(session, team_id=team_id, user_id=user_id)
    if not member_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
        
    # Prevent leader role from being changed by officers
    if member_to_update.role == TeamRole.LEADER and requesting_member.role != TeamRole.LEADER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Officers cannot change the Leader's role."
        )
        
    # Prevent changing own role if leader (must transfer leadership)
    if member_to_update.user_id == current_user.id and member_to_update.role == TeamRole.LEADER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leader cannot change their own role. Use transfer leadership."
        )

    updated_member = await crud.team.update_member_role(session, member=member_to_update, role_in=role_in)
    member_read = TeamMemberRead.model_validate(updated_member)
    member_read.user = await crud.user.get_public_user_info(session, user_id=updated_member.user_id)
    return member_read

@router.delete("/{team_id}/members/{user_id}", response_model=Message)
async def remove_team_member(
    team_id: int = Path(...),
    user_id: int = Path(...),
    session: AsyncSession = Depends(deps.get_async_session),
    current_user: User = Depends(deps.get_current_active_user), # Leader/Officer check or self-remove
) -> Any:
    """ Remove a member from a team (Leader/Officer) or allow self-removal. """
    team = await crud.team.get(session, id=team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    member_to_remove = await crud.team.get_member(session, team_id=team_id, user_id=user_id)
    if not member_to_remove:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")

    # Check permissions
    is_self_removal = current_user.id == user_id
    requesting_member = await crud.team.get_member(session, team_id=team_id, user_id=current_user.id)
    can_remove = False

    if is_self_removal:
        # Cannot remove self if Leader (must transfer first)
        if member_to_remove.role == TeamRole.LEADER:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Leader cannot leave the team. Transfer leadership first."
            )
        can_remove = True
    elif requesting_member and requesting_member.role in [TeamRole.LEADER, TeamRole.OFFICER]:
        # Leader/Officer can remove others, but not the leader unless they are the leader
        if member_to_remove.role == TeamRole.LEADER and requesting_member.role != TeamRole.LEADER:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Officers cannot remove the Leader."
            )
        # Leader cannot be removed by this endpoint even by themselves (handled above)
        if member_to_remove.role != TeamRole.LEADER:
             can_remove = True

    if not can_remove:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to remove this member."
        )

    await crud.team.remove_member(session, member=member_to_remove)
    return Message(message="Team member removed successfully")

@router.post("/{team_id}/transfer-leadership", response_model=TeamReadWithMembers)
async def transfer_team_leadership(
    team_id: int = Path(...),
    transfer_in: TeamTransferLeadership = Body(...),
    session: AsyncSession = Depends(deps.get_async_session),
    current_user: User = Depends(deps.get_current_active_user), # Must be current leader
) -> Any:
    """ Transfer team leadership to another member. """
    team = await crud.team.get(session, id=team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the current team leader can transfer leadership."
        )

    new_leader_user = await crud.user.get(session, id=transfer_in.new_leader_user_id)
    if not new_leader_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="New leader user not found")

    try:
        updated_team = await crud.team.transfer_leadership(
            session, team=team, current_leader=current_user, new_leader=new_leader_user
        )
        # Re-fetch with details
        team_details = await crud.team.get_with_details(session, id=updated_team.id)
        return team_details
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) 