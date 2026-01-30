import { useState } from 'react';
import type { Group, ScoreItem, HistoryRecord, Reward } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useGamification } from '../../hooks/useGamification';
import { getLevelForXp, LEVEL_DEFINITIONS } from '../../utils/gamification';
import { Modal, Button } from '../common';
import { generateId } from '../../utils/storage';

interface GroupScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
}

type ActionTab = 'add' | 'subtract' | 'reward';

export function GroupScoreModal({ isOpen, onClose, group }: GroupScoreModalProps) {
  const { state, dispatch, t } = useApp();
  const { processReward, getGamification } = useGamification();
  const [activeTab, setActiveTab] = useState<ActionTab>('add');
  const [customValue, setCustomValue] = useState('');
  const [customNote, setCustomNote] = useState('');

  if (!group) return null;

  const groupStudents = state.students.filter(s => s.groupId === group.id);
  const groupScore = group.score || 0;

  const addItems = state.scoreItems.filter(item => item.value > 0);
  const subtractItems = state.scoreItems.filter(item => item.value < 0);

  const handleScoreChange = (item: ScoreItem) => {
    // Update group score only (not individual student scores)
    dispatch({
      type: 'UPDATE_GROUP_POINTS',
      payload: { groupId: group.id, delta: item.value },
    });

    const record: HistoryRecord = {
      id: generateId(),
      classId: group.classId,
      type: 'score',
      targetType: 'group',
      targetId: group.id,
      targetName: group.name,
      itemId: item.id,
      itemName: state.language === 'zh-CN' ? item.name : item.nameEn,
      value: item.value,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_HISTORY', payload: record });
    onClose();
  };

  const handleCustomScore = () => {
    const value = parseInt(customValue, 10);
    if (isNaN(value) || value <= 0) return;

    const delta = activeTab === 'add' ? value : -value;

    dispatch({
      type: 'UPDATE_GROUP_POINTS',
      payload: { groupId: group.id, delta },
    });

    const record: HistoryRecord = {
      id: generateId(),
      classId: group.classId,
      type: 'score',
      targetType: 'group',
      targetId: group.id,
      targetName: group.name,
      itemId: 'custom',
      itemName: t('自定义', 'Custom'),
      value: delta,
      timestamp: Date.now(),
      note: customNote || undefined,
    };
    dispatch({ type: 'ADD_HISTORY', payload: record });

    setCustomValue('');
    setCustomNote('');
    onClose();
  };

  const handleGroupReward = (reward: Reward) => {
    const totalStudentScore = groupStudents.reduce((sum, s) => sum + s.score, 0);
    if (totalStudentScore < reward.cost) {
      alert(t('组员总分不足，无法兑换', 'Insufficient group member points for redemption'));
      return;
    }

    // Check level gating: all students must meet minimum level
    if (reward.minLevel && reward.minLevel > 1) {
      const allMeetLevel = groupStudents.every(s => {
        const gam = getGamification(s.id);
        return getLevelForXp(gam.xp).level >= (reward.minLevel || 1);
      });
      if (!allMeetLevel) {
        const levelDef = LEVEL_DEFINITIONS.find(l => l.level === reward.minLevel);
        alert(t(
          `组内所有学生需要达到 ${levelDef?.name || ''} (Lv.${reward.minLevel}) 等级才能兑换`,
          `All students must be at ${levelDef?.nameEn || ''} level (Lv.${reward.minLevel}) to redeem`
        ));
        return;
      }
    }

    if (!confirm(t(
      `确定要用 ${reward.cost} 分为「${group.name}」兑换「${reward.name}」吗？\n每个组员将平均扣除分数。`,
      `Redeem "${reward.nameEn}" for ${group.name} for ${reward.cost} points?\nPoints will be deducted from each member.`
    ))) {
      return;
    }

    // Deduct points from each student evenly
    const perStudent = Math.floor(reward.cost / groupStudents.length);
    const remainder = reward.cost % groupStudents.length;

    groupStudents.forEach((student, index) => {
      const deduction = perStudent + (index < remainder ? 1 : 0);
      dispatch({
        type: 'UPDATE_STUDENT_SCORE',
        payload: { studentId: student.id, delta: -deduction },
      });
      processReward(student.id, student.name);
    });

    const record: HistoryRecord = {
      id: generateId(),
      classId: group.classId,
      type: 'reward',
      targetType: 'group',
      targetId: group.id,
      targetName: group.name,
      itemId: reward.id,
      itemName: state.language === 'zh-CN' ? reward.name : reward.nameEn,
      value: -reward.cost,
      timestamp: Date.now(),
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
      title={`${group.name} - ${t('组别分数', 'Group Score')}: ${groupScore}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Group Info */}
        <div
          className="p-3 rounded-lg text-white"
          style={{ backgroundColor: group.color }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">{group.name}</div>
              <div className="text-sm opacity-90">
                {groupStudents.length} {t('名学生', 'students')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">{t('组别分数', 'Group Score')}</div>
              <div className="text-2xl font-bold">{groupScore}</div>
            </div>
          </div>
        </div>

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
            <div className="text-sm text-gray-500">
              {t('组别加减分不影响个人分数，仅影响组别总分', 'Group score changes only affect group total, not individual scores')}
            </div>
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
                  onClick={handleCustomScore}
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
            <div className="text-sm text-gray-500">
              {t('组别兑换将从组员个人分数中平均扣除', 'Points will be deducted evenly from group members\' individual scores')}
            </div>
            {state.rewards.map(reward => {
              const totalStudentScore = groupStudents.reduce((sum, s) => sum + s.score, 0);
              const canAfford = totalStudentScore >= reward.cost;
              const levelDef = reward.minLevel ? LEVEL_DEFINITIONS.find(l => l.level === reward.minLevel) : null;

              return (
                <button
                  key={reward.id}
                  onClick={() => handleGroupReward(reward)}
                  disabled={!canAfford}
                  className={`w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
                    canAfford
                      ? 'bg-amber-50 hover:bg-amber-100 border border-amber-200'
                      : 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="text-2xl">🎁</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getItemName(reward)}</span>
                      {reward.minLevel && reward.minLevel > 1 && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          {levelDef?.emoji} Lv.{reward.minLevel}+
                        </span>
                      )}
                    </div>
                    {(reward.description || reward.descriptionEn) && (
                      <div className="text-sm text-gray-500">
                        {state.language === 'zh-CN' ? reward.description : reward.descriptionEn}
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
