import type { AttendanceExemption, HistoryRecord } from '@/shared/types';
import { isConsecutiveWithExemptions } from '@/services/streakUtils';

export interface ScoreStreakSummary {
  currentStreak: number;
  longestStreak: number;
  lastPositiveScoringDate: string | null;
}

export function computeScoreStreaks(
  history: HistoryRecord[],
  exemptions: AttendanceExemption[],
  studentIds: string[]
): Record<string, ScoreStreakSummary> {
  const exemptSet = new Set(exemptions.map(e => e.date));
  const byStudent: Record<string, string[]> = {};
  for (const id of studentIds) byStudent[id] = [];

  history.forEach(h => {
    if (h.type !== 'score') return;
    if (h.targetType !== 'student') return;
    if (h.value <= 0) return;
    if (!byStudent[h.targetId]) byStudent[h.targetId] = [];
    const date = new Date(h.timestamp);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    byStudent[h.targetId].push(key);
  });

  const result: Record<string, ScoreStreakSummary> = {};
  for (const studentId of Object.keys(byStudent)) {
    const dates = Array.from(new Set(byStudent[studentId])).sort();
    if (dates.length === 0) {
      result[studentId] = {
        currentStreak: 0,
        longestStreak: 0,
        lastPositiveScoringDate: null,
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
      currentStreak: current,
      longestStreak: longest,
      lastPositiveScoringDate: dates[dates.length - 1],
    };
  }

  return result;
}
