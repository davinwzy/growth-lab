import { useState, useMemo } from 'react';
import { AppProvider, useApp } from './AppProvider';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
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

function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center hover:bg-indigo-200 transition-colors"
        title={user.email || ''}
      >
        {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 clay-card p-3 min-w-[200px] space-y-2">
            <div className="text-sm text-slate-700 font-medium truncate px-1">
              {user.user_metadata?.full_name || user.email}
            </div>
            <div className="text-xs text-slate-500 truncate px-1">{user.email}</div>
            <hr className="border-slate-200" />
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              退出登录 / Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

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

  const handleCreateClass = () => {
    const trigger = document.getElementById('class-selector-new');
    if (trigger) {
      trigger.click();
    }
  };

  return (
    <div className="min-h-screen lab-surface lab-strong-text">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center text-xl">
                🧪
              </div>
              <div className="hidden sm:block">
                <div className="text-lg font-bold font-display text-slate-900">
                  {t('成长实验室', 'Growth Lab')}
                </div>
                <div className="text-xs text-slate-500">
                  Growing together, one step at a time.
                </div>
              </div>
              <ClassSelector />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDashboard(true)}
                className="btn-highlight hover:brightness-105"
              >
                {t('展示', 'Dashboard')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAttendance(true)}
                className="btn-highlight hover:brightness-105"
              >
                {t('出勤', 'Attendance')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowStudentManager(true)}>
                {t('学生', 'Students')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowGroupManager(true)}>
                {t('组别', 'Groups')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowBadgeManager(true)}>
                {t('成就', 'Badges')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowRewardManager(true)}>
                {t('礼物', 'Rewards')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowSettlement(true)}>
                {t('结算', 'Settle')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowScoreItemManager(true)}>
                {t('加减分项', 'Score Items')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowHistory(true)}>
                {t('历史', 'History')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowSettings(true)}>
                {t('设置', 'Settings')}
              </Button>
              <LanguageSwitch />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {!state.currentClassId ? (
          <div className="space-y-8">
            <section className="clay-card lab-hero p-6 md:p-10 grid gap-6 md:grid-cols-1 lab-animate">
              <div className="space-y-4">
                <span className="lab-badge">{t('成长实验室', 'GROWTH LAB')}</span>
                <h2 className="text-3xl md:text-4xl font-display text-slate-900">
                  {t('成长实验室', 'Growth Lab')}
                </h2>
                <p className="text-lg font-semibold text-slate-700">
                  Growing together, one step at a time.
                </p>
                <p className="text-slate-600">
                  {t('把努力变成实验，把进步变成结果', 'Turn effort into experiments and progress into results.')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" onClick={handleCreateClass}>
                    {t('创建班级', 'Create Class')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="clay-pill px-3 py-1">{t('挑战', 'Challenges')}</span>
                  <span className="clay-pill px-3 py-1">{t('成长轨迹', 'Growth Path')}</span>
                  <span className="clay-pill px-3 py-1">{t('奖励解锁', 'Rewards')}</span>
                </div>
              </div>
            </section>

          </div>
        ) : currentGroups.length === 0 && !state.onboardingStep ? (
          <div className="space-y-6">
            <section className="clay-card lab-hero p-6 md:p-8 text-center space-y-3">
              <div className="text-4xl">🧪</div>
              <h2 className="text-2xl font-display text-slate-900">
                {t('实验室准备好了，只差你的分组', 'Your lab is ready for teams')}
              </h2>
              <p className="text-slate-600">
                {t('创建组别后即可开始记录成长', 'Create groups to start tracking progress')}
              </p>
              <Button onClick={() => setShowGroupManager(true)}>
                {t('创建组别', 'Create Groups')}
              </Button>
            </section>
          </div>
        ) : (
          <>
            {/* Batch Operation Bar */}
            {selectionMode ? (
              <div className="clay-card p-3 mb-4 flex flex-wrap items-center gap-3 justify-between bg-white/80">
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    {t(`已选择 ${selectedStudentIds.size} 名学生`, `${selectedStudentIds.size} students selected`)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="!text-slate-700 hover:!bg-white/70"
                  >
                    {selectedStudentIds.size === currentStudents.length
                      ? t('取消全选', 'Deselect All')
                      : t('全选', 'Select All')}
                  </Button>
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
                </div>
                <div className="flex items-center gap-2">
                  {selectedStudentIds.size > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowBatchModal(true)}
                    >
                      {t('加减分', 'Score')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exitSelectionMode}
                    className="!text-slate-700 hover:!bg-white/70"
                  >
                    {t('取消', 'Cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end mb-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectionMode(true)}
                >
                  {t('批量操作', 'Batch Mode')}
                </Button>
              </div>
            )}

            {/* Group Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen lab-surface flex items-center justify-center">
        <div className="clay-card p-8 text-center space-y-3 lab-animate">
          <div className="text-4xl">🧪</div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppProvider userId={user.id}>
      <AppContent />
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
