import { useState } from 'react';
import { useApp } from '@/app/AppProvider';
import { Modal, Button } from '@/shared/components';
import { generateId } from '@/shared/utils/storage';
import type { Class } from '@/shared/types';

export function ClassSelector() {
  const { state, dispatch, t } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [className, setClassName] = useState('');

  const currentClass = state.classes.find(c => c.id === state.currentClassId);

  const handleAddClass = () => {
    setEditingClass(null);
    setClassName('');
    setIsModalOpen(true);
  };

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleSaveClass = () => {
    if (!className.trim()) return;

    if (editingClass) {
      dispatch({
        type: 'UPDATE_CLASS',
        payload: { ...editingClass, name: className.trim() },
      });
    } else {
      const newClass: Class = {
        id: generateId(),
        name: className.trim(),
        createdAt: Date.now(),
      };
      dispatch({ type: 'ADD_CLASS', payload: newClass });
      dispatch({ type: 'SET_CURRENT_CLASS', payload: newClass.id });
      dispatch({ type: 'START_ONBOARDING', payload: newClass.id });
    }
    setIsModalOpen(false);
    setClassName('');
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm(t('确定要删除这个班级吗？所有相关数据都将被删除。', 'Are you sure you want to delete this class? All related data will be deleted.'))) {
      dispatch({ type: 'DELETE_CLASS', payload: classId });
    }
    setIsDropdownOpen(false);
  };

  const handleSelectClass = (classId: string) => {
    dispatch({ type: 'SET_CURRENT_CLASS', payload: classId });
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 lab-select hover:bg-white/90 transition-colors min-w-[150px]"
        >
          <span className="font-medium">
            {currentClass ? currentClass.name : t('选择班级', 'Select Class')}
          </span>
          <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <Button id="class-selector-new" size="sm" onClick={handleAddClass}>
          + {t('新建班级', 'New Class')}
        </Button>
      </div>

      {isDropdownOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 clay-card z-20">
            {state.classes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {t('暂无班级', 'No classes yet')}
              </div>
            ) : (
              <ul className="py-1">
                {state.classes.map(cls => (
                  <li key={cls.id} className="flex items-center hover:bg-gray-50">
                    <button
                      onClick={() => handleSelectClass(cls.id)}
                      className={`flex-1 px-4 py-2 text-left ${
                        cls.id === state.currentClassId ? 'font-semibold text-blue-600' : ''
                      }`}
                    >
                      {cls.name}
                    </button>
                    <button
                      onClick={() => handleEditClass(cls)}
                      className="p-2 hover:text-blue-600"
                      title={t('编辑', 'Edit')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="p-2 hover:text-red-600"
                      title={t('删除', 'Delete')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? t('编辑班级', 'Edit Class') : t('新建班级', 'New Class')}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('班级名称', 'Class Name')}
            </label>
            <input
              type="text"
              value={className}
              onChange={e => setClassName(e.target.value)}
              placeholder={t('例如：三年级一班', 'e.g., Grade 3 Class 1')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSaveClass()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('取消', 'Cancel')}
            </Button>
            <Button onClick={handleSaveClass} disabled={!className.trim()}>
              {t('保存', 'Save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
