import type { GamificationSnapshot, StudentGamification } from '@/shared/types';
import { cloneGamificationSnapshot } from '@/shared/utils/gamification';

export function snapshotByStudentId(
  gamification: StudentGamification[],
  studentId: string
): GamificationSnapshot {
  const gam = gamification.find(g => g.studentId === studentId);
  if (!gam) {
    return cloneGamificationSnapshot({
      studentId,
      xp: 0,
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
  }
  return cloneGamificationSnapshot(gam);
}
