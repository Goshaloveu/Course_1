import apiClient from './client';
import { Competition, CompetitionDetail, CompetitionResult, Participant, ResultsUploadPayload } from '@/types/api';

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