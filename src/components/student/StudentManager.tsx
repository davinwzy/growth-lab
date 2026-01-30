import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Modal, Button } from '../common';
import { generateId } from '../../utils/storage';
import type { Student } from '../../types';

interface StudentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = [
  '👦', '👧', '🧒', '👶', '🧒🏻', '👦🏻', '👧🏻',
  '🐱', '🐶', '🐰', '🐻', '🐼', '🦊', '🐨',
  '🦁', '🐯', '🐸', '🐵', '🦄', '🐲', '🐝',
  '🌟', '⭐', '🌈', '🌸', '🌺', '🍎', '🍓',
  '⚽', '🏀', '🎨', '🎵', '📚', '✏️', '🚀',
];

export function StudentManager({ isOpen, onClose }: StudentManagerProps) {
  const { state, dispatch, t } = useApp();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [studentNames, setStudentNames] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editAvatar, setEditAvatar] = useState<string>('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const currentGroups = state.groups
    .filter(g => g.classId === state.currentClassId)
    .sort((a, b) => a.order - b.order);

  const currentStudents = state.students.filter(
    s => s.classId === state.currentClassId
  );

  const handleBatchAdd = () => {
    if (!selectedGroupId || !studentNames.trim() || !state.currentClassId) return;

    const names = studentNames
      .split(/[\n,，]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    const newStudents: Student[] = names.map(name => ({
      id: generateId(),
      classId: state.currentClassId!,
      groupId: selectedGroupId,
      name,
      score: 0,
      createdAt: Date.now(),
    }));

    dispatch({ type: 'ADD_STUDENTS', payload: newStudents });
    setStudentNames('');
    setSelectedGroupId('');
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditGroupId(student.groupId);
    setEditAvatar(student.avatar || '');
    setShowAvatarPicker(false);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editingStudent || !editName.trim()) return;

    dispatch({
      type: 'UPDATE_STUDENT',
      payload: {
        ...editingStudent,
        name: editName.trim(),
        groupId: editGroupId,
        avatar: editAvatar || undefined,
      },
    });
    setIsEditing(false);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (confirm(t('确定要删除这名学生吗？', 'Are you sure you want to delete this student?'))) {
      dispatch({ type: 'DELETE_STUDENT', payload: studentId });
    }
  };

  const handleResetScores = () => {
    if (!confirm(t('确定要重置所有学生分数为0吗？', 'Reset all student scores to 0?'))) return;

    currentStudents.forEach(student => {
      dispatch({
        type: 'UPDATE_STUDENT',
        payload: { ...student, score: 0 },
      });
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('学生管理', 'Student Management')}
      size="lg"
    >
      {!state.currentClassId ? (
        <div className="text-center text-gray-500 py-8">
          {t('请先选择一个班级', 'Please select a class first')}
        </div>
      ) : currentGroups.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {t('请先创建组别', 'Please create groups first')}
        </div>
      ) : isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('学生姓名', 'Student Name')}
            </label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('头像', 'Avatar')}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="w-full px-3 py-2 border rounded-lg text-left flex items-center gap-2 hover:bg-gray-50"
              >
                {editAvatar ? (
                  <>
                    <span className="text-2xl">{editAvatar}</span>
                    <span className="text-gray-500">{t('点击更换', 'Click to change')}</span>
                  </>
                ) : (
                  <span className="text-gray-500">{t('点击选择头像（可选）', 'Click to select avatar (optional)')}</span>
                )}
              </button>
              {showAvatarPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-10 grid grid-cols-7 gap-1 w-72">
                  <button
                    type="button"
                    onClick={() => { setEditAvatar(''); setShowAvatarPicker(false); }}
                    className="text-sm p-2 rounded hover:bg-gray-100 text-gray-500 col-span-7 border-b mb-1"
                  >
                    {t('清除头像', 'Clear avatar')}
                  </button>
                  {AVATAR_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => { setEditAvatar(emoji); setShowAvatarPicker(false); }}
                      className={`text-2xl p-1 rounded hover:bg-gray-100 ${editAvatar === emoji ? 'bg-blue-100' : ''}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('所属组别', 'Group')}
            </label>
            <select
              value={editGroupId}
              onChange={e => setEditGroupId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {currentGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              {t('取消', 'Cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
              {t('保存', 'Save')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Batch Add Section */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">
              {t('批量添加学生', 'Add Students in Batch')}
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('选择组别', 'Select Group')}
              </label>
              <select
                value={selectedGroupId}
                onChange={e => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('请选择组别', 'Select a group')}</option>
                {currentGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('学生姓名（每行一个或用逗号分隔）', 'Student names (one per line or comma-separated)')}
              </label>
              <textarea
                value={studentNames}
                onChange={e => setStudentNames(e.target.value)}
                placeholder={t('张三\n李四\n王五', 'Alice\nBob\nCharlie')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              />
            </div>
            <Button
              onClick={handleBatchAdd}
              disabled={!selectedGroupId || !studentNames.trim()}
            >
              {t('添加学生', 'Add Students')}
            </Button>
          </div>

          {/* Student List Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">
                {t('学生列表', 'Student List')} ({currentStudents.length})
              </h3>
              {currentStudents.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleResetScores}>
                  {t('重置所有分数', 'Reset All Scores')}
                </Button>
              )}
            </div>

            {currentStudents.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                {t('暂无学生', 'No students yet')}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {currentGroups.map(group => {
                  const groupStudents = currentStudents.filter(
                    s => s.groupId === group.id
                  );
                  if (groupStudents.length === 0) return null;

                  return (
                    <div key={group.id} className="space-y-1">
                      <div
                        className="text-sm font-medium px-2 py-1 rounded"
                        style={{ backgroundColor: group.color + '20', color: group.color }}
                      >
                        {group.name} ({groupStudents.length})
                      </div>
                      {groupStudents.map(student => (
                        <div
                          key={student.id}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          {student.avatar ? (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-lg shrink-0">
                              {student.avatar}
                            </div>
                          ) : (
                            <div
                              className="w-2 h-6 rounded shrink-0"
                              style={{ backgroundColor: group.color }}
                            />
                          )}
                          <span className="flex-1">{student.name}</span>
                          <span className={`font-medium ${student.score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {student.score}
                          </span>
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
