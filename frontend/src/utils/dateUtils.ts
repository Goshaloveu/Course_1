/**
 * Format a date string into a localized Russian format
 * @param dateString - ISO date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    return new Intl.DateTimeFormat('ru', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Check if a date is in the past
 * @param dateString - ISO date string to check
 * @returns Boolean indicating if the date is in the past
 */
export const isDateInPast = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  } catch (error) {
    console.error('Error checking date:', error);
    return false;
  }
};

/**
 * Check if a date is in the future
 * @param dateString - ISO date string to check
 * @returns Boolean indicating if the date is in the future
 */
export const isDateInFuture = (dateString: string): boolean => {
  return !isDateInPast(dateString);
};

/**
 * Check if current date is between two dates
 * @param startDateString - ISO start date string
 * @param endDateString - ISO end date string
 * @returns Boolean indicating if current date is between the start and end dates
 */
export const isDateBetween = (startDateString: string, endDateString: string): boolean => {
  try {
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    const now = new Date();
    return startDate <= now && now <= endDate;
  } catch (error) {
    console.error('Error checking date range:', error);
    return false;
  }
};

/**
 * Format a date string for input fields (YYYY-MM-DDThh:mm)
 * @param dateString - ISO date string to format
 * @returns Formatted date string for datetime-local input
 */
export const formatDateForInput = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
}; 