import type { LevelDefinition, StudentGamification, GamificationSnapshot } from '@/shared/types';
import { formatDateKey } from './date';

// RPG Level definitions
export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, name: '初心者', nameEn: 'Novice',      emoji: '🌱', xpRequired: 0 },
  { level: 2, name: '学徒',   nameEn: 'Apprentice',  emoji: '📖', xpRequired: 50 },
  { level: 3, name: '战士',   nameEn: 'Warrior',     emoji: '⚔️', xpRequired: 150 },
  { level: 4, name: '骑士',   nameEn: 'Knight',      emoji: '🛡️', xpRequired: 350 },
  { level: 5, name: '大师',   nameEn: 'Master',      emoji: '🏆', xpRequired: 700 },
  { level: 6, name: '传说',   nameEn: 'Legend',       emoji: '👑', xpRequired: 1200 },
];

export function getLevelForXp(xp: number): LevelDefinition {
  for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_DEFINITIONS[i].xpRequired) return LEVEL_DEFINITIONS[i];
  }
  return LEVEL_DEFINITIONS[0];
}

export function getXpProgress(xp: number): { current: number; needed: number; percent: number } {
  const currentLevel = getLevelForXp(xp);
  const nextLevel = LEVEL_DEFINITIONS.find(l => l.level === currentLevel.level + 1);
  if (!nextLevel) return { current: 0, needed: 0, percent: 100 };
  const current = xp - currentLevel.xpRequired;
  const needed = nextLevel.xpRequired - currentLevel.xpRequired;
  return { current, needed, percent: Math.min(100, (current / needed) * 100) };
}

function getTodayStr(): string {
  return formatDateKey(new Date());
}

function isConsecutiveWithExemptions(
  lastDateStr: string,
  todayStr: string,
  exemptDates: Set<string>
): boolean {
  const [y1, m1, d1] = lastDateStr.split('-').map(Number);
  const [y2, m2, d2] = todayStr.split('-').map(Number);
  const lastDate = new Date(y1, (m1 || 1) - 1, d1 || 1);
  const todayDate = new Date(y2, (m2 || 1) - 1, d2 || 1);
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
  if (diffDays <= 0) return false;
  if (diffDays === 1) return true;
  for (let i = 1; i < diffDays; i++) {
    const day = new Date(lastDate);
    day.setDate(lastDate.getDate() + i);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    if (!exemptDates.has(key)) return false;
  }
  return true;
}

export function updateStreak(
  gamData: StudentGamification,
  todayStr?: string,
  exemptDates?: Set<string>
): StudentGamification {
  const today = todayStr || getTodayStr();
  const last = gamData.lastPositiveScoringDate;

  if (!last) {
    return { ...gamData, currentStreak: 1, longestStreak: 1, lastPositiveScoringDate: today };
  }

  if (last === today) {
    return gamData; // already scored today
  }

  const consecutive = exemptDates
    ? isConsecutiveWithExemptions(last, today, exemptDates)
    : (() => {
        const lastDate = new Date(last);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
        return diffDays === 1;
      })();

  if (consecutive) {
    const newStreak = gamData.currentStreak + 1;
    return {
      ...gamData,
      currentStreak: newStreak,
      longestStreak: Math.max(gamData.longestStreak, newStreak),
      lastPositiveScoringDate: today,
    };
  } else {
    return { ...gamData, currentStreak: 1, lastPositiveScoringDate: today };
  }
}

export const STREAK_MILESTONES = [3, 7, 14, 30];

export function createDefaultGamification(studentId: string): StudentGamification {
  return {
    studentId,
    xp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastPositiveScoringDate: null,
    unlockedBadgeIds: [],
    badgeUnlockedAt: {},
    totalPositiveScores: 0,
    perfectQuizCount: 0,
    helpingOthersCount: 0,
    rewardRedeemedCount: 0,
    attendanceDays: 0,
    lastAttendanceDate: null,
    attendanceStreak: 0,
    longestAttendanceStreak: 0,
  };
}

export function cloneGamificationSnapshot(gam: StudentGamification): GamificationSnapshot {
  return {
    xp: gam.xp,
    level: gam.level,
    currentStreak: gam.currentStreak,
    longestStreak: gam.longestStreak,
    lastPositiveScoringDate: gam.lastPositiveScoringDate,
    unlockedBadgeIds: [...gam.unlockedBadgeIds],
    badgeUnlockedAt: { ...gam.badgeUnlockedAt },
    totalPositiveScores: gam.totalPositiveScores,
    perfectQuizCount: gam.perfectQuizCount,
    helpingOthersCount: gam.helpingOthersCount,
    rewardRedeemedCount: gam.rewardRedeemedCount,
    attendanceDays: gam.attendanceDays || 0,
    lastAttendanceDate: gam.lastAttendanceDate || null,
    attendanceStreak: gam.attendanceStreak || 0,
    longestAttendanceStreak: gam.longestAttendanceStreak || 0,
  };
}
