import { UserPublic } from "./user"; // Assuming you have a user type file

export enum TeamRole {
    LEADER = "leader",
    OFFICER = "officer",
    MEMBER = "member",
    SUBSTITUTE = "substitute",
}

export enum TeamStatus {
    ACTIVE = "active",
    LOOKING_FOR_MEMBERS = "looking_for_members",
    DISBANDED = "disbanded",
    PRIVATE = "private",
}

export enum TeamVisibility {
    PUBLIC = "public",
    INVITE_ONLY = "invite_only",
}

// Base interface shared by create/update/read
export interface TeamBase {
    name: string;
    tag?: string | null;
    description?: string | null;
    logo_url?: string | null;
    banner_url?: string | null;
    status: TeamStatus;
    visibility: TeamVisibility;
}

// Interface for creating a team
export interface TeamCreate extends Omit<TeamBase, 'status' | 'visibility'> {
    // Status and visibility usually default on creation or are set explicitly
    name: string; // Make name required
    tag?: string | null;
}

// Interface for updating a team (all fields optional)
export interface TeamUpdate {
    name?: string | null;
    tag?: string | null;
    description?: string | null;
    logo_url?: string | null;
    banner_url?: string | null;
    status?: TeamStatus | null;
    visibility?: TeamVisibility | null;
}

// Interface for reading basic team data
export interface TeamRead extends TeamBase {
    id: number;
    leader_id: number;
    creation_date: string; // Dates are typically strings in JSON
}

// Interface for reading team member data
export interface TeamMemberRead {
    team_id: number;
    user_id: number;
    role: TeamRole;
    join_date: string;
    user: UserPublic; // Include public user details
}

// Interface for reading team data with leader and members included
export interface TeamReadWithMembers extends TeamRead {
    leader: UserPublic;
    members: TeamMemberRead[];
}

// Interface for adding a member (request body)
export interface TeamAddMemberPayload {
    user_id: number;
    role?: TeamRole; // Role might default on backend
}

// Interface for updating a member's role (request body)
export interface TeamMemberUpdateRolePayload {
    role: TeamRole;
}

// Interface for transferring leadership (request body)
export interface TeamTransferLeadershipPayload {
    new_leader_user_id: number;
} 