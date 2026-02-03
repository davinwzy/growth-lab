import { useState } from 'react';
import { useApp } from '@/app/AppProvider';
import { Modal, Button } from '@/shared/components';
import { generateId } from '@/shared/utils/storage';
import { groupColors } from '@/shared/utils/defaults';
import { RegroupModal } from './RegroupModal';
import type { Group } from '@/shared/types';

interface GroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GroupManager({ isOpen, onClose }: GroupManagerProps) {
  const { state, dispatch, t } = useApp();
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupColor, setGroupColor] = useState(groupColors[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [showRegroup, setShowRegroup] = useState(false);

  const currentGroups = state.groups
    .filter(g => g.classId === state.currentClassId)
    .sort((a, b) => a.order - b.order);

  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupColor(groupColors[currentGroups.length % groupColors.length]);
    setIsEditing(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupColor(group.color);
    setIsEditing(true);
  };

  const handleSaveGroup = () => {
    if (!groupName.trim() || !state.currentClassId) return;

    if (editingGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        payload: { ...editingGroup, name: groupName.trim(), color: groupColor },
      });
    } else {
      const newGroup: Group = {
        id: generateId(),
        classId: state.currentClassId,
        name: groupName.trim(),
        color: groupColor,
        order: currentGroups.length,
        score: 0,
      };
      dispatch({ type: 'ADD_GROUP', payload: newGroup });
    }
    setIsEditing(false);
    setGroupName('');
  };

  const handleDeleteGroup = (groupId: string) => {
    const groupStudents = state.students.filter(s => s.groupId === groupId);
    if (groupStudents.length > 0) {
      if (!confirm(t(
        `此组别有 ${groupStudents.length} 名学生，删除后学生也会被删除。确定要删除吗？`,
        `This group has ${groupStudents.length} students. Deleting will also remove the students. Are you sure?`
      ))) {
        return;
      }
    }
    dispatch({ type: 'DELETE_GROUP', payload: groupId });
  };

  const handleQuickCreate = () => {
    if (!state.currentClassId) return;

    const count = prompt(t('请输入要创建的组数 (1-10)', 'Enter number of groups to create (1-10)'), '4');
    if (!count) return;

    const num = parseInt(count, 10);
    if (isNaN(num) || num < 1 || num > 10) {
      alert(t('请输入 1-10 之间的数字', 'Please enter a number between 1-10'));
      return;
    }

    for (let i = 0; i < num; i++) {
      const newGroup: Group = {
        id: generateId(),
        classId: state.currentClassId,
        name: t(`第 ${currentGroups.length + i + 1} 组`, `Group ${currentGroups.length + i + 1}`),
        color: groupColors[(currentGroups.length + i) % groupColors.length],
        order: currentGroups.length + i,
        score: 0,
      };
      dispatch({ type: 'ADD_GROUP', payload: newGroup });
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('组别管理', 'Group Management')}
      size="lg"
    >
      {!state.currentClassId ? (
        <div className="text-center text-gray-500 py-8">
          {t('请先选择一个班级', 'Please select a class first')}
        </div>
      ) : isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('组别名称', 'Group Name')}
            </label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder={t('例如：第 1 组', 'e.g., Group 1')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('组别颜色', 'Group Color')}
            </label>
            <div className="flex gap-2 flex-wrap">
              {groupColors.map(color => (
                <button
                  key={color}
                  onClick={() => setGroupColor(color)}
                  className={`w-10 h-10 rounded-lg transition-transform ${
                    groupColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              {t('取消', 'Cancel')}
            </Button>
            <Button onClick={handleSaveGroup} disabled={!groupName.trim()}>
              {t('保存', 'Save')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleAddGroup}>
              + {t('添加组别', 'Add Group')}
            </Button>
            <Button variant="secondary" onClick={handleQuickCreate}>
              {t('快速创建', 'Quick Create')}
            </Button>
            {currentGroups.length > 0 && (
              <Button variant="secondary" onClick={() => setShowRegroup(true)}>
                {t('重新分组', 'Regroup')}
              </Button>
            )}
          </div>

          {currentGroups.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {t('暂无组别，请添加', 'No groups yet, please add some')}
            </div>
          ) : (
            <div className="space-y-2">
              {currentGroups.map(group => {
                const studentCount = state.students.filter(s => s.groupId === group.id).length;
                return (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className="w-8 h-8 rounded-lg shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-sm text-gray-500">
                        {studentCount} {t('名学生', 'students')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title={t('编辑', 'Edit')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      title={t('删除', 'Delete')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Modal>

    {/* Regroup Modal */}
    <RegroupModal isOpen={showRegroup} onClose={() => setShowRegroup(false)} />
    </>
  );
}
