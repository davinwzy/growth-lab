import { useState, useMemo } from 'react';
import { AppProvider, useApp } from './AppProvider';
import { Button, LanguageSwitch } from '@/shared/components';
import { ClassSelector } from '@/features/classes/ClassSelector';
import { GroupCard } from '@/features/groups/GroupCard';
import { GroupManager } from '@/features/groups/GroupManager';
import { StudentManager } from '@/features/students/StudentManager';
import { StudentActionMenu } from '@/features/students/StudentActionMenu';
import { BatchScoreModal } from '@/features/score/BatchScoreModal';
import { GroupScoreModal } from '@/features/score/GroupScoreModal';
import { ScoreItemManager } from '@/features/score/ScoreItemManager';
import { RewardManager } from '@/features/rewards/RewardManager';
import { HistoryList } from '@/features/history/HistoryList';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Settings } from '@/features/settings/Settings';
import { GamificationToast } from '@/features/gamification/GamificationToast';
import { LevelUpCelebration } from '@/features/gamification/LevelUpCelebration';
import { BadgeCollection } from '@/features/gamification/BadgeCollection';
import { BadgeManager } from '@/features/gamification/BadgeManager';
import { SetupWizard } from '@/features/onboarding/SetupWizard';
import { GroupSettlementModal } from '@/features/groups/GroupSettlementModal';
import { AttendanceModal } from '@/features/attendance/AttendanceModal';
import { useGamification } from '@/features/gamification/useGamification';
import type { Student, Group, StudentGamification } from '@/shared/types';

function AppContent() {
  const { state, t } = useApp();
  const { getGamification } = useGamification();

  // Modal states
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showStudentManager, setShowStudentManager] = useState(false);
  const [showScoreItemManager, setShowScoreItemManager] = useState(false);
  const [showRewardManager, setShowRewardManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBadgeCollection, setShowBadgeCollection] = useState(false);
  const [showBadgeManager, setShowBadgeManager] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [badgeStudent, setBadgeStudent] = useState<{ name: string; gam: StudentGamification } | null>(null);

  // Selection states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Get current class data
  const currentGroups = useMemo(() => {
    return state.groups
      .filter(g => g.classId === state.currentClassId)
      .sort((a, b) => a.order - b.order);
  }, [state.groups, state.currentClassId]);

  const currentStudents = useMemo(() => {
    return state.students.filter(s => s.classId === state.currentClassId);
  }, [state.students, state.currentClassId]);

  // Gamification map for current students
  const gamificationMap = useMemo(() => {
    const map = new Map<string, StudentGamification>();
    currentStudents.forEach(s => {
      map.set(s.id, getGamification(s.id));
    });
    return map;
  }, [currentStudents, getGamification]);

  const getGroupStudents = (groupId: string) => {
    return currentStudents.filter(s => s.groupId === groupId);
  };

  const handleStudentClick = (student: Student) => {
    if (!selectionMode) {
      const group = currentGroups.find(g => g.id === student.groupId) || null;
      setSelectedStudent(student);
      setSelectedGroup(group);
    }
  };

  const handleGroupClick = (group: Group) => {
    setSelectedGroup(group);
    setSelectedStudent(null);
  };

  const handleStudentSelect = (studentId: string) => {
    const newSelected = new Set(selectedStudentIds);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudentIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.size === currentStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(currentStudents.map(s => s.id)));
    }
  };

  const handleSelectGroup = (groupId: string) => {
    const groupStudentIds = currentStudents
      .filter(s => s.groupId === groupId)
      .map(s => s.id);

    const allSelected = groupStudentIds.every(id => selectedStudentIds.has(id));

    const newSelected = new Set(selectedStudentIds);
    if (allSelected) {
      groupStudentIds.forEach(id => newSelected.delete(id));
    } else {
      groupStudentIds.forEach(id => newSelected.add(id));
    }
    setSelectedStudentIds(newSelected);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedStudentIds(new Set());
    setShowBatchModal(false);
  };

  const handleViewBadges = (student: Student) => {
    setBadgeStudent({ name: student.name, gam: getGamification(student.id) });
    setShowBadgeCollection(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                {t('班级管理系统', 'Class Management')}
              </h1>
              <ClassSelector />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="ghost" size="sm" onClick={() => setShowGroupManager(true)}>
                {t('组别', 'Groups')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowStudentManager(true)}>
                {t('学生', 'Students')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowScoreItemManager(true)}>
                {t('加减分项', 'Score Items')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowRewardManager(true)}>
                {t('礼物', 'Rewards')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowBadgeManager(true)}>
                {t('成就', 'Badges')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
                {t('历史', 'History')}
              </Button>
              <Button variant="success" size="sm" onClick={() => setShowAttendance(true)}>
                {t('出勤', 'Attendance')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowSettlement(true)}>
                {t('结算', 'Settle')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowDashboard(true)}>
                {t('展示', 'Dashboard')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                ⚙️
              </Button>
              <LanguageSwitch />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {!state.currentClassId ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('欢迎使用班级管理系统', 'Welcome to Class Management System')}
            </h2>
            <p className="text-gray-500">
              {t('请先创建或选择一个班级开始使用', 'Please create or select a class to get started')}
            </p>
          </div>
        ) : currentGroups.length === 0 && !state.onboardingStep ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t('该班级还没有组别', 'This class has no groups yet')}
            </h2>
            <p className="text-gray-500 mb-4">
              {t('请先创建组别，然后添加学生', 'Please create groups first, then add students')}
            </p>
            <Button onClick={() => setShowGroupManager(true)}>
              {t('创建组别', 'Create Groups')}
            </Button>
          </div>
        ) : (
          <>
            {/* Batch Operation Bar */}
            {selectionMode && (
              <div className="bg-blue-500 text-white rounded-lg p-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span>
                    {t(`已选择 ${selectedStudentIds.size} 名学生`, `${selectedStudentIds.size} students selected`)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="!text-white hover:!bg-white/20"
                  >
                    {selectedStudentIds.size === currentStudents.length
                      ? t('取消全选', 'Deselect All')
                      : t('全选', 'Select All')}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exitSelectionMode}
                    className="!text-white hover:!bg-white/20"
                  >
                    {t('取消', 'Cancel')}
                  </Button>
                </div>
              </div>
            )}

            {/* Group Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  students={getGroupStudents(group.id)}
                  onStudentClick={handleStudentClick}
                  onGroupClick={handleGroupClick}
                  selectedStudents={selectedStudentIds}
                  onStudentSelect={handleStudentSelect}
                  selectionMode={selectionMode}
                  gamificationMap={gamificationMap}
                />
              ))}
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white rounded-full shadow-lg px-4 py-2">
              {!selectionMode ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectionMode(true)}
                  >
                    {t('批量操作', 'Batch Mode')}
                  </Button>
                </>
              ) : (
                <>
                  {currentGroups.map(group => (
                    <Button
                      key={group.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectGroup(group.id)}
                      style={{ borderColor: group.color, color: group.color }}
                      className="border"
                    >
                      {group.name}
                    </Button>
                  ))}
                  {selectedStudentIds.size > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowBatchModal(true)}
                    >
                      {t('加减分', 'Score')}
                    </Button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <GroupManager isOpen={showGroupManager} onClose={() => setShowGroupManager(false)} />
      <StudentManager isOpen={showStudentManager} onClose={() => setShowStudentManager(false)} />
      <ScoreItemManager isOpen={showScoreItemManager} onClose={() => setShowScoreItemManager(false)} />
      <RewardManager isOpen={showRewardManager} onClose={() => setShowRewardManager(false)} />
      <BadgeManager isOpen={showBadgeManager} onClose={() => setShowBadgeManager(false)} />
      <HistoryList isOpen={showHistory} onClose={() => setShowHistory(false)} />
      <Dashboard isOpen={showDashboard} onClose={() => setShowDashboard(false)} />
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Group Settlement */}
      <GroupSettlementModal isOpen={showSettlement} onClose={() => setShowSettlement(false)} />
      <AttendanceModal isOpen={showAttendance} onClose={() => setShowAttendance(false)} />

      {/* Student Action Menu */}
      <StudentActionMenu
        isOpen={!!selectedStudent && !selectionMode}
        onClose={() => {
          setSelectedStudent(null);
          setSelectedGroup(null);
        }}
        student={selectedStudent}
        group={selectedGroup}
        onViewBadges={selectedStudent ? () => handleViewBadges(selectedStudent) : undefined}
      />

      {/* Group Score Modal */}
      <GroupScoreModal
        isOpen={!!selectedGroup && !selectedStudent && !selectionMode}
        onClose={() => setSelectedGroup(null)}
        group={selectedGroup}
      />

      {/* Batch Score Modal */}
      <BatchScoreModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        selectedStudentIds={Array.from(selectedStudentIds)}
        onComplete={exitSelectionMode}
      />

      {/* Badge Collection */}
      {badgeStudent && (
        <BadgeCollection
          isOpen={showBadgeCollection}
          onClose={() => { setShowBadgeCollection(false); setBadgeStudent(null); }}
          studentName={badgeStudent.name}
          gamification={badgeStudent.gam}
        />
      )}

      {/* Gamification Overlays */}
      <GamificationToast />
      <LevelUpCelebration />

      {/* Setup Wizard */}
      <SetupWizard />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
