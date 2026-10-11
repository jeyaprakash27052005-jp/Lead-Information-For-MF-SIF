const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Date + time of a stored record, e.g. "11 Oct 2026, 3:42 PM" (device local time). Shows "—" when missing or invalid. */
export const formatDateTime = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const date = `${`${d.getDate()}`.padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  // Older records may carry only a date (no time part)
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) return date;
  const h = d.getHours();
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minutes = `${d.getMinutes()}`.padStart(2, '0');
  return `${date}, ${hour12}:${minutes} ${h < 12 ? 'AM' : 'PM'}`;
};
