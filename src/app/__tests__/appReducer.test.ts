import { describe, it, expect } from 'vitest';
import { appReducer, initialState } from '@/app/AppProvider';
import type { AppState, HistoryRecord, StudentGamification, AttendanceRecord } from '@/shared/types';

const baseGam = (studentId: string, xp = 0): StudentGamification => ({
  studentId,
  xp,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastPositiveScoringDate: null,
  unlockedBadgeIds: [],
  badgeUnlockedAt: {},
  totalPositiveScores: 0,
  scoreItemCounts: {},
  perfectQuizCount: 0,
  helpingOthersCount: 0,
  rewardRedeemedCount: 0,
  attendanceDays: 0,
  lastAttendanceDate: null,
  attendanceStreak: 0,
  longestAttendanceStreak: 0,
});

describe('appReducer UNDO_HISTORY', () => {
  it('restores group reward per-student scores and gamification snapshots', () => {
    const record: HistoryRecord = {
      id: 'h1',
      classId: 'c1',
      type: 'reward',
      targetType: 'group',
      targetId: 'g1',
      targetName: 'G1',
      itemId: 'reward1',
      itemName: 'Reward',
      value: -3,
      timestamp: 1,
      perStudentDeltas: [
        { studentId: 's1', delta: -2, gamificationSnapshot: baseGam('s1', 10) },
        { studentId: 's2', delta: -1, gamificationSnapshot: baseGam('s2', 8) },
      ],
    };

    const state: AppState = {
      ...initialState,
      students: [
        { id: 's1', classId: 'c1', groupId: 'g1', name: 'A', score: 3, createdAt: 1 },
        { id: 's2', classId: 'c1', groupId: 'g1', name: 'B', score: 2, createdAt: 1 },
      ],
      gamification: [
        baseGam('s1', 5),
        baseGam('s2', 4),
      ],
      history: [record],
    };

    const next = appReducer(state, { type: 'UNDO_HISTORY', payload: 'h1' });
    const s1 = next.students.find(s => s.id === 's1')!;
    const s2 = next.students.find(s => s.id === 's2')!;
    expect(s1.score).toBe(5);
    expect(s2.score).toBe(3);
    const g1 = next.gamification.find(g => g.studentId === 's1')!;
    const g2 = next.gamification.find(g => g.studentId === 's2')!;
    expect(g1.xp).toBe(10);
    expect(g2.xp).toBe(8);
  });

  it('undoes attendance add/remove based on history meta', () => {
    const attendanceMeta: AttendanceRecord = {
      id: 'a1',
      classId: 'c1',
      studentId: 's1',
      date: '2025-01-02',
      status: 'present',
      timestamp: 1,
    };

    const addRecord: HistoryRecord = {
      id: 'h2',
      classId: 'c1',
      type: 'score',
      targetType: 'student',
      targetId: 's1',
      targetName: 'A',
      itemId: 'attendance',
      itemName: 'Attendance',
      value: 1,
      timestamp: 1,
      attendanceMeta,
    };

    const revokeRecord: HistoryRecord = {
      id: 'h3',
      classId: 'c1',
      type: 'score',
      targetType: 'student',
      targetId: 's1',
      targetName: 'A',
      itemId: 'attendance_revoke',
      itemName: 'Revoke Attendance',
      value: -1,
      timestamp: 1,
      attendanceMeta,
    };

    const baseState: AppState = {
      ...initialState,
      students: [{ id: 's1', classId: 'c1', groupId: 'g1', name: 'A', score: 1, createdAt: 1 }],
      attendanceRecords: [attendanceMeta],
      history: [addRecord, revokeRecord],
    };

    const afterUndoAdd = appReducer(baseState, { type: 'UNDO_HISTORY', payload: 'h2' });
    expect(afterUndoAdd.attendanceRecords.find(r => r.id === 'a1')).toBeUndefined();

    const stateWithoutAttendance: AppState = {
      ...baseState,
      attendanceRecords: [],
    };
    const afterUndoRevoke = appReducer(stateWithoutAttendance, { type: 'UNDO_HISTORY', payload: 'h3' });
    expect(afterUndoRevoke.attendanceRecords.find(r => r.id === 'a1')).toBeTruthy();
  });

  it('restores group settlement effects on scores and group totals', () => {
    const record: HistoryRecord = {
      id: 'h4',
      classId: 'c1',
      type: 'score',
      targetType: 'group',
      targetId: 'g1',
      targetName: 'G1',
      itemId: 'settlement',
      itemName: 'Group Settlement',
      value: 5,
      timestamp: 1,
      groupScoreBefore: 20,
      perStudentDeltas: [
        { studentId: 's1', delta: 5, gamificationSnapshot: baseGam('s1', 10) },
      ],
    };

    const state: AppState = {
      ...initialState,
      groups: [{ id: 'g1', classId: 'c1', name: 'G1', color: '#000', order: 1, score: 0 }],
      students: [{ id: 's1', classId: 'c1', groupId: 'g1', name: 'A', score: 10, createdAt: 1 }],
      gamification: [baseGam('s1', 2)],
      history: [record],
    };

    const next = appReducer(state, { type: 'UNDO_HISTORY', payload: 'h4' });
    expect(next.groups[0].score).toBe(20);
    expect(next.students[0].score).toBe(5);
    expect(next.gamification.find(g => g.studentId === 's1')?.xp).toBe(10);
  });
});
