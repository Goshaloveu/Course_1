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
export type CompetitionStatus = 'upcoming' | 'registration_open' | 'registration_closed' | 'ongoing' | 'finished' | 'results_published';
export type CompetitionType = 'individual' | 'team' | 'other';

// Add CompetitionFormat enum if it's not globally available from another file
// This should mirror backend/app/models/competition.py -> CompetitionFormat
export enum CompetitionFormat {
    INDIVIDUAL = "individual",
    TEAM = "team",
}

export interface Competition {
  id: string;
  title: string;
  reg_start_at: string;
  reg_end_at: string;
  comp_start_at: string;
  comp_end_at: string;
  status: CompetitionStatus;
  type?: CompetitionType; // Make this optional for backward compatibility
  format?: CompetitionFormat; // Add format field which may come from the backend
}

// Helper function to ensure consistent competition type/format 
export const getCompetitionType = (competition: Competition): CompetitionType => {
  // If type is defined, use it
  if (competition.type) {
    return competition.type;
  }
  
  // If format is defined, map it to type
  if (competition.format) {
    if (competition.format === CompetitionFormat.INDIVIDUAL) {
      return 'individual';
    } else if (competition.format === CompetitionFormat.TEAM) {
      return 'team';
    }
  }
  
  // Default fallback
  return 'other';
};

export interface CompetitionDetail extends Competition {
  organizer_id: string;
  description: string;
  external_links_json: string;
  // Add team-specific fields that are present on the detailed model from backend
  min_team_members?: number | null;
  max_team_members?: number | null;
  roster_lock_date?: string | null; // Assuming it comes as a string date
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

// Team types
export interface Team {
  id: string;
  name: string;
  competition_id: string;
  captain_id: string;
  created_at: string;
}

export interface TeamMember {
  user_id: string;
  team_id: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface TeamRegistrationPayload {
  name: string;
  member_ids?: string[];
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