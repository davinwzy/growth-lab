import { describe, it, expect } from 'vitest';
import { computeScoreStreaks } from '../scoreStreaks';
import type { AttendanceExemption, HistoryRecord } from '@/shared/types';

describe('scoreStreaks', () => {
  it('bridges positive score streaks across exempt days', () => {
    const history: HistoryRecord[] = [
      {
        id: 'h1',
        classId: 'c1',
        type: 'score',
        targetType: 'student',
        targetId: 's1',
        targetName: 'A',
        itemId: 'x',
        itemName: 'x',
        value: 1,
        timestamp: new Date('2025-01-03T10:00:00').getTime(),
      },
      {
        id: 'h2',
        classId: 'c1',
        type: 'score',
        targetType: 'student',
        targetId: 's1',
        targetName: 'A',
        itemId: 'x',
        itemName: 'x',
        value: 2,
        timestamp: new Date('2025-01-05T10:00:00').getTime(),
      },
    ];
    const exemptions: AttendanceExemption[] = [
      { id: 'e1', classId: 'c1', date: '2025-01-04', createdAt: 1 },
    ];
    const result = computeScoreStreaks(history, exemptions, ['s1']);
    expect(result.s1.currentStreak).toBe(2);
    expect(result.s1.longestStreak).toBe(2);
    expect(result.s1.lastPositiveScoringDate).toBe('2025-01-05');
  });
});
