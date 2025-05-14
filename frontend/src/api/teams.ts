import apiClient from "./client"; // Correct path to API client
import {
    TeamCreate,
    TeamRead,
    TeamUpdate,
    TeamReadWithMembers,
    TeamMemberRead,
    TeamAddMemberPayload,
    TeamMemberUpdateRolePayload,
    TeamTransferLeadershipPayload
} from "../types/team";

const API_BASE = "/teams"; // Base path for team endpoints

// Create a new team
export const createTeam = async (teamData: TeamCreate): Promise<TeamReadWithMembers> => {
    const response = await apiClient.post<TeamReadWithMembers>(`${API_BASE}/`, teamData);
    return response.data;
};

// Get a list of all teams (publicly visible, adjust as needed)
export const getTeams = async (skip: number = 0, limit: number = 100): Promise<TeamRead[]> => {
    const response = await apiClient.get<TeamRead[]>(`${API_BASE}/`, {
        params: { skip, limit },
    });
    return response.data;
};

// Get teams the current user is a member of
export const getMyTeams = async (): Promise<TeamReadWithMembers[]> => {
    const response = await apiClient.get<TeamReadWithMembers[]>(`${API_BASE}/my-teams`);
    return response.data;
};

// Get details for a specific team
export const getTeamDetails = async (teamId: number): Promise<TeamReadWithMembers> => {
    const response = await apiClient.get<TeamReadWithMembers>(`${API_BASE}/${teamId}`);
    return response.data;
};

// Update a team's details
export const updateTeam = async (teamId: number, teamData: TeamUpdate): Promise<TeamReadWithMembers> => {
    const response = await apiClient.put<TeamReadWithMembers>(`${API_BASE}/${teamId}`, teamData);
    return response.data;
};

// Delete a team
export const deleteTeam = async (teamId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`${API_BASE}/${teamId}`);
    return response.data;
};

// --- Team Member API Calls ---

// Add a member to a team
export const addTeamMember = async (teamId: number, memberData: TeamAddMemberPayload): Promise<TeamMemberRead> => {
    const response = await apiClient.post<TeamMemberRead>(`${API_BASE}/${teamId}/members`, memberData);
    return response.data;
};

// List members of a team
export const getTeamMembers = async (teamId: number): Promise<TeamMemberRead[]> => {
    const response = await apiClient.get<TeamMemberRead[]>(`${API_BASE}/${teamId}/members`);
    return response.data;
};

// Update a team member's role
export const updateTeamMemberRole = async (teamId: number, userId: number, roleData: TeamMemberUpdateRolePayload): Promise<TeamMemberRead> => {
    const response = await apiClient.put<TeamMemberRead>(`${API_BASE}/${teamId}/members/${userId}/role`, roleData);
    return response.data;
};

// Remove a member from a team
export const removeTeamMember = async (teamId: number, userId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`${API_BASE}/${teamId}/members/${userId}`);
    return response.data;
};

// Transfer team leadership
export const transferTeamLeadership = async (teamId: number, transferData: TeamTransferLeadershipPayload): Promise<TeamReadWithMembers> => {
    const response = await apiClient.post<TeamReadWithMembers>(`${API_BASE}/${teamId}/transfer-leadership`, transferData);
    return response.data;
};