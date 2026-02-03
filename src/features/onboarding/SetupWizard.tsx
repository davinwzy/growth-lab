import { useState, useEffect } from 'react';
import { useApp } from '@/app/AppProvider';
import { Modal, Button } from '@/shared/components';
import { generateId } from '@/shared/utils/storage';
import { groupColors } from '@/shared/utils/defaults';
import type { Student, Group } from '@/shared/types';

export function SetupWizard() {
  const { state, dispatch, t } = useApp();

  const isOpen = state.onboardingStep !== null && state.onboardingClassId !== null;
  const step = state.onboardingStep;
  const classId = state.onboardingClassId;

  // Step 1: Groups
  const [groupCount, setGroupCount] = useState(4);
  const [groupNames, setGroupNames] = useState<string[]>([]);

  // Step 2: Students
  const [studentText, setStudentText] = useState('');

  // Step 3: Assignment
  const [unassignedStudents, setUnassignedStudents] = useState<{ id: string; name: string }[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (groupCount < 1) return;
    setGroupNames(prev => {
      const updated = [...prev];
      for (let i = 0; i < groupCount; i++) {
        if (!updated[i]) {
          updated[i] = t(`第${i + 1}组`, `Group ${i + 1}`);
        }
      }
      return updated.slice(0, groupCount);
    });
  }, [groupCount, t]);

  if (!isOpen || !classId) return null;

  const currentGroups = state.groups.filter(g => g.classId === classId).sort((a, b) => a.order - b.order);
  const currentStudents = state.students.filter(s => s.classId === classId);

  const handleSetupGroups = () => {
    // Create groups
    const names = groupNames.length === groupCount
      ? groupNames
      : Array.from({ length: groupCount }, (_, i) =>
          t(`第${i + 1}组`, `Group ${i + 1}`)
        );

    names.forEach((name, i) => {
      const group: Group = {
        id: generateId(),
        classId,
        name,
        color: groupColors[i % groupColors.length],
        order: i,
        score: 0,
      };
      dispatch({ type: 'ADD_GROUP', payload: group });
    });

    dispatch({ type: 'SET_ONBOARDING_STEP', payload: 'add_students' });
  };

  const handleAddStudents = () => {
    const names = studentText
      .split(/[\n,，]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) {
      dispatch({ type: 'SET_ONBOARDING_STEP', payload: 'assign_groups' });
      return;
    }

    // Create students without group assignment yet (use first group as default)
    const groups = state.groups.filter(g => g.classId === classId).sort((a, b) => a.order - b.order);
    const firstGroupId = groups[0]?.id || '';

    const newStudents: Student[] = names.map(name => ({
      id: generateId(),
      classId,
      groupId: firstGroupId,
      name,
      score: 0,
      createdAt: Date.now(),
    }));

    dispatch({ type: 'ADD_STUDENTS', payload: newStudents });

    // Set up assignment state
    const unassigned = newStudents.map(s => ({ id: s.id, name: s.name }));
    setUnassignedStudents(unassigned);

    const initialAssignments: Record<string, string[]> = {};
    groups.forEach(g => { initialAssignments[g.id] = []; });
    setAssignments(initialAssignments);

    dispatch({ type: 'SET_ONBOARDING_STEP', payload: 'assign_groups' });
  };

  const handleAssignStudent = (studentId: string, groupId: string) => {
    // Remove from unassigned
    setUnassignedStudents(prev => prev.filter(s => s.id !== studentId));

    // Add to group assignment
    setAssignments(prev => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), studentId],
    }));

    // Update student's group
    const student = state.students.find(s => s.id === studentId);
    if (student) {
      dispatch({
        type: 'UPDATE_STUDENT',
        payload: { ...student, groupId },
      });
    }
  };

  const handleComplete = () => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  };

  const handleSkip = () => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  };

  const renderStep = () => {
    switch (step) {
      case 'setup_groups':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-3">👥</div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('设置组别', 'Set Up Groups')}
              </h2>
              <p className="text-gray-500 mt-1">
                {t('选择要分几个组', 'Choose how many groups to create')}
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">{t('组别数量', 'Group Count')}</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={groupCount}
                  onChange={e => {
                    const value = parseInt(e.target.value, 10);
                    if (isNaN(value) || value < 1) return;
                    setGroupCount(value);
                  }}
                  className="w-20 px-2 py-1 border rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Group name preview */}
            <div className="space-y-2">
              {Array.from({ length: groupCount }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: groupColors[i % groupColors.length] }}
                  />
                  <input
                    type="text"
                    value={groupNames[i] || t(`第${i + 1}组`, `Group ${i + 1}`)}
                    onChange={e => {
                      const updated = [...groupNames];
                      while (updated.length <= i) updated.push('');
                      updated[i] = e.target.value;
                      setGroupNames(updated);
                    }}
                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleSkip}>
                {t('跳过向导', 'Skip Wizard')}
              </Button>
              <Button onClick={handleSetupGroups}>
                {t('下一步', 'Next')} →
              </Button>
            </div>
          </div>
        );

      case 'add_students':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-3">📝</div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('添加学生', 'Add Students')}
              </h2>
              <p className="text-gray-500 mt-1">
                {t('输入学生姓名，每行一个或用逗号分隔', 'Enter student names, one per line or comma-separated')}
              </p>
            </div>

            <textarea
              value={studentText}
              onChange={e => setStudentText(e.target.value)}
              placeholder={t('张三\n李四\n王五\n赵六', 'Alice\nBob\nCharlie\nDiana')}
              className="w-full h-48 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              autoFocus
            />

            <div className="text-sm text-gray-500 text-center">
              {studentText.split(/[\n,，]/).filter(n => n.trim()).length} {t('名学生', 'students')}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleSkip}>
                {t('跳过', 'Skip')}
              </Button>
              <Button onClick={handleAddStudents}>
                {t('下一步', 'Next')} →
              </Button>
            </div>
          </div>
        );

      case 'assign_groups':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-3">🎯</div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('分配组别', 'Assign Groups')}
              </h2>
              <p className="text-gray-500 mt-1">
                {t('点击学生姓名，再点击组别来分配', 'Click a student name, then click a group to assign')}
              </p>
            </div>

            {/* Unassigned students */}
            {unassignedStudents.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {t('未分配学生', 'Unassigned Students')} ({unassignedStudents.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {unassignedStudents.map(s => (
                    <span key={s.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Groups with assign buttons */}
            <div className="grid grid-cols-2 gap-3">
              {currentGroups.map(group => {
                const assigned = assignments[group.id] || [];
                const assignedNames = assigned.map(id => {
                  const s = state.students.find(st => st.id === id);
                  return s?.name || '';
                });

                return (
                  <div
                    key={group.id}
                    className="border-2 rounded-xl p-3"
                    style={{ borderColor: group.color + '80' }}
                  >
                    <div
                      className="font-medium text-sm mb-2 px-2 py-1 rounded"
                      style={{ backgroundColor: group.color + '20', color: group.color }}
                    >
                      {group.name} ({assignedNames.length})
                    </div>
                    <div className="space-y-1 min-h-[40px]">
                      {assignedNames.map((name, i) => (
                        <div key={i} className="text-xs px-2 py-0.5 bg-gray-50 rounded">
                          {name}
                        </div>
                      ))}
                    </div>
                    {unassignedStudents.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {unassignedStudents.map(s => (
                          <button
                            key={s.id}
                            onClick={() => handleAssignStudent(s.id, group.id)}
                            className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          >
                            + {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleSkip}>
                {t('跳过', 'Skip')}
              </Button>
              <Button onClick={() => dispatch({ type: 'SET_ONBOARDING_STEP', payload: 'complete' })}>
                {t('完成设置', 'Finish Setup')} →
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('设置完成！', 'Setup Complete!')}
            </h2>
            <div className="text-gray-500 space-y-1">
              <p>{currentGroups.length} {t('个组别', 'groups')}</p>
              <p>{currentStudents.length} {t('名学生', 'students')}</p>
            </div>
            <p className="text-gray-500">
              {t('你现在可以开始使用班级管理系统了', 'You can now start using the class management system')}
            </p>
            <Button onClick={handleComplete} className="mx-auto">
              {t('开始使用', 'Get Started')} 🚀
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      title={t('班级初始化向导', 'Class Setup Wizard')}
      size="lg"
    >
      {renderStep()}
    </Modal>
  );
}
