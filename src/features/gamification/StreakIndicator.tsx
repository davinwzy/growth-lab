interface StreakIndicatorProps {
  streak: number;
}

export function StreakIndicator({ streak }: StreakIndicatorProps) {
  if (streak < 1) return null;

  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-orange-500 font-medium shrink-0">
      🔥{streak}
    </span>
  );
}
