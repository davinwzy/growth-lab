import { useApp } from '@/app/AppProvider';
import { Modal } from '@/shared/components';
import { getAllBadges } from '@/shared/utils/badges';
import { LEVEL_DEFINITIONS, getXpProgress } from '@/shared/utils/gamification';
import type { StudentGamification } from '@/shared/types';

interface BadgeCollectionProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  gamification: StudentGamification;
}

export function BadgeCollection({ isOpen, onClose, studentName, gamification }: BadgeCollectionProps) {
  const { state, t } = useApp();

  const currentLevel = LEVEL_DEFINITIONS.find(l => l.level === gamification.level) || LEVEL_DEFINITIONS[0];
  const progress = getXpProgress(gamification.xp);

  // Include custom badges
  const allBadges = getAllBadges(state.customBadges);

  const categories = [
    { key: 'milestone', label: t('里程碑', 'Milestones') },
    { key: 'streak', label: t('连续签到', 'Streaks') },
    { key: 'academic', label: t('学术', 'Academic') },
    { key: 'score', label: t('积分', 'Score') },
    { key: 'social', label: t('社交', 'Social') },
    { key: 'custom', label: t('自定义', 'Custom') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${studentName} - ${t('成就', 'Achievements')}`} size="lg">
      <div className="space-y-6">
        {/* Player Stats */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{currentLevel.emoji}</div>
            <div className="flex-1">
              <div className="text-xl font-bold">{t(currentLevel.name, currentLevel.nameEn)}</div>
              <div className="text-sm opacity-90">Lv.{gamification.level} | {gamification.xp} XP</div>
              <div className="mt-2 h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {progress.needed > 0 && (
                <div className="text-xs opacity-75 mt-1">
                  {progress.current}/{progress.needed} XP {t('升级', 'to level up')}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <span className="opacity-75">{t('连续签到', 'Streak')}: </span>
              <span className="font-bold">{gamification.currentStreak} {t('天', 'days')}</span>
            </div>
            <div>
              <span className="opacity-75">{t('最长记录', 'Best')}: </span>
              <span className="font-bold">{gamification.longestStreak} {t('天', 'days')}</span>
            </div>
            <div>
              <span className="opacity-75">{t('总加分', 'Total +')}: </span>
              <span className="font-bold">{gamification.totalPositiveScores}</span>
            </div>
          </div>
        </div>

        {/* Badge Grid */}
        {categories.map(cat => {
          const badges = allBadges.filter(b => b.category === cat.key);
          if (badges.length === 0) return null;

          return (
            <div key={cat.key}>
              <h3 className="font-medium text-gray-700 mb-2">{cat.label}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {badges.map(badge => {
                  const unlocked = gamification.unlockedBadgeIds.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`text-center p-3 rounded-xl border-2 transition-all ${
                        unlocked
                          ? 'border-amber-300 bg-amber-50 shadow-sm'
                          : 'border-gray-200 bg-gray-50 opacity-50'
                      }`}
                    >
                      <div className={`text-3xl mb-1 ${unlocked ? '' : 'grayscale'}`}>
                        {unlocked ? badge.emoji : '🔒'}
                      </div>
                      <div className="text-xs font-medium truncate">
                        {t(badge.name, badge.nameEn)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                        {t(badge.description, badge.descriptionEn)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Badge Count */}
        <div className="text-center text-sm text-gray-500 pt-2 border-t">
          {gamification.unlockedBadgeIds.length} / {allBadges.length} {t('已解锁', 'unlocked')}
        </div>
      </div>
    </Modal>
  );
}
