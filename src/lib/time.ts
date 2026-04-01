const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;

  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m}m ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h}h ago`;
  }
  if (diff < DAY * 7) {
    const d = Math.floor(diff / DAY);
    return `${d}d ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}
