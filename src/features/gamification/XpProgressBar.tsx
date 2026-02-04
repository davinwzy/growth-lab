import { getXpProgress } from '@/shared/utils/gamification';

interface XpProgressBarProps {
  xp: number;
}

export function XpProgressBar({ xp }: XpProgressBarProps) {
  const progress = getXpProgress(xp);

  return (
    <div className="w-full">
      <div className="lab-progress-track">
        <div
          className="lab-progress-fill"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      {progress.needed > 0 && (
        <div className="text-[10px] text-slate-500 mt-0.5 text-right">
          {progress.current}/{progress.needed} XP
        </div>
      )}
    </div>
  );
}
