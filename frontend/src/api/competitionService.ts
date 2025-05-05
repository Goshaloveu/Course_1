import apiClient from './client';
import { Competition, CompetitionDetail, CompetitionResult, Participant, ResultsUploadPayload, Team, TeamMember, TeamRegistrationPayload } from '@/types/api';

export const competitionService = {
  // Get all competitions
  getAllCompetitions: async (): Promise<Competition[]> => {
    const response = await apiClient.get<Competition[]>('/competitions');
    return response.data;
  },

  // Get competition by ID
  getCompetitionById: async (id: string): Promise<CompetitionDetail> => {
    const response = await apiClient.get<CompetitionDetail>(`/competitions/${id}`);
    return response.data;
  },

  // Get competition results
  getCompetitionResults: async (id: string): Promise<CompetitionResult[]> => {
    const response = await apiClient.get<CompetitionResult[]>(`/competitions/${id}/results`);
    return response.data;
  },

  // Register for a competition
  registerForCompetition: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/competitions/${id}/register`, {});
    return response.data;
  },

  // Check if user is registered for a competition
  checkRegistrationStatus: async (id: string): Promise<{ is_registered: boolean, is_organizer: boolean }> => {
    const response = await apiClient.get<{ is_registered: boolean, is_organizer: boolean }>(`/competitions/${id}/registration-status`);
    return response.data;
  },

  // --- Team functionality ---
  
  // Create a team for a competition
  createTeam: async (competitionId: string, teamData: TeamRegistrationPayload): Promise<Team> => {
    const response = await apiClient.post<Team>(`/competitions/${competitionId}/teams`, teamData);
    return response.data;
  },
  
  // Get all teams for a competition
  getCompetitionTeams: async (competitionId: string): Promise<Team[]> => {
    const response = await apiClient.get<Team[]>(`/competitions/${competitionId}/teams`);
    return response.data;
  },
  
  // Get team members
  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const response = await apiClient.get<TeamMember[]>(`/teams/${teamId}/members`);
    return response.data;
  },
  
  // Add member to team
  addTeamMember: async (teamId: string, userId: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/teams/${teamId}/members`, { user_id: userId });
    return response.data;
  },
  
  // Remove member from team
  removeTeamMember: async (teamId: string, userId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/teams/${teamId}/members/${userId}`);
    return response.data;
  },

  // --- Organizer endpoints ---

  // Get competitions created by the organizer
  getOrganizerCompetitions: async (): Promise<Competition[]> => {
    const response = await apiClient.get<Competition[]>('/organizer/competitions');
    return response.data;
  },

  // Create a new competition
  createCompetition: async (competition: Omit<CompetitionDetail, 'id' | 'organizer_id'>): Promise<CompetitionDetail> => {
    const response = await apiClient.post<CompetitionDetail>('/organizer/competitions', competition);
    return response.data;
  },

  // Update an existing competition
  updateCompetition: async (id: string, competition: Partial<CompetitionDetail>): Promise<CompetitionDetail> => {
    const response = await apiClient.put<CompetitionDetail>(`/organizer/competitions/${id}`, competition);
    return response.data;
  },

  // Get competition participants
  getCompetitionParticipants: async (id: string): Promise<Participant[]> => {
    const response = await apiClient.get<Participant[]>(`/organizer/competitions/${id}/participants`);
    return response.data;
  },

  // Upload competition results
  uploadCompetitionResults: async (id: string, results: ResultsUploadPayload): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/organizer/competitions/${id}/results`, results);
    return response.data;
  },

  // Publish competition results
  publishCompetitionResults: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/organizer/competitions/${id}/results/publish`, {});
    return response.data;
  }
}; 