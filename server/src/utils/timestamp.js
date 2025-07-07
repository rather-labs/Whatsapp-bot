// Utility function to format UTC timestamps in user's locale
function formatTimestamp(utcTimestamp, options = {}) {
  if (!utcTimestamp) return null;
  
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
    return null;
  }
}

// Get current UTC timestamp
function getCurrentUTCTimestamp() {
  return new Date().toISOString();
}

// Check if session is expired (5 minutes)
function isSessionExpired(lastActivity) {
  if (!lastActivity) return true;
  
  const lastActivityTime = new Date(lastActivity);
  const currentTime = new Date();
  const timeDifference = currentTime - lastActivityTime;
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  return timeDifference > fiveMinutes;
}

module.exports = {
  formatTimestamp,
  getCurrentUTCTimestamp,
  isSessionExpired
}; 