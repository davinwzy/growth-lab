import type { AttendanceRecord, AttendanceExemption } from '@/shared/types';
import { isConsecutiveWithExemptions } from '@/services/streakUtils';

export interface AttendanceStreakSummary {
  attendanceStreak: number;
  longestAttendanceStreak: number;
  lastAttendanceDate: string | null;
}

export function computeAttendanceStreaks(
  records: AttendanceRecord[],
  exemptions: AttendanceExemption[],
  studentIds: string[]
): Record<string, AttendanceStreakSummary> {
  const exemptSet = new Set(exemptions.map(e => e.date));
  const byStudent: Record<string, string[]> = {};
  for (const id of studentIds) byStudent[id] = [];

  records.forEach(r => {
    if (r.status !== 'present') return;
    if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
    byStudent[r.studentId].push(r.date);
  });

  const result: Record<string, AttendanceStreakSummary> = {};
  for (const studentId of Object.keys(byStudent)) {
    const dates = Array.from(new Set(byStudent[studentId])).sort();
    if (dates.length === 0) {
      result[studentId] = {
        attendanceStreak: 0,
        longestAttendanceStreak: 0,
        lastAttendanceDate: null,
      };
      continue;
    }
    let current = 1;
    let longest = 1;
    for (let i = 1; i < dates.length; i++) {
      if (isConsecutiveWithExemptions(dates[i - 1], dates[i], exemptSet)) {
        current += 1;
      } else {
        current = 1;
      }
      if (current > longest) longest = current;
    }
    result[studentId] = {
      attendanceStreak: current,
      longestAttendanceStreak: longest,
      lastAttendanceDate: dates[dates.length - 1],
    };
  }

  return result;
}
