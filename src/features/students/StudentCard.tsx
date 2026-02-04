import type { Student, StudentGamification } from '@/shared/types';
import { LevelBadge } from '@/features/gamification/LevelBadge';
import { StreakIndicator } from '@/features/gamification/StreakIndicator';
import { XpProgressBar } from '@/features/gamification/XpProgressBar';

interface StudentCardProps {
  student: Student;
  groupColor: string;
  onClick: () => void;
  isSelected: boolean;
  onSelect: () => void;
  selectionMode: boolean;
  gamification?: StudentGamification;
}

export function StudentCard({
  student,
  groupColor,
  onClick,
  isSelected,
  onSelect,
  selectionMode,
  gamification,
}: StudentCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.stopPropagation();
      onSelect();
    } else {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`px-3 py-2 rounded-xl cursor-pointer transition-all clay-card-soft ${
        isSelected
          ? 'ring-2 ring-[var(--lab-blue)]'
          : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-2">
        {selectionMode && (
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
              isSelected ? 'bg-[var(--lab-blue)] border-[var(--lab-blue)]' : 'border-gray-300'
            }`}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        )}
        {/* Avatar or group color indicator */}
        {student.avatar ? (
          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gray-100 text-lg">
            {student.avatar}
          </div>
        ) : (
          <div
            className="w-2 h-8 rounded-full shrink-0"
            style={{ backgroundColor: groupColor }}
          />
        )}
        {gamification && <LevelBadge xp={gamification.xp} />}
        <span className="flex-1 font-medium truncate text-sm">{student.name}</span>
        {gamification && gamification.currentStreak > 0 && (
          <StreakIndicator streak={gamification.currentStreak} />
        )}
        <span
          className={`text-lg font-bold ${
            student.score >= 0 ? 'text-emerald-600' : 'text-rose-500'
          }`}
        >
          {student.score}
        </span>
      </div>
      {gamification && gamification.xp > 0 && (
        <div className="mt-1 ml-7">
          <XpProgressBar xp={gamification.xp} />
        </div>
      )}
    </div>
  );
}
