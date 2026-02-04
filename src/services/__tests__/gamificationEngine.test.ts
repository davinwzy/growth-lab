import { describe, it, expect } from 'vitest';
import {
  applyAttendanceMakeup,
  applyAttendanceToday,
  applyPositiveScore,
  applyRewardRedemption,
} from '../gamificationEngine';
import type { BadgeDefinition, StudentGamification } from '@/shared/types';

const baseGam = (overrides: Partial<StudentGamification> = {}): StudentGamification => ({
  studentId: 's1',
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
  ...overrides,
});

const t = (_zh: string, en: string) => en;

describe('gamificationEngine', () => {
  it('applies positive score and level up event', () => {
    const gam = baseGam({ xp: 40 });
    const { gam: next, events } = applyPositiveScore(gam, 15, {
      studentId: 's1',
      studentName: 'A',
      customBadges: [],
      t,
      now: 1,
    });
    expect(next.xp).toBe(60);
    expect(next.level).toBe(2);
    expect(events.some(e => e.type === 'level_up')).toBe(true);
    expect(events.some(e => e.type === 'badge_earned')).toBe(true);
  });

  it('applies reward redemption and badge bonus xp', () => {
    const badge: BadgeDefinition = {
      id: 'first-reward',
      name: '第一次兑换',
      nameEn: 'First Redemption',
      emoji: '🎁',
      category: 'milestone',
      description: '第一次兑换礼物',
      descriptionEn: 'Redeemed your first reward',
      condition: { type: 'reward_redeemed', count: 1 },
      bonusPoints: 5,
    };
    const { gam: next, events } = applyRewardRedemption(baseGam(), {
      studentId: 's1',
      studentName: 'A',
      customBadges: [badge],
      t,
      now: 1,
    });
    expect(next.rewardRedeemedCount).toBe(1);
    expect(next.xp).toBe(5);
    expect(events.some(e => e.type === 'badge_earned')).toBe(true);
  });

  it('applies makeup attendance without streak changes', () => {
    const gam = baseGam({ attendanceStreak: 4, lastAttendanceDate: '2025-01-02' });
    const { gam: next } = applyAttendanceMakeup(gam, {
      studentId: 's1',
      studentName: 'A',
      customBadges: [],
      t,
      now: 1,
    });
    expect(next.attendanceDays).toBe(1);
    expect(next.attendanceStreak).toBe(4);
    expect(next.lastAttendanceDate).toBe('2025-01-02');
  });

  it('keeps attendance streak across exempt days', () => {
    const gam = baseGam({ attendanceStreak: 2, lastAttendanceDate: '2025-01-03' });
    const exemptDates = new Set(['2025-01-04']); // Saturday/Sunday or holiday
    const { gam: next } = applyAttendanceToday(gam, {
      studentId: 's1',
      studentName: 'A',
      customBadges: [],
      exemptDates,
      t,
      now: 1,
    }, '2025-01-05');
    expect(next.attendanceStreak).toBe(3);
  });
});
