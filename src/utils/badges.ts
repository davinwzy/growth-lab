import type { BadgeDefinition, StudentGamification } from '../types';

// Default badge definitions - used as template for first-time setup
export const DEFAULT_BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Milestone badges
  { id: 'first-score', name: '初次得分', nameEn: 'First Score', emoji: '⭐', category: 'milestone',
    description: '第一次获得分数', descriptionEn: 'Earned your first score',
    condition: { type: 'first_score' }, bonusPoints: 5 },
  { id: 'xp-100', name: '百分学者', nameEn: 'Century Scholar', emoji: '💯', category: 'milestone',
    description: '累计获得100 XP', descriptionEn: 'Accumulated 100 XP',
    condition: { type: 'total_xp', xp: 100 }, bonusPoints: 10 },
  { id: 'xp-500', name: '知识勇者', nameEn: 'Knowledge Hero', emoji: '🦸', category: 'milestone',
    description: '累计获得500 XP', descriptionEn: 'Accumulated 500 XP',
    condition: { type: 'total_xp', xp: 500 }, bonusPoints: 20 },
  { id: 'xp-1000', name: '传奇学者', nameEn: 'Legendary Scholar', emoji: '🌟', category: 'milestone',
    description: '累计获得1000 XP', descriptionEn: 'Accumulated 1000 XP',
    condition: { type: 'total_xp', xp: 1000 }, bonusPoints: 50 },
  { id: 'level-3', name: '战士觉醒', nameEn: 'Warrior Awakened', emoji: '⚔️', category: 'milestone',
    description: '达到战士等级', descriptionEn: 'Reached Warrior level',
    condition: { type: 'level_reached', level: 3 }, bonusPoints: 15 },
  { id: 'level-6', name: '传说降临', nameEn: 'Legend Arrives', emoji: '👑', category: 'milestone',
    description: '达到传说等级', descriptionEn: 'Reached Legend level',
    condition: { type: 'level_reached', level: 6 }, bonusPoints: 100 },
  { id: 'first-reward', name: '第一次兑换', nameEn: 'First Redemption', emoji: '🎁', category: 'milestone',
    description: '第一次兑换礼物', descriptionEn: 'Redeemed your first reward',
    condition: { type: 'reward_redeemed', count: 1 }, bonusPoints: 5 },

  // Streak badges
  { id: 'streak-3', name: '三连胜', nameEn: '3-Day Streak', emoji: '🔥', category: 'streak',
    description: '连续3天获得正分', descriptionEn: '3 consecutive days of positive scoring',
    condition: { type: 'streak_days', days: 3 }, bonusPoints: 5 },
  { id: 'streak-7', name: '周冠军', nameEn: '7-Day Streak', emoji: '🔥', category: 'streak',
    description: '连续7天获得正分', descriptionEn: '7 consecutive days of positive scoring',
    condition: { type: 'streak_days', days: 7 }, bonusPoints: 10 },
  { id: 'streak-14', name: '双周达人', nameEn: '14-Day Streak', emoji: '💪', category: 'streak',
    description: '连续14天获得正分', descriptionEn: '14 consecutive days of positive scoring',
    condition: { type: 'streak_days', days: 14 }, bonusPoints: 20 },
  { id: 'streak-30', name: '月度之星', nameEn: '30-Day Streak', emoji: '🏅', category: 'streak',
    description: '连续30天获得正分', descriptionEn: '30 consecutive days of positive scoring',
    condition: { type: 'streak_days', days: 30 }, bonusPoints: 50 },

  // Academic badges
  { id: 'perfect-quiz-3', name: '满分达人', nameEn: 'Perfect Quiz Master', emoji: '📝', category: 'academic',
    description: '3次测验满分', descriptionEn: 'Got perfect quiz score 3 times',
    condition: { type: 'perfect_quiz_count', count: 3 }, bonusPoints: 15 },
  { id: 'score-50', name: '积分达人', nameEn: '50 Scores Earned', emoji: '🎯', category: 'score',
    description: '累计获得50次加分', descriptionEn: 'Received 50 positive scores',
    condition: { type: 'score_count', count: 50 }, bonusPoints: 20 },

  // Social badges
  { id: 'helper', name: '小帮手', nameEn: 'Helper', emoji: '🤝', category: 'social',
    description: '5次助人为乐', descriptionEn: 'Helped others 5 times',
    condition: { type: 'helping_others_count', count: 5 }, bonusPoints: 10 },
  { id: 'team-player', name: '团队之星', nameEn: 'Team Player', emoji: '🌈', category: 'social',
    description: '参与10次组别活动', descriptionEn: 'Participated in 10 group activities',
    condition: { type: 'score_count', count: 10 }, bonusPoints: 10 },
];

// Keep old name for backwards compatibility during migration
export const BADGE_DEFINITIONS = DEFAULT_BADGE_DEFINITIONS;

export function checkBadges(gam: StudentGamification, customBadges: BadgeDefinition[] = []): string[] {
  const newBadges: string[] = [];
  // Now only use customBadges (which contains all badges after migration)
  const allBadges = customBadges.length > 0 ? customBadges : DEFAULT_BADGE_DEFINITIONS;

  for (const badge of allBadges) {
    if (gam.unlockedBadgeIds.includes(badge.id)) continue;

    let earned = false;
    const c = badge.condition;

    switch (c.type) {
      case 'first_score':
        earned = gam.totalPositiveScores >= 1;
        break;
      case 'total_xp':
        earned = gam.xp >= c.xp;
        break;
      case 'level_reached':
        earned = gam.level >= c.level;
        break;
      case 'streak_days':
        earned = gam.currentStreak >= c.days || gam.longestStreak >= c.days;
        break;
      case 'score_count':
        earned = gam.totalPositiveScores >= c.count;
        break;
      case 'reward_redeemed':
        earned = gam.rewardRedeemedCount >= c.count;
        break;
      case 'perfect_quiz_count':
        earned = gam.perfectQuizCount >= c.count;
        break;
      case 'helping_others_count':
        earned = gam.helpingOthersCount >= c.count;
        break;
      case 'attendance_days':
        earned = (gam.attendanceDays || 0) >= c.days;
        break;
    }

    if (earned) {
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

export function getBadgeById(id: string, customBadges: BadgeDefinition[] = []): BadgeDefinition | undefined {
  const allBadges = customBadges.length > 0 ? customBadges : DEFAULT_BADGE_DEFINITIONS;
  return allBadges.find(b => b.id === id);
}

export function getAllBadges(customBadges: BadgeDefinition[] = []): BadgeDefinition[] {
  // Return customBadges if they exist (migrated), otherwise return defaults
  return customBadges.length > 0 ? customBadges : DEFAULT_BADGE_DEFINITIONS;
}

export function getDefaultBadges(): BadgeDefinition[] {
  return DEFAULT_BADGE_DEFINITIONS;
}
