export const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "N/A";
  }

  const seconds = Math.floor((now - date) / 1000);

  // Less than 1 minute
  if (seconds < 60) return `${seconds}s`;

  // Less than 1 hour
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;

  // Less than 24 hours -> show relative hours
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;

  // 24 hours or more -> show exact date (month day), include year if > 1 year
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  const oneYearInSeconds = 31536000;
  if (seconds >= oneYearInSeconds) {
    return `${month} ${day} ${year}`;
  }

  return `${month} ${day}`;
};