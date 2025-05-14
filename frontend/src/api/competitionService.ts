import apiClient from './client';
import { Competition, CompetitionDetail, CompetitionResult, Participant, ResultsUploadPayload, Team, TeamMember, TeamRegistrationPayload } from '@/types/api';
import { TeamRegistrationRead, TeamRegistrationCreatePayload, TeamRegistrationReadDetailed } from '../types/teamRegistration';

const API_BASE = '/competitions';

export const competitionService = {
  // Get all competitions
  getAllCompetitions: async (): Promise<Competition[]> => {
    const response = await apiClient.get<Competition[]>('/competitions');
    return response.data;
  },

  // Get competition by ID
  getCompetitionById: async (id: string): Promise<CompetitionDetail> => {
    const response = await apiClient.get<CompetitionDetail>(`${API_BASE}/${id}`);
    return response.data;
  },

  // Get competition results
  getCompetitionResults: async (id: string): Promise<CompetitionResult[]> => {
    const response = await apiClient.get<CompetitionResult[]>(`${API_BASE}/${id}/results`);
    return response.data;
  },

  // Register for a competition
  registerForCompetition: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`${API_BASE}/${id}/register`, {});
    return response.data;
  },

  // Check if user is registered for a competition
  checkRegistrationStatus: async (id: string): Promise<{ is_registered: boolean, is_organizer: boolean }> => {
    const response = await apiClient.get<{ is_registered: boolean, is_organizer: boolean }>(`${API_BASE}/${id}/registration-status`);
    return response.data;
  },

  // --- Legacy Team functionality (DEPRECATED) ---
  // These methods are kept for backward compatibility but should be replaced with new team API
  
  // Create a team for a competition (DEPRECATED)
  createTeamLegacy: async (competitionId: string, teamData: TeamRegistrationPayload): Promise<Team> => {
    const response = await apiClient.post<Team>(`${API_BASE}/${competitionId}/teams/legacy`, teamData);
    return response.data;
  },
  
  // Get all teams for a competition (DEPRECATED)
  getCompetitionTeamsLegacy: async (competitionId: string): Promise<Team[]> => {
    const response = await apiClient.get<Team[]>(`${API_BASE}/${competitionId}/teams/legacy`);
    return response.data;
  },
  
  // Get team members (DEPRECATED)
  getTeamMembersLegacy: async (teamId: string): Promise<TeamMember[]> => {
    const response = await apiClient.get<TeamMember[]>(`/teams/${teamId}/members/legacy`);
    return response.data;
  },
  
  // Add member to team (DEPRECATED)
  addTeamMemberLegacy: async (teamId: string, userId: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/teams/${teamId}/members/legacy`, { user_id: userId });
    return response.data;
  },
  
  // Remove member from team (DEPRECATED)
  removeTeamMemberLegacy: async (teamId: string, userId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/teams/${teamId}/members/legacy/${userId}`);
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
  },

  // Function to register the current user (assuming it exists)
  registerCurrentUser: async (competitionId: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`${API_BASE}/${competitionId}/register`);
    return response.data;
  },

  // Function to get results (assuming it exists)
  getResults: async (competitionId: string): Promise<CompetitionResult[]> => {
    const response = await apiClient.get<CompetitionResult[]>(`${API_BASE}/${competitionId}/results`);
    return response.data;
  },

  // Function to upload results (assuming it exists)
  uploadResults: async (competitionId: string, payload: ResultsUploadPayload): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/organizer/competitions/${competitionId}/results`, payload);
    return response.data;
  },

  // --- Team Registration API Calls ---

  // Register a team for a competition
  registerTeamForCompetition: async (competitionId: number | string, payload: TeamRegistrationCreatePayload): Promise<TeamRegistrationRead> => {
    const response = await apiClient.post<TeamRegistrationRead>(`${API_BASE}/${competitionId}/register-team`, payload);
    return response.data;
  },

  // Withdraw a team from a competition
  withdrawTeamFromCompetition: async (competitionId: number | string, teamId: number | string): Promise<TeamRegistrationRead> => {
    const response = await apiClient.delete<TeamRegistrationRead>(`${API_BASE}/${competitionId}/withdraw-team/${teamId}`);
    return response.data;
  },

  // List teams registered for a competition
  getRegisteredTeams: async (competitionId: number | string): Promise<TeamRegistrationReadDetailed[]> => {
    try {
      const response = await apiClient.get<TeamRegistrationReadDetailed[]>(`${API_BASE}/${competitionId}/teams`);
      return response.data;
    } catch (error) {
      console.error('Error fetching registered teams:', error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  },
}; 