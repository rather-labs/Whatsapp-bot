interface TimestampOptions {
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  timeZoneName?: 'long' | 'short';
}

// Utility function to format UTC timestamps in user's locale
function formatTimestamp(utcTimestamp: string | null, options: TimestampOptions = {}): string | null {
  if (!utcTimestamp) return null;
  
  try {
    const date = new Date(utcTimestamp);
    const defaultOptions: TimestampOptions = {
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
function getCurrentUTCTimestamp(): string {
  return new Date().toISOString();
}

// Check if session is expired (5 minutes)
function isSessionExpired(lastActivity: string | null): boolean {
  if (!lastActivity) return true;
  
  const lastActivityTime = new Date(lastActivity);
  const currentTime = new Date();
  const timeDifference = currentTime.getTime() - lastActivityTime.getTime();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  return timeDifference > fiveMinutes;
}

export {
  formatTimestamp,
  getCurrentUTCTimestamp,
  isSessionExpired,
  type TimestampOptions
}; 