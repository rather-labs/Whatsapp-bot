// Utility function to format UTC timestamps in user's locale
export function formatTimestamp(utcTimestamp, options = {}) {
    if (!utcTimestamp) return 'Never';
    
    try {
      const date = new Date(utcTimestamp);
      const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      };
      
      return date.toLocaleString(undefined, { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid Date';
    }
}