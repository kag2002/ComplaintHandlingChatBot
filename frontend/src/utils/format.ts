export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "";
  }
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return "";
  }
}

export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    const matches = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
    if (matches) {
      const [_, y, m, d, hh, mm, ss] = matches;
      return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
    }
    // Fallback if regex match fails (e.g. ISO with Z or offset)
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return '—';
  }
}
