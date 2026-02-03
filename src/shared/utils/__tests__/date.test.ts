import { describe, it, expect } from 'vitest';
import { formatDateKey, startOfLocalDay } from '../date';

describe('date utils', () => {
  it('formats local date key', () => {
    const d = new Date(2025, 0, 2);
    expect(formatDateKey(d)).toBe('2025-01-02');
  });

  it('returns start of local day', () => {
    const d = new Date(2025, 0, 2, 15, 30, 10);
    const start = startOfLocalDay(d);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });
});
