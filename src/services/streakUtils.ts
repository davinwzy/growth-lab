export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isConsecutiveWithExemptions(
  lastDateStr: string,
  nextDateStr: string,
  exemptDates: Set<string>
): boolean {
  const lastDate = parseDateKey(lastDateStr);
  const nextDate = parseDateKey(nextDateStr);
  const diffDays = Math.floor((nextDate.getTime() - lastDate.getTime()) / 86400000);
  if (diffDays <= 0) return false;
  if (diffDays === 1) return true;
  for (let i = 1; i < diffDays; i++) {
    const day = new Date(lastDate);
    day.setDate(lastDate.getDate() + i);
    const key = toDateKey(day);
    if (!exemptDates.has(key)) {
      return false;
    }
  }
  return true;
}
