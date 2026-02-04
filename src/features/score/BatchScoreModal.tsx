import { useState } from 'react';
import type { ScoreItem, HistoryRecord, GamificationSnapshot } from '@/shared/types';
import { useApp } from '@/app/AppProvider';
import { useGamification } from '@/features/gamification/useGamification';
import { Modal, Button } from '@/shared/components';
import { generateId } from '@/shared/utils/storage';
import { cloneGamificationSnapshot } from '@/shared/utils/gamification';

interface BatchScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudentIds: string[];
  onComplete: () => void;
}

export function BatchScoreModal({ isOpen, onClose, selectedStudentIds, onComplete }: BatchScoreModalProps) {
  const { state, dispatch, t } = useApp();
  const { processScore, getGamification } = useGamification();
  const [activeTab, setActiveTab] = useState<'add' | 'subtract'>('add');
  const [customValue, setCustomValue] = useState('');
  const [customNote, setCustomNote] = useState('');

  const addItems = state.scoreItems.filter(item => item.value > 0);
  const subtractItems = state.scoreItems.filter(item => item.value < 0);

  const selectedStudents = state.students.filter(s => selectedStudentIds.includes(s.id));

  const makeGamSnapshot = (studentId: string): GamificationSnapshot => {
    return cloneGamificationSnapshot(getGamification(studentId));
  };

  const handleScoreChange = (item: ScoreItem) => {
    selectedStudents.forEach(student => {
      const snapshot = makeGamSnapshot(student.id);

      dispatch({
        type: 'UPDATE_STUDENT_SCORE',
        payload: { studentId: student.id, delta: item.value },
      });

      processScore(student.id, student.name, item.value, item.id);

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
        note: t('批量操作', 'Batch operation'),
        gamificationSnapshot: snapshot,
      };
      dispatch({ type: 'ADD_HISTORY', payload: record });
    });

    onComplete();
    onClose();
  };

  const handleCustomScore = () => {
    const value = parseInt(customValue, 10);
    if (isNaN(value) || value <= 0) return;

    const delta = activeTab === 'add' ? value : -value;

    selectedStudents.forEach(student => {
      const snapshot = makeGamSnapshot(student.id);

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
        note: customNote || t('批量操作', 'Batch operation'),
        gamificationSnapshot: snapshot,
      };
      dispatch({ type: 'ADD_HISTORY', payload: record });
    });

    setCustomValue('');
    setCustomNote('');
    onComplete();
    onClose();
  };

  const getItemName = (item: ScoreItem) => {
    return state.language === 'zh-CN' ? item.name : item.nameEn;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(`批量操作 (${selectedStudentIds.length} 名学生)`, `Batch Operation (${selectedStudentIds.length} students)`)}
      size="md"
    >
      <div className="space-y-4">
        {/* Selected students preview */}
        <div className="bg-gray-50 p-3 rounded-lg max-h-24 overflow-auto">
          <div className="text-sm text-gray-500 mb-1">
            {t('已选择:', 'Selected:')}
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedStudents.map(s => (
              <span key={s.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 px-4 font-medium transition-colors ${
              activeTab === 'add'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            + {t('加分', 'Add')}
          </button>
          <button
            onClick={() => setActiveTab('subtract')}
            className={`flex-1 py-2 px-4 font-medium transition-colors ${
              activeTab === 'subtract'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            - {t('减分', 'Subtract')}
          </button>
        </div>

        {/* Score Items */}
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
              {t('确定', 'OK')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
