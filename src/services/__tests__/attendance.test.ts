import { describe, it, expect } from 'vitest';
import { getAttendanceForDate, getPresentStudentIds, getUnmarkedStudentIds, getAttendanceRecordForStudent } from '../attendance';
import type { AttendanceRecord, Student } from '@/shared/types';

describe('attendance service', () => {
  const records: AttendanceRecord[] = [
    { id: 'a1', classId: 'c1', studentId: 's1', date: '2025-01-02', status: 'present', timestamp: 1 },
    { id: 'a2', classId: 'c1', studentId: 's2', date: '2025-01-02', status: 'late', timestamp: 2 },
    { id: 'a3', classId: 'c1', studentId: 's3', date: '2025-01-03', status: 'present', timestamp: 3 },
  ];

  it('filters by date', () => {
    expect(getAttendanceForDate(records, '2025-01-02').length).toBe(2);
  });

  it('collects present student ids only', () => {
    const present = getPresentStudentIds(records);
    expect(Array.from(present)).toEqual(['s1', 's3']);
  });

  it('finds unmarked students', () => {
    const students: Student[] = [
      { id: 's1', classId: 'c1', groupId: 'g1', name: 'A', score: 0, createdAt: 1 },
      { id: 's2', classId: 'c1', groupId: 'g1', name: 'B', score: 0, createdAt: 1 },
      { id: 's3', classId: 'c1', groupId: 'g1', name: 'C', score: 0, createdAt: 1 },
    ];
    const present = new Set(['s1']);
    expect(getUnmarkedStudentIds(students, present)).toEqual(['s2', 's3']);
  });

  it('finds a present record for a student', () => {
    expect(getAttendanceRecordForStudent(records, 's1', '2025-01-02')?.id).toBe('a1');
    expect(getAttendanceRecordForStudent(records, 's2', '2025-01-02')).toBeUndefined();
  });
});
