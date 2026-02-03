import { describe, it, expect } from 'vitest';
import { computeAttendanceStreaks } from '../attendanceStreaks';
import type { AttendanceExemption, AttendanceRecord } from '@/shared/types';

describe('attendanceStreaks', () => {
  it('bridges streaks across exempt days', () => {
    const records: AttendanceRecord[] = [
      { id: 'a1', classId: 'c1', studentId: 's1', date: '2025-01-03', status: 'present', timestamp: 1 },
      { id: 'a2', classId: 'c1', studentId: 's1', date: '2025-01-05', status: 'present', timestamp: 2 },
    ];
    const exemptions: AttendanceExemption[] = [
      { id: 'e1', classId: 'c1', date: '2025-01-04', createdAt: 1 },
    ];
    const result = computeAttendanceStreaks(records, exemptions, ['s1']);
    expect(result.s1.attendanceStreak).toBe(2);
    expect(result.s1.longestAttendanceStreak).toBe(2);
    expect(result.s1.lastAttendanceDate).toBe('2025-01-05');
  });
});
