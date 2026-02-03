import { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '@/app/AppProvider';

export function LevelUpCelebration() {
  const { state, dispatch, t } = useApp();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    studentName: string;
    levelEmoji: string;
    levelName: string;
    level: number;
    eventId: string;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowCelebration(false);
    if (celebrationData) {
      dispatch({ type: 'DISMISS_GAMIFICATION_EVENT', payload: celebrationData.eventId });
    }
    setCelebrationData(null);
  }, [celebrationData, dispatch]);

  useEffect(() => {
    const levelUpEvent = state.gamificationEvents.find(e => e.type === 'level_up');
    if (levelUpEvent && !showCelebration) {
      setCelebrationData({
        studentName: levelUpEvent.studentName,
        levelEmoji: levelUpEvent.data.levelEmoji || '',
        levelName: levelUpEvent.data.levelName || '',
        level: levelUpEvent.data.newLevel || 1,
        eventId: levelUpEvent.id,
      });
      setShowCelebration(true);

      timerRef.current = setTimeout(() => {
        setShowCelebration(false);
        dispatch({ type: 'DISMISS_GAMIFICATION_EVENT', payload: levelUpEvent.id });
        setCelebrationData(null);
      }, 4000);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [state.gamificationEvents, showCelebration, dispatch]);

  if (!showCelebration || !celebrationData) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 animate-pulse pointer-events-none" />

      {/* Celebration content - clickable to dismiss */}
      <div
        className="relative z-10 text-center animate-bounce pointer-events-auto cursor-pointer"
        onClick={handleDismiss}
      >
        <div className="text-8xl mb-4">{celebrationData.levelEmoji}</div>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl px-8 py-6 shadow-2xl">
          <div className="text-2xl font-bold mb-2">
            {t('升级啦！', 'Level Up!')}
          </div>
          <div className="text-xl">
            {celebrationData.studentName}
          </div>
          <div className="text-lg opacity-90 mt-1">
            {t('达到了', 'reached')} <span className="font-bold">{celebrationData.levelName}</span> {t('等级！', 'level!')}
          </div>
          <button className="mt-3 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors">
            {t('点击关闭', 'Click to dismiss')}
          </button>
        </div>
      </div>

      {/* Particle effects (CSS-only) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          >
            {['⭐', '✨', '🌟', '💫', '🎉', '🎊'][Math.floor(Math.random() * 6)]}
          </div>
        ))}
      </div>
    </div>
  );
}
