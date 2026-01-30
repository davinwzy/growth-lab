import { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import type { GamificationEvent } from '../../types';

export function GamificationToast() {
  const { state, dispatch, t } = useApp();
  const [currentEvent, setCurrentEvent] = useState<GamificationEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
    setTimeout(() => {
      if (currentEvent) {
        dispatch({ type: 'DISMISS_GAMIFICATION_EVENT', payload: currentEvent.id });
      }
      setCurrentEvent(null);
    }, 300);
  }, [currentEvent, dispatch]);

  useEffect(() => {
    if (state.gamificationEvents.length > 0 && !currentEvent) {
      const event = state.gamificationEvents[0];
      setCurrentEvent(event);
      setIsVisible(true);

      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          dispatch({ type: 'DISMISS_GAMIFICATION_EVENT', payload: event.id });
          setCurrentEvent(null);
        }, 300);
      }, 3000);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [state.gamificationEvents, currentEvent, dispatch]);

  if (!currentEvent) return null;

  const getMessage = () => {
    switch (currentEvent.type) {
      case 'level_up':
        return {
          icon: currentEvent.data.levelEmoji || '',
          title: t('升级啦！', 'Level Up!'),
          message: t(
            `${currentEvent.studentName} 升级为 ${currentEvent.data.levelName}！`,
            `${currentEvent.studentName} leveled up to ${currentEvent.data.levelName}!`
          ),
          color: 'from-purple-500 to-indigo-600',
        };
      case 'badge_earned':
        return {
          icon: currentEvent.data.badgeEmoji || '',
          title: t('获得徽章！', 'Badge Earned!'),
          message: t(
            `${currentEvent.studentName} 获得了 ${currentEvent.data.badgeName}！`,
            `${currentEvent.studentName} earned ${currentEvent.data.badgeName}!`
          ),
          color: 'from-amber-500 to-orange-600',
        };
      case 'streak_milestone':
        return {
          icon: '🔥',
          title: t('连续签到！', 'Streak Milestone!'),
          message: t(
            `${currentEvent.studentName} 连续 ${currentEvent.data.streakDays} 天获得正分！`,
            `${currentEvent.studentName} has a ${currentEvent.data.streakDays}-day streak!`
          ),
          color: 'from-orange-500 to-red-600',
        };
    }
  };

  const msg = getMessage();

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`relative bg-gradient-to-r ${msg.color} text-white rounded-xl shadow-2xl p-4 min-w-72 max-w-sm`}>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors"
        >
          ✕
        </button>
        <div className="flex items-start gap-3 pr-6">
          <span className="text-3xl">{msg.icon}</span>
          <div>
            <div className="font-bold text-lg">{msg.title}</div>
            <div className="text-sm opacity-90">{msg.message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
