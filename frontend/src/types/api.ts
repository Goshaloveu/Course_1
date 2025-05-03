// User types
export interface User {
  id: string;
  telegram_id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  is_organizer: boolean;
  created_at: string;
  updated_at: string;
}

// Competition types
export type CompetitionStatus = 'upcoming' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'results_published';
export type CompetitionType = 'individual' | 'team' | 'other';

export interface Competition {
  id: string;
  title: string;
  reg_start_at: string;
  reg_end_at: string;
  comp_start_at: string;
  comp_end_at: string;
  status: CompetitionStatus;
  type: CompetitionType;
}

export interface CompetitionDetail extends Competition {
  organizer_id: string;
  description: string;
  external_links_json: string;
}

// Result types
export interface CompetitionResult {
  user_id: string;
  result_value: string;
  rank: number;
  username: string;
  first_name: string;
  last_name: string;
}

// Auth types
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Participant type
export interface Participant {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Result upload type
export interface ResultUpload {
  user_identifier: string;
  result_value: string;
  rank: number;
}

export interface ResultsUploadPayload {
  results: ResultUpload[];
} 