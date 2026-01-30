import type { LevelDefinition, StudentGamification } from '../types';

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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function updateStreak(gamData: StudentGamification): StudentGamification {
  const today = getTodayStr();
  const last = gamData.lastPositiveScoringDate;

  if (!last) {
    return { ...gamData, currentStreak: 1, longestStreak: 1, lastPositiveScoringDate: today };
  }

  if (last === today) {
    return gamData; // already scored today
  }

  const lastDate = new Date(last);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);

  if (diffDays === 1) {
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
