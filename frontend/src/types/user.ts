/**
 * Represents public information about a user.
 */
export interface UserPublic {
    id: number;
    username?: string | null;
    first_name?: string | null;
    // Include other fields that are considered public, e.g., avatar_url
    avatar_url?: string | null; 
}

/**
 * Represents the currently logged-in user's full details (adjust as needed).
 */
export interface CurrentUser extends UserPublic { // Example: extends UserPublic
    telegram_id: number;
    last_name?: string | null;
    is_organizer: boolean;
    is_active: boolean;
    // Add any other fields relevant to the logged-in user
    // e.g., email, registration_date, etc., if available from your /users/me endpoint
} 