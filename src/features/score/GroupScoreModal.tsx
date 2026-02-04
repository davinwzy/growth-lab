import { useState } from 'react';
import type { Group, ScoreItem, HistoryRecord } from '@/shared/types';
import { useApp } from '@/app/AppProvider';
import { Modal, Button } from '@/shared/components';
import { generateId } from '@/shared/utils/storage';

interface GroupScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
}

type ActionTab = 'add' | 'subtract';

export function GroupScoreModal({ isOpen, onClose, group }: GroupScoreModalProps) {
  const { state, dispatch, t } = useApp();
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

  const getItemName = (item: ScoreItem) => {
    return state.language === 'zh-CN' ? item.name : item.nameEn;
  };

  const tabs = [
    { key: 'add' as const, label: t('加分', 'Add'), icon: '+' },
    { key: 'subtract' as const, label: t('减分', 'Subtract'), icon: '-' },
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

      </div>
    </Modal>
  );
}
