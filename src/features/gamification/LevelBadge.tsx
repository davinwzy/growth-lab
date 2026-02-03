import { getLevelForXp } from '@/shared/utils/gamification';
import { useApp } from '@/app/AppProvider';

interface LevelBadgeProps {
  xp: number;
  size?: 'sm' | 'md';
}

export function LevelBadge({ xp, size = 'sm' }: LevelBadgeProps) {
  const { t } = useApp();
  const level = getLevelForXp(xp);

  return (
    <span
      className={`inline-flex items-center gap-0.5 shrink-0 ${
        size === 'sm' ? 'text-sm' : 'text-base'
      }`}
      title={t(level.name, level.nameEn)}
    >
      <span>{level.emoji}</span>
    </span>
  );
}
