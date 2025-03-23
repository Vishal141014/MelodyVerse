/**
 * Format a timestamp to a human-readable format
 * @param timestamp ISO string timestamp
 * @returns Formatted time string (e.g., "10:30 AM" or "Yesterday at 2:45 PM" or "May 12")
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Format time
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  };
  const timeStr = date.toLocaleTimeString(undefined, timeOptions);
  
  // Today (just time)
  if (diffDays === 0 && date.getDate() === now.getDate()) {
    return timeStr;
  }
  
  // Yesterday
  if (diffDays === 1 || (diffDays === 0 && date.getDate() !== now.getDate())) {
    return `Yesterday at ${timeStr}`;
  }
  
  // Within a week
  if (diffDays < 7) {
    const dayOptions: Intl.DateTimeFormatOptions = { weekday: 'short' };
    const dayStr = date.toLocaleDateString(undefined, dayOptions);
    return `${dayStr} at ${timeStr}`;
  }
  
  // Older than a week
  const dateOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
  };
  const dateStr = date.toLocaleDateString(undefined, dateOptions);
  return dateStr;
};

/**
 * Format a duration in seconds to a human-readable format
 * @param seconds Duration in seconds
 * @returns Formatted duration string (e.g., "3:45" or "1:23:45")
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format a number for display (e.g., 1000 -> 1K)
 * @param num Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Generate a user initials from username
 * @param username Username string
 * @returns One or two character initials
 */
export const getUserInitials = (username: string): string => {
  if (!username) return '?';
  
  const parts = username.trim().split(/\s+/);
  if (parts.length === 1) {
    return username.charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}; 