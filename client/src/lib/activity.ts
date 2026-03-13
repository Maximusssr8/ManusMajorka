export interface ActivityEntry {
  type: 'tool_opened' | 'product_imported' | 'launch_kit_completed' | 'output_saved';
  label: string;
  timestamp: number;
  metadata?: Record<string, string>;
}

const KEY = 'majorka_activity_log';
const MAX_ENTRIES = 50;

export function logActivity(entry: Omit<ActivityEntry, 'timestamp'>): void {
  try {
    const existing: ActivityEntry[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    const updated = [{ ...entry, timestamp: Date.now() }, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}

export function getActivityLog(): ActivityEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
