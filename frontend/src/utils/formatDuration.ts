/**
 * Reusable Service Duration Formatter
 * Converts minutes into human-readable hours and minutes representation.
 * Examples:
 *  - 45 minutes  -> "45 minutes"
 *  - 60 minutes  -> "1 hour"
 *  - 90 minutes  -> "1 hour 30 minutes"
 *  - 120 minutes -> "2 hours"
 *  - 150 minutes -> "2 hours 30 minutes"
 */
export function formatDuration(minutes: number | string | null | undefined): string {
  const mins = Math.max(0, parseInt(String(minutes || 0), 10));
  if (isNaN(mins) || mins === 0) {
    return '0 minutes';
  }

  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;

  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  }

  const hourText = hours === 1 ? '1 hour' : `${hours} hours`;

  if (remainingMinutes === 0) {
    return hourText;
  }

  return `${hourText} ${remainingMinutes} minutes`;
}

/**
 * Compact duration string when space is limited (e.g. "1h 30m" or "45m")
 */
export function formatDurationCompact(minutes: number | string | null | undefined): string {
  const mins = Math.max(0, parseInt(String(minutes || 0), 10));
  if (isNaN(mins) || mins === 0) return '0m';
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours === 0) return `${rem}m`;
  if (rem === 0) return `${hours}h`;
  return `${hours}h ${rem}m`;
}

