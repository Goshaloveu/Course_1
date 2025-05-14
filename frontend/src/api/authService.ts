import apiClient from './client';
import { AuthResponse, User } from '@/types/api';

export const authService = {
  // Handle Telegram OAuth callback
  telegramCallback: async (telegramData: any): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/telegram/callback', telegramData);
    return response.data;
  },

  // Handle Telegram Bot auth token
  telegramBotAuth: async (authToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/telegram-bot', { auth_token: authToken });
    return response.data;
  },

  // Get current user information
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  // Check if user is an organizer
  isOrganizer: async (): Promise<boolean> => {
    try {
      const user = await authService.getCurrentUser();
      return user.is_organizer;
    } catch (error) {
      return false;
    }
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('access_token');
  }
}; 