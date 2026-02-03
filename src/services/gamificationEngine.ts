import type { BadgeDefinition, GamificationEvent, StudentGamification } from '@/shared/types';
import { checkBadges, getBadgeById } from '@/shared/utils/badges';
import { getLevelForXp, STREAK_MILESTONES, updateStreak } from '@/shared/utils/gamification';
import { isConsecutiveWithExemptions } from '@/services/streakUtils';
import { formatDateKey } from '@/shared/utils/date';

export type GamificationEventDraft = Omit<GamificationEvent, 'id' | 'timestamp'>;

const ATTENDANCE_MILESTONES = [3, 7, 14, 30, 50, 100];

interface ApplyContext {
  studentId: string;
  studentName: string;
  customBadges: BadgeDefinition[];
  exemptDates?: Set<string>;
  t: (zh: string, en: string) => string;
  now: number;
}

function applyBadgeRewards(
  gam: StudentGamification,
  ctx: ApplyContext
): { gam: StudentGamification; events: GamificationEventDraft[]; bonusXp: number } {
  const events: GamificationEventDraft[] = [];
  const newBadgeIds = checkBadges(gam, ctx.customBadges);
  if (newBadgeIds.length === 0) {
    return { gam, events, bonusXp: 0 };
  }

  const updated = {
    ...gam,
    unlockedBadgeIds: [...gam.unlockedBadgeIds, ...newBadgeIds],
    badgeUnlockedAt: {
      ...gam.badgeUnlockedAt,
      ...Object.fromEntries(newBadgeIds.map(id => [id, ctx.now])),
    },
  };

  let totalBonusPoints = 0;
  for (const badgeId of newBadgeIds) {
    const badge = getBadgeById(badgeId, ctx.customBadges);
    if (!badge) continue;
    if (badge.bonusPoints && badge.bonusPoints > 0) {
      totalBonusPoints += badge.bonusPoints;
    }
    events.push({
      type: 'badge_earned',
      studentId: ctx.studentId,
      studentName: ctx.studentName,
      data: {
        badgeId: badge.id,
        badgeEmoji: badge.emoji,
        badgeName: ctx.t(badge.name, badge.nameEn),
        bonusPoints: badge.bonusPoints,
      },
    });
  }

  return { gam: updated, events, bonusXp: totalBonusPoints };
}

export function applyPositiveScore(
  gam: StudentGamification,
  scoreValue: number,
  ctx: ApplyContext
): { gam: StudentGamification; events: GamificationEventDraft[] } {
  if (scoreValue <= 0) {
    return { gam, events: [] };
  }

  const events: GamificationEventDraft[] = [];
  const newXp = gam.xp + scoreValue;
  const oldLevel = getLevelForXp(gam.xp);
  const newLevel = getLevelForXp(newXp);

  let next = {
    ...gam,
    xp: newXp,
    level: newLevel.level,
    totalPositiveScores: gam.totalPositiveScores + 1,
  };

  const todayStr = formatDateKey(new Date());
  next = updateStreak(next, todayStr, ctx.exemptDates);

  if (newLevel.level > oldLevel.level) {
    events.push({
      type: 'level_up',
      studentId: ctx.studentId,
      studentName: ctx.studentName,
      data: {
        newLevel: newLevel.level,
        levelEmoji: newLevel.emoji,
        levelName: ctx.t(newLevel.name, newLevel.nameEn),
      },
    });
  }

  for (const milestone of STREAK_MILESTONES) {
    if (next.currentStreak === milestone) {
      events.push({
        type: 'streak_milestone',
        studentId: ctx.studentId,
        studentName: ctx.studentName,
        data: { streakDays: milestone },
      });
      break;
    }
  }

  const badgeResult = applyBadgeRewards(next, ctx);
  next = badgeResult.gam;
  if (badgeResult.bonusXp > 0) {
    next = { ...next, xp: next.xp + badgeResult.bonusXp };
  }
  events.push(...badgeResult.events);

  return { gam: next, events };
}

export function applyRewardRedemption(
  gam: StudentGamification,
  ctx: ApplyContext
): { gam: StudentGamification; events: GamificationEventDraft[] } {
  let next = {
    ...gam,
    rewardRedeemedCount: gam.rewardRedeemedCount + 1,
  };

  const badgeResult = applyBadgeRewards(next, ctx);
  next = badgeResult.gam;
  if (badgeResult.bonusXp > 0) {
    next = { ...next, xp: next.xp + badgeResult.bonusXp };
  }

  return { gam: next, events: badgeResult.events };
}

export function applyAttendanceToday(
  gam: StudentGamification,
  ctx: ApplyContext,
  todayStr: string
): { gam: StudentGamification; events: GamificationEventDraft[] } {
  let newStreak = 1;
  if (gam.lastAttendanceDate) {
    const consecutive = isConsecutiveWithExemptions(
      gam.lastAttendanceDate,
      todayStr,
      ctx.exemptDates || new Set<string>()
    );
    if (consecutive) {
      newStreak = (gam.attendanceStreak || 0) + 1;
    }
  }

  const attendanceScore = 1;
  const newXp = gam.xp + attendanceScore;
  const oldLevel = getLevelForXp(gam.xp);
  const newLevel = getLevelForXp(newXp);

  let next = {
    ...gam,
    xp: newXp,
    level: newLevel.level,
    attendanceDays: (gam.attendanceDays || 0) + 1,
    lastAttendanceDate: todayStr,
    attendanceStreak: newStreak,
    longestAttendanceStreak: Math.max(gam.longestAttendanceStreak || 0, newStreak),
    totalPositiveScores: gam.totalPositiveScores + 1,
  };

  next = updateStreak(next, todayStr, ctx.exemptDates);

  const events: GamificationEventDraft[] = [];
  if (newLevel.level > oldLevel.level) {
    events.push({
      type: 'level_up',
      studentId: ctx.studentId,
      studentName: ctx.studentName,
      data: {
        newLevel: newLevel.level,
        levelEmoji: newLevel.emoji,
        levelName: ctx.t(newLevel.name, newLevel.nameEn),
      },
    });
  }

  for (const milestone of ATTENDANCE_MILESTONES) {
    if (next.attendanceStreak === milestone) {
      events.push({
        type: 'streak_milestone',
        studentId: ctx.studentId,
        studentName: ctx.studentName,
        data: { streakDays: milestone },
      });
      break;
    }
  }

  const badgeResult = applyBadgeRewards(next, ctx);
  next = badgeResult.gam;
  if (badgeResult.bonusXp > 0) {
    next = { ...next, xp: next.xp + badgeResult.bonusXp };
  }
  events.push(...badgeResult.events);

  return { gam: next, events };
}

export function applyAttendanceMakeup(
  gam: StudentGamification,
  ctx: ApplyContext
): { gam: StudentGamification; events: GamificationEventDraft[] } {
  const attendanceScore = 1;
  const newXp = gam.xp + attendanceScore;
  const oldLevel = getLevelForXp(gam.xp);
  const newLevel = getLevelForXp(newXp);

  let next = {
    ...gam,
    xp: newXp,
    level: newLevel.level,
    attendanceDays: (gam.attendanceDays || 0) + 1,
    totalPositiveScores: gam.totalPositiveScores + 1,
  };

  const events: GamificationEventDraft[] = [];
  if (newLevel.level > oldLevel.level) {
    events.push({
      type: 'level_up',
      studentId: ctx.studentId,
      studentName: ctx.studentName,
      data: {
        newLevel: newLevel.level,
        levelEmoji: newLevel.emoji,
        levelName: ctx.t(newLevel.name, newLevel.nameEn),
      },
    });
  }

  const badgeResult = applyBadgeRewards(next, ctx);
  next = badgeResult.gam;
  if (badgeResult.bonusXp > 0) {
    next = { ...next, xp: next.xp + badgeResult.bonusXp };
  }
  events.push(...badgeResult.events);

  return { gam: next, events };
}

export function applyAttendanceRevoke(
  gam: StudentGamification,
  dateStr: string,
  todayStr: string
): StudentGamification {
  const newXp = Math.max(0, gam.xp - 1);
  let next = {
    ...gam,
    xp: newXp,
    level: getLevelForXp(newXp).level,
    attendanceDays: Math.max(0, (gam.attendanceDays || 0) - 1),
    totalPositiveScores: Math.max(0, gam.totalPositiveScores - 1),
  };

  if (dateStr === todayStr && gam.lastAttendanceDate === todayStr) {
    next = {
      ...next,
      attendanceStreak: Math.max(0, (gam.attendanceStreak || 0) - 1),
      lastAttendanceDate: null,
    };
  }

  return next;
}
