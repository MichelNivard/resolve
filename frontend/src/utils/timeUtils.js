// Utility function to get the current time in ISO format
export const getCurrentTime = () => "2024-12-23T14:45:29+01:00";

// Utility function to check if a timestamp is within the last 30 minutes
export const isWithin30Minutes = (timestamp) => {
  const now = new Date(getCurrentTime());
  const time = new Date(timestamp);
  const diffMinutes = (now.getTime() - time.getTime()) / (1000 * 60);
  return diffMinutes <= 30;
};

// Get timestamp from 30 minutes ago
export const get30MinutesAgo = () => {
  const now = new Date(getCurrentTime());
  return new Date(now.getTime() - 30 * 60 * 1000).toISOString();
};

export const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const commentTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - commentTime) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};
