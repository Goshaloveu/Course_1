import { TeamRead } from "./team";
// Potentially import a simplified Competition view if needed
// import { CompetitionPublic } from "./competition"; 

// Matches backend TeamRegistrationStatus
export enum TeamRegistrationStatus {
    REGISTERED = "registered",
    WAITLISTED = "waitlisted",
    WITHDRAWN = "withdrawn",
    DISQUALIFIED = "disqualified",
    CHECKED_IN = "checked_in",
}

// Interface for creating a team registration (request body)
// Usually only team_id is needed in the body if competition_id is from URL
export interface TeamRegistrationCreatePayload {
    team: { id: number }; // Match the expected backend structure
}

// Interface for updating a team registration (request body)
export interface TeamRegistrationUpdatePayload {
    status?: TeamRegistrationStatus | null;
}

// Interface for reading basic team registration data
export interface TeamRegistrationRead {
    id: number;
    team_id: number;
    competition_id: number;
    registration_date: string; // Date as string
    status: TeamRegistrationStatus;
}

// Interface for reading team registration data with full team details included
export interface TeamRegistrationReadDetailed extends TeamRegistrationRead {
    team: TeamRead; // Include the full TeamRead object
    // Optionally include competition details if needed and fetched
    // competition?: CompetitionPublic;
} 