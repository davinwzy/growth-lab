import { useState } from 'react';
import type { Student, Group, ScoreItem, Reward, HistoryRecord } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useGamification } from '../../hooks/useGamification';
import { getLevelForXp, LEVEL_DEFINITIONS } from '../../utils/gamification';
import { Modal, Button } from '../common';
import { generateId } from '../../utils/storage';

interface StudentActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  group: Group | null;
  onViewBadges?: () => void;
}

type ActionTab = 'add' | 'subtract' | 'reward';

export function StudentActionMenu({ isOpen, onClose, student, group, onViewBadges }: StudentActionMenuProps) {
  const { state, dispatch, t } = useApp();
  const { processScore, processReward, getGamification } = useGamification();
  const [activeTab, setActiveTab] = useState<ActionTab>('add');
  const [customValue, setCustomValue] = useState('');
  const [customNote, setCustomNote] = useState('');

  if (!student || !group) return null;

  const gam = getGamification(student.id);
  const studentLevel = getLevelForXp(gam.xp).level;

  const addItems = state.scoreItems.filter(item => item.value > 0);
  const subtractItems = state.scoreItems.filter(item => item.value < 0);

  const makeGamSnapshot = () => {
    const g = getGamification(student.id);
    return {
      xp: g.xp,
      level: g.level,
      currentStreak: g.currentStreak,
      longestStreak: g.longestStreak,
      lastPositiveScoringDate: g.lastPositiveScoringDate,
      unlockedBadgeIds: [...g.unlockedBadgeIds],
      badgeUnlockedAt: { ...g.badgeUnlockedAt },
      totalPositiveScores: g.totalPositiveScores,
      perfectQuizCount: g.perfectQuizCount,
      helpingOthersCount: g.helpingOthersCount,
      rewardRedeemedCount: g.rewardRedeemedCount,
      attendanceDays: g.attendanceDays || 0,
      lastAttendanceDate: g.lastAttendanceDate || null,
      attendanceStreak: g.attendanceStreak || 0,
      longestAttendanceStreak: g.longestAttendanceStreak || 0,
    };
  };

  const handleScoreChange = (item: ScoreItem) => {
    const snapshot = makeGamSnapshot();

    dispatch({
      type: 'UPDATE_STUDENT_SCORE',
      payload: { studentId: student.id, delta: item.value },
    });

    processScore(student.id, student.name, item.value);

    const record: HistoryRecord = {
      id: generateId(),
      classId: student.classId,
      type: 'score',
      targetType: 'student',
      targetId: student.id,
      targetName: student.name,
      itemId: item.id,
      itemName: state.language === 'zh-CN' ? item.name : item.nameEn,
      value: item.value,
      timestamp: Date.now(),
      gamificationSnapshot: snapshot,
    };
    dispatch({ type: 'ADD_HISTORY', payload: record });
    onClose();
  };

  const handleCustomScore = (isAdd: boolean) => {
    const value = parseInt(customValue, 10);
    if (isNaN(value) || value <= 0) return;

    const delta = isAdd ? value : -value;
    const snapshot = makeGamSnapshot();

    dispatch({
      type: 'UPDATE_STUDENT_SCORE',
      payload: { studentId: student.id, delta },
    });

    processScore(student.id, student.name, delta);

    const record: HistoryRecord = {
      id: generateId(),
      classId: student.classId,
      type: 'score',
      targetType: 'student',
      targetId: student.id,
      targetName: student.name,
      itemId: 'custom',
      itemName: t('自定义', 'Custom'),
      value: delta,
      timestamp: Date.now(),
      note: customNote || undefined,
      gamificationSnapshot: snapshot,
    };
    dispatch({ type: 'ADD_HISTORY', payload: record });
    setCustomValue('');
    setCustomNote('');
    onClose();
  };

  const handleRewardExchange = (reward: Reward) => {
    if (student.score < reward.cost) {
      alert(t('分数不足，无法兑换', 'Insufficient points for redemption'));
      return;
    }

    if (reward.minLevel && studentLevel < reward.minLevel) {
      const levelDef = LEVEL_DEFINITIONS.find(l => l.level === reward.minLevel);
      alert(t(
        `需要达到 ${levelDef?.name || ''} (Lv.${reward.minLevel}) 等级才能兑换此礼物`,
        `Requires ${levelDef?.nameEn || ''} level (Lv.${reward.minLevel}) to redeem this reward`
      ));
      return;
    }

    if (!confirm(t(
      `确定要用 ${reward.cost} 分兑换「${reward.name}」吗？`,
      `Redeem "${reward.nameEn}" for ${reward.cost} points?`
    ))) {
      return;
    }

    const snapshot = makeGamSnapshot();

    dispatch({
      type: 'UPDATE_STUDENT_SCORE',
      payload: { studentId: student.id, delta: -reward.cost },
    });

    processReward(student.id, student.name);

    const record: HistoryRecord = {
      id: generateId(),
      classId: student.classId,
      type: 'reward',
      targetType: 'student',
      targetId: student.id,
      targetName: student.name,
      itemId: reward.id,
      itemName: state.language === 'zh-CN' ? reward.name : reward.nameEn,
      value: -reward.cost,
      timestamp: Date.now(),
      gamificationSnapshot: snapshot,
    };
    dispatch({ type: 'ADD_HISTORY', payload: record });
    onClose();
  };

  const getItemName = (item: ScoreItem | Reward) => {
    return state.language === 'zh-CN' ? item.name : item.nameEn;
  };

  const tabs = [
    { key: 'add' as const, label: t('加分', 'Add'), icon: '+' },
    { key: 'subtract' as const, label: t('减分', 'Subtract'), icon: '-' },
    { key: 'reward' as const, label: t('兑换', 'Redeem'), icon: '🎁' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${student.name} - ${t('分数', 'Score')}: ${student.score}`}
      size="md"
    >
      <div className="space-y-4">
        {/* View Badges Button */}
        {onViewBadges && (
          <button
            onClick={() => { onClose(); onViewBadges(); }}
            className="w-full py-2 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            🏅 {t('查看成就', 'View Achievements')}
          </button>
        )}

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-4 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Add/Subtract Tab Content */}
        {(activeTab === 'add' || activeTab === 'subtract') && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(activeTab === 'add' ? addItems : subtractItems).map(item => (
                <button
                  key={item.id}
                  onClick={() => handleScoreChange(item)}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    activeTab === 'add'
                      ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                      : 'bg-red-50 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  <div className="font-medium">{getItemName(item)}</div>
                  <div className={`text-sm ${activeTab === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.value > 0 ? '+' : ''}{item.value}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Score */}
            <div className="pt-3 border-t">
              <div className="text-sm font-medium text-gray-700 mb-2">
                {t('自定义分数', 'Custom Score')}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  placeholder={t('分数', 'Points')}
                  className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  placeholder={t('备注（可选）', 'Note (optional)')}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  variant={activeTab === 'add' ? 'success' : 'danger'}
                  onClick={() => handleCustomScore(activeTab === 'add')}
                  disabled={!customValue || parseInt(customValue, 10) <= 0}
                >
                  {activeTab === 'add' ? '+' : '-'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reward Tab Content */}
        {activeTab === 'reward' && (
          <div className="space-y-2">
            {state.rewards.map(reward => {
              const meetsLevel = !reward.minLevel || studentLevel >= reward.minLevel;
              const canAfford = student.score >= reward.cost;
              const isDisabled = !canAfford || !meetsLevel;
              const levelDef = reward.minLevel ? LEVEL_DEFINITIONS.find(l => l.level === reward.minLevel) : null;

              return (
                <button
                  key={reward.id}
                  onClick={() => handleRewardExchange(reward)}
                  disabled={isDisabled}
                  className={`w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
                    !isDisabled
                      ? 'bg-amber-50 hover:bg-amber-100 border border-amber-200'
                      : 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="text-2xl">🎁</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getItemName(reward)}</span>
                      {reward.minLevel && reward.minLevel > 1 && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          meetsLevel ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {levelDef?.emoji} Lv.{reward.minLevel}+
                        </span>
                      )}
                    </div>
                    {(reward.description || reward.descriptionEn) && (
                      <div className="text-sm text-gray-500">
                        {state.language === 'zh-CN' ? reward.description : reward.descriptionEn}
                      </div>
                    )}
                    {!meetsLevel && (
                      <div className="text-xs text-red-500 mt-0.5">
                        {t('等级不足', 'Level too low')}
                      </div>
                    )}
                  </div>
                  <div className="text-amber-600 font-bold">
                    {reward.cost} {t('分', 'pts')}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
