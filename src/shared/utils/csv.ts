export function escapeCsvValue(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const needsQuotes = /[",\n\r]/.test(raw);
  const escaped = raw.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function toCsvRow(values: Array<string | number | null | undefined>): string {
  return values.map(escapeCsvValue).join(',');
}
