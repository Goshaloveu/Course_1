import { UserPublic } from "./user";
import { TeamRegistrationReadDetailed } from "./teamRegistration"; // Import needed for detailed view

// Matches backend CompetitionStatusEnum
export enum CompetitionStatus {
    UPCOMING = 'upcoming',
    REGISTRATION_OPEN = 'registration_open',
    REGISTRATION_CLOSED = 'registration_closed',
    ONGOING = 'ongoing',
    FINISHED = 'finished',
    RESULTS_PUBLISHED = 'results_published',
}

// Matches backend CompetitionFormat
export enum CompetitionFormat {
    INDIVIDUAL = "individual",
    TEAM = "team",
}

// Base interface for competition data
export interface CompetitionBase {
    title: string;
    description?: string | null;
    type?: string | null;
    reg_start_at?: string | null; // Dates as strings
    reg_end_at?: string | null;
    comp_start_at?: string | null;
    comp_end_at?: string | null;
    status: CompetitionStatus;
    external_links_json?: string | null; // Raw JSON string
    external_links?: Record<string, string>; // Parsed links (add in frontend if needed)
    format: CompetitionFormat; // Added format
    min_team_members?: number | null;
    max_team_members?: number | null;
    roster_lock_date?: string | null;
}

// Interface for reading competition data (public view)
export interface CompetitionPublic extends CompetitionBase {
    id: number;
    // Maybe organizer basic info if needed
}

// Interface for reading competition data with owner details
export interface CompetitionReadWithOwner extends CompetitionBase {
    id: number;
    organizer_id: number;
    created_at: string;
    updated_at: string;
    organizer?: UserPublic | null;
}

// Interface for detailed competition view, potentially including registrations/results
// Adapt based on what data you actually fetch and display together
export interface CompetitionReadDetailed extends CompetitionReadWithOwner {
    // Example: Add team registrations if fetched together
    team_registrations?: TeamRegistrationReadDetailed[];
    // Example: Add individual registrations if needed
    // registrations?: IndividualRegistrationRead[]; 
    // Example: Add results if needed
    // results?: ResultReadWithUser[];
}

// Interface for creating a competition (adjust based on required fields)
export interface CompetitionCreate extends Omit<CompetitionBase, 'status' | 'external_links'> {
    title: string; // Ensure required fields are not optional
    format: CompetitionFormat;
    // Add other required fields
}

// Interface for updating a competition (all fields optional)
export interface CompetitionUpdate {
    title?: string | null;
    description?: string | null;
    type?: string | null;
    reg_start_at?: string | null;
    reg_end_at?: string | null;
    comp_start_at?: string | null;
    comp_end_at?: string | null;
    status?: CompetitionStatus | null;
    external_links_json?: string | null;
    format?: CompetitionFormat | null;
    min_team_members?: number | null;
    max_team_members?: number | null;
    roster_lock_date?: string | null;
} 