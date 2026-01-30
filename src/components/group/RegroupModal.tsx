import { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Modal, Button } from '../common';

interface RegroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegroupModal({ isOpen, onClose }: RegroupModalProps) {
  const { state, dispatch, t } = useApp();
  const [changes, setChanges] = useState<Record<string, string>>({});

  const currentGroups = useMemo(() => {
    return state.groups
      .filter(g => g.classId === state.currentClassId)
      .sort((a, b) => a.order - b.order);
  }, [state.groups, state.currentClassId]);

  const currentStudents = useMemo(() => {
    return state.students
      .filter(s => s.classId === state.currentClassId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.students, state.currentClassId]);

  const getEffectiveGroupId = (studentId: string, originalGroupId: string) => {
    return changes[studentId] || originalGroupId;
  };

  const handleGroupChange = (studentId: string, newGroupId: string) => {
    const student = currentStudents.find(s => s.id === studentId);
    if (!student) return;

    if (newGroupId === student.groupId) {
      // Remove from changes if reverting to original
      const updated = { ...changes };
      delete updated[studentId];
      setChanges(updated);
    } else {
      setChanges(prev => ({ ...prev, [studentId]: newGroupId }));
    }
  };

  const pendingChanges = Object.keys(changes).length;

  const handleSave = () => {
    Object.entries(changes).forEach(([studentId, newGroupId]) => {
      const student = state.students.find(s => s.id === studentId);
      if (student) {
        dispatch({
          type: 'UPDATE_STUDENT',
          payload: { ...student, groupId: newGroupId },
        });
      }
    });
    setChanges({});
    onClose();
  };

  const handleMoveAllToGroup = (targetGroupId: string) => {
    const newChanges: Record<string, string> = { ...changes };
    currentStudents.forEach(s => {
      if (s.groupId !== targetGroupId) {
        newChanges[s.id] = targetGroupId;
      } else {
        delete newChanges[s.id];
      }
    });
    setChanges(newChanges);
  };

  const handleReset = () => {
    setChanges({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { setChanges({}); onClose(); }}
      title={t('重新分组', 'Regroup Students')}
      size="xl"
    >
      {currentGroups.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {t('请先创建组别', 'Please create groups first')}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            {t(
              '修改学生的组别分配，保存后生效。',
              'Change student group assignments. Changes take effect after saving.'
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 py-1">
              {t('全部移到:', 'Move all to:')}
            </span>
            {currentGroups.map(group => (
              <button
                key={group.id}
                onClick={() => handleMoveAllToGroup(group.id)}
                className="px-3 py-1 text-sm rounded-full border transition-colors hover:opacity-80"
                style={{ borderColor: group.color, color: group.color }}
              >
                {group.name}
              </button>
            ))}
            {pendingChanges > 0 && (
              <button
                onClick={handleReset}
                className="px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
              >
                {t('重置', 'Reset')}
              </button>
            )}
          </div>

          {/* Student Table */}
          <div className="max-h-96 overflow-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">
                    {t('学生', 'Student')}
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">
                    {t('当前组别', 'Current Group')}
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">
                    {t('新组别', 'New Group')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.map(student => {
                  const effectiveGroupId = getEffectiveGroupId(student.id, student.groupId);
                  const currentGroup = currentGroups.find(g => g.id === student.groupId);
                  const hasChange = changes[student.id] !== undefined;
                  return (
                    <tr
                      key={student.id}
                      className={`border-t ${hasChange ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {hasChange && <span className="text-yellow-500 text-xs">*</span>}
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: (currentGroup?.color || '#ccc') + '20',
                            color: currentGroup?.color || '#666',
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: currentGroup?.color || '#ccc' }}
                          />
                          {currentGroup?.name || '?'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={effectiveGroupId}
                          onChange={e => handleGroupChange(student.id, e.target.value)}
                          className={`px-2 py-1 border rounded text-sm ${
                            hasChange ? 'border-yellow-400 bg-yellow-50' : ''
                          }`}
                        >
                          {currentGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-500">
              {pendingChanges > 0
                ? t(`${pendingChanges} 项更改待保存`, `${pendingChanges} changes pending`)
                : t('暂无更改', 'No changes')}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setChanges({}); onClose(); }}>
                {t('取消', 'Cancel')}
              </Button>
              <Button onClick={handleSave} disabled={pendingChanges === 0}>
                {t('保存更改', 'Save Changes')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
