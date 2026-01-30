import { getXpProgress } from '../../utils/gamification';

interface XpProgressBarProps {
  xp: number;
}

export function XpProgressBar({ xp }: XpProgressBarProps) {
  const progress = getXpProgress(xp);

  return (
    <div className="w-full">
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      {progress.needed > 0 && (
        <div className="text-[10px] text-gray-400 mt-0.5 text-right">
          {progress.current}/{progress.needed} XP
        </div>
      )}
    </div>
  );
}
