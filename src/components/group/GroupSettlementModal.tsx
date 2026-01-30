import { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useGamification } from '../../hooks/useGamification';
import { Modal, Button } from '../common';
import { generateId } from '../../utils/storage';
import type { HistoryRecord } from '../../types';

interface GroupSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_BONUSES = [20, 15, 10, 5];

export function GroupSettlementModal({ isOpen, onClose }: GroupSettlementModalProps) {
  const { state, dispatch, t } = useApp();
  const { processScore } = useGamification();
  const [bonuses, setBonuses] = useState<number[]>(DEFAULT_BONUSES);

  const currentGroups = useMemo(() => {
    return state.groups
      .filter(g => g.classId === state.currentClassId)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [state.groups, state.currentClassId]);

  const handleBonusChange = (index: number, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    const updated = [...bonuses];
    while (updated.length <= index) updated.push(5);
    updated[index] = num;
    setBonuses(updated);
  };

  const getBonusForRank = (rank: number) => {
    if (rank < bonuses.length) return bonuses[rank];
    return bonuses[bonuses.length - 1] || 5;
  };

  const handleSettle = () => {
    if (currentGroups.length === 0) return;

    const message = currentGroups
      .map((g, i) => `${i + 1}. ${g.name}: ${g.score || 0} → +${getBonusForRank(i)}/student`)
      .join('\n');

    if (!confirm(t(
      `确定要结算组别分数吗？\n\n${message}\n\n每组学生将获得对应排名的个人加分，组别分数将归零。`,
      `Settle group scores?\n\n${message}\n\nEach student will receive bonus points based on group ranking. Group scores will reset to 0.`
    ))) {
      return;
    }

    const bonusPayload = currentGroups.map((group, index) => ({
      groupId: group.id,
      bonusPerStudent: getBonusForRank(index),
    }));

    // Process gamification for each student
    currentGroups.forEach((group, index) => {
      const bonus = getBonusForRank(index);
      const groupStudents = state.students.filter(s => s.groupId === group.id);
      groupStudents.forEach(student => {
        processScore(student.id, student.name, bonus);
      });

      // Add history record for each group
      const record: HistoryRecord = {
        id: generateId(),
        classId: group.classId,
        type: 'score',
        targetType: 'group',
        targetId: group.id,
        targetName: group.name,
        itemId: 'settlement',
        itemName: t('季度结算', 'Group Settlement'),
        value: bonus,
        timestamp: Date.now(),
        note: t(
          `排名第${index + 1}，每人+${bonus}分`,
          `Rank #${index + 1}, +${bonus} per student`
        ),
      };
      dispatch({ type: 'ADD_HISTORY', payload: record });
    });

    dispatch({ type: 'SETTLE_GROUP_SCORES', payload: { classId: state.currentClassId!, bonuses: bonusPayload } });
    onClose();
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('组别结算', 'Group Settlement')}
      size="md"
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-500">
          {t(
            '结算将根据组别排名给每位组员加个人分数和经验值，然后重置所有组别分数为0。',
            'Settlement awards individual points and XP to each member based on group ranking, then resets all group scores to 0.'
          )}
        </div>

        {/* Bonus configuration */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            {t('排名奖励设置', 'Ranking Bonus Settings')}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-lg w-8 text-center">{getRankEmoji(i)}</span>
                <span className="text-sm text-gray-500 w-12">
                  {i < 3
                    ? t(`第${i + 1}名`, `#${i + 1}`)
                    : t('其他', 'Other')}
                </span>
                <input
                  type="number"
                  min="0"
                  value={bonuses[i] ?? 5}
                  onChange={e => handleBonusChange(i, e.target.value)}
                  className="w-20 px-2 py-1 border rounded text-center text-sm"
                />
                <span className="text-sm text-gray-500">{t('分/人', 'pts/ea')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Group Rankings Preview */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            {t('当前排名', 'Current Rankings')}
          </div>
          <div className="space-y-2">
            {currentGroups.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                {t('暂无组别', 'No groups')}
              </div>
            ) : (
              currentGroups.map((group, index) => {
                const studentCount = state.students.filter(s => s.groupId === group.id).length;
                const bonus = getBonusForRank(index);
                return (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <span className="text-xl w-8 text-center">{getRankEmoji(index)}</span>
                    <div
                      className="w-3 h-10 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-gray-500">
                        {studentCount} {t('名学生', 'students')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{group.score || 0}</div>
                      <div className="text-xs text-green-600">+{bonus}/{t('人', 'ea')}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="secondary" onClick={onClose}>
            {t('取消', 'Cancel')}
          </Button>
          <Button
            onClick={handleSettle}
            disabled={currentGroups.length === 0}
          >
            {t('确认结算', 'Confirm Settlement')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
