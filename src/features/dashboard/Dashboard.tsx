import { useMemo, useState } from 'react';
import { useApp } from '@/app/AppProvider';
import { Button } from '@/shared/components';
import { getLevelForXp, LEVEL_DEFINITIONS } from '@/shared/utils/gamification';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'group' | 'student';

export function Dashboard({ isOpen, onClose }: DashboardProps) {
  const { state, t } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('group');
  const [studentRankingTab, setStudentRankingTab] = useState<'total' | 'weekly'>('total');
  const [groupRankingTab, setGroupRankingTab] = useState<'total' | 'weekly'>('weekly');

  const currentClass = state.classes.find(c => c.id === state.currentClassId);

  const currentGroups = useMemo(() => {
    return state.groups
      .filter(g => g.classId === state.currentClassId)
      .sort((a, b) => a.order - b.order);
  }, [state.groups, state.currentClassId]);

  const currentStudents = useMemo(() => {
    return state.students.filter(s => s.classId === state.currentClassId);
  }, [state.students, state.currentClassId]);

  const gamMap = useMemo(() => {
    const map = new Map<string, typeof state.gamification[0]>();
    state.gamification.forEach(g => map.set(g.studentId, g));
    return map;
  }, [state.gamification]);

  const weekRange = useMemo(() => {
    const now = new Date();
    const dayIndex = (now.getDay() + 6) % 7; // Monday = 0
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayIndex);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }, []);

  const weekHistory = useMemo(() => {
    return state.history.filter(h =>
      h.classId === state.currentClassId &&
      h.type === 'score' &&
      h.value > 0 &&
      h.timestamp >= weekRange.start.getTime() &&
      h.timestamp < weekRange.end.getTime() &&
      !h.undone
    );
  }, [state.history, state.currentClassId, weekRange]);

  const weeklyGroupRankings = useMemo(() => {
    const scores: Record<string, number> = {};
    currentGroups.forEach(g => { scores[g.id] = 0; });
    weekHistory
      .filter(h => h.targetType === 'group')
      .forEach(h => { scores[h.targetId] = (scores[h.targetId] || 0) + h.value; });
    return currentGroups
      .map(group => {
        const groupStudents = currentStudents.filter(s => s.groupId === group.id);
        return { ...group, weekScore: scores[group.id] || 0, studentCount: groupStudents.length };
      })
      .sort((a, b) => b.weekScore - a.weekScore);
  }, [currentGroups, currentStudents, weekHistory]);

  const totalGroupRankings = useMemo(() => {
    return currentGroups
      .map(group => {
        const groupStudents = currentStudents.filter(s => s.groupId === group.id);
        return { ...group, totalScore: group.score || 0, studentCount: groupStudents.length };
      })
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [currentGroups, currentStudents]);

  const weeklyStudentRankings = useMemo(() => {
    const scores: Record<string, number> = {};
    currentStudents.forEach(s => { scores[s.id] = 0; });
    weekHistory
      .filter(h => h.targetType === 'student')
      .forEach(h => { scores[h.targetId] = (scores[h.targetId] || 0) + h.value; });
    return [...currentStudents]
      .map(s => ({ ...s, weekScore: scores[s.id] || 0 }))
      .sort((a, b) => b.weekScore - a.weekScore);
  }, [currentStudents, weekHistory]);

  const totalStudentRankings = useMemo(() => {
    return [...currentStudents].sort((a, b) => b.score - a.score);
  }, [currentStudents]);


  const levelDistribution = useMemo(() => {
    const dist: Record<number, number> = {};
    LEVEL_DEFINITIONS.forEach(l => { dist[l.level] = 0; });
    currentStudents.forEach(s => {
      const gam = gamMap.get(s.id);
      const level = gam ? getLevelForXp(gam.xp).level : 1;
      dist[level] = (dist[level] || 0) + 1;
    });
    return LEVEL_DEFINITIONS.map(l => ({ ...l, count: dist[l.level] || 0 }));
  }, [currentStudents, gamMap]);

  const getStudentGroup = (studentId: string) => {
    const student = currentStudents.find(s => s.id === studentId);
    if (!student) return null;
    return currentGroups.find(g => g.id === student.groupId);
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const renderPodium = (
    items: Array<{ id: string; name: string; score: number }>,
    mode: 'weekly' | 'total'
  ) => {
    const slots = [
      {
        rank: 2,
        heightClass: 'h-24 sm:h-28 md:h-32',
        widthClass: 'w-32 sm:w-40 md:w-52',
        bgClass: 'bg-gradient-to-b from-slate-100 to-slate-200',
        badgeClass: 'bg-slate-200 text-slate-700',
        edgeClass: 'rounded-l-3xl',
      },
      {
        rank: 1,
        heightClass: 'h-32 sm:h-40 md:h-44',
        widthClass: 'w-36 sm:w-48 md:w-60',
        bgClass: 'bg-gradient-to-b from-amber-200 to-amber-300 ring-2 ring-amber-300/70',
        badgeClass: 'bg-amber-300 text-amber-900',
        edgeClass: '',
      },
      {
        rank: 3,
        heightClass: 'h-20 sm:h-24 md:h-28',
        widthClass: 'w-32 sm:w-40 md:w-52',
        bgClass: 'bg-gradient-to-b from-orange-200 to-orange-300',
        badgeClass: 'bg-orange-200 text-orange-900',
        edgeClass: 'rounded-r-3xl',
      },
    ];

    return (
      <div className="flex items-end justify-center pt-10">
        {slots.map((slot, index) => {
          const item = items[slot.rank - 1];
          if (!item) return null;
          const hasPrev = index > 0 && Boolean(items[slots[index - 1].rank - 1]);
          const joinClass = hasPrev ? '-ml-px' : '';
          const displayScore = mode === 'weekly' ? `+${item.score}` : `${item.score}`;

          return (
            <div
              key={item.id}
              className={`relative ${slot.widthClass} ${slot.heightClass} ${slot.bgClass} ${slot.edgeClass} ${joinClass} border border-white/70 shadow-lg shadow-slate-200/70 flex flex-col items-center justify-end pb-3 px-2`}
            >
              <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shadow-md ${slot.badgeClass}`}>
                {slot.rank}
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm text-slate-700 truncate">{item.name}</div>
                <div className="text-xs text-slate-500">{displayScore} {t('分', 'pts')}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  const weekLabel = `${weekRange.start.toLocaleDateString()} - ${new Date(weekRange.end.getTime() - 1).toLocaleDateString()}`;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-sky-100 via-white to-amber-50 text-slate-800 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-teal-400 rounded-2xl flex items-center justify-center shadow-lg text-white">
              <span className="text-2xl">🏫</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900">
                {currentClass?.name || t('班级管理系统', 'Class Management System')}
              </h1>
              <p className="text-teal-600 font-semibold text-xs tracking-[0.2em]">
                {t('趣味排行榜', 'FUN LEADERBOARD')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/90 rounded-2xl shadow-md px-3 py-2">
            <div className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span>📅</span>
              <span>{weekLabel}</span>
            </div>
            <button
              onClick={() => setActiveTab('group')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'group' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {t('组别', 'Groups')}
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {t('个人', 'Students')}
            </button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="!rounded-xl !px-3 !py-2 !text-slate-600 !bg-slate-100 hover:!bg-slate-200"
            >
              ✕
            </Button>
          </div>
        </div>
      </div>

      {!state.currentClassId ? (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-xl text-slate-500">{t('请先选择一个班级', 'Please select a class first')}</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 pt-32 md:pt-24 pb-8">
          <div className="mb-6 text-slate-500 text-sm font-medium">
            {t('本周范围', 'This week')}: {weekLabel}
          </div>

          {activeTab === 'group' && (
            <div className="bg-white/80 rounded-3xl shadow-lg p-6 md:p-8 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-10 right-10 text-6xl text-teal-200/40">★</div>
                <div className="absolute top-16 left-10 text-4xl text-amber-200/60">●</div>
                <div className="absolute bottom-10 left-1/3 text-5xl text-orange-200/50">■</div>
              </div>
              <h2 className="relative z-10 text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900 font-display">
                <span>🏆</span>
                {groupRankingTab === 'weekly'
                  ? t('本周组别冠军榜', 'Weekly Group Champions')
                  : t('组别总分冠军榜', 'Total Group Champions')}
              </h2>
              <div className="relative z-10 flex items-center gap-2 mb-6">
                <button
                  onClick={() => setGroupRankingTab('total')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    groupRankingTab === 'total' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('总分榜', 'Total Rankings')}
                </button>
                <button
                  onClick={() => setGroupRankingTab('weekly')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    groupRankingTab === 'weekly' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('本周榜', 'Weekly Rankings')}
                </button>
              </div>
              <div className="mb-8">
                {groupRankingTab === 'weekly'
                  ? renderPodium(
                      weeklyGroupRankings.slice(0, 3).map(group => ({
                        id: group.id,
                        name: group.name,
                        score: group.weekScore,
                      })),
                      'weekly'
                    )
                  : renderPodium(
                      totalGroupRankings.slice(0, 3).map(group => ({
                        id: group.id,
                        name: group.name,
                        score: group.totalScore,
                      })),
                      'total'
                    )}
              </div>
              {groupRankingTab === 'weekly' && (
                <div className="space-y-4 relative z-10">
                  {weeklyGroupRankings.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">{t('暂无组别', 'No groups')}</p>
                  ) : (
                    weeklyGroupRankings.map((group, index) => (
                      <div
                        key={group.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border shadow-sm transition-transform hover:scale-[1.01] ${
                          index === 0
                            ? 'bg-amber-50 border-amber-200'
                            : index === 1
                            ? 'bg-slate-100 border-slate-200'
                            : index === 2
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-white border-slate-200/80'
                        }`}
                      >
                        <div className="text-2xl w-10 text-center">{getRankEmoji(index)}</div>
                        <div className="w-4 h-16 rounded-full" style={{ backgroundColor: group.color }} />
                        <div className="flex-1">
                          <div className="font-bold text-lg text-slate-900">{group.name}</div>
                          <div className="text-sm text-slate-500">{group.studentCount} {t('名学生', 'students')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-900">+{group.weekScore}</div>
                          <div className="text-sm text-slate-500">{t('本周得分', 'Weekly Score')}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {groupRankingTab === 'total' && (
                <>
                  <h3 className="relative z-10 text-xl font-bold mt-8 mb-4 text-slate-900 font-display">
                    {t('组别总分排名', 'Total Group Rankings')}
                  </h3>
                  <div className="space-y-3 relative z-10">
                    {totalGroupRankings.length === 0 ? (
                      <p className="text-slate-400 text-center py-6">{t('暂无组别', 'No groups')}</p>
                    ) : (
                      totalGroupRankings.map((group, index) => (
                        <div key={group.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
                          <div className="text-lg w-8 text-center">{getRankEmoji(index)}</div>
                          <div className="w-3 h-10 rounded-full" style={{ backgroundColor: group.color }} />
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">{group.name}</div>
                            <div className="text-xs text-slate-500">{group.studentCount} {t('名学生', 'students')}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-slate-900">{group.totalScore}</div>
                            <div className="text-xs text-slate-500">{t('总分', 'Total')}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'student' && (
            <div className="bg-white/80 rounded-3xl shadow-lg p-6 md:p-8 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-10 left-12 text-6xl text-blue-200/40">★</div>
                <div className="absolute top-20 right-10 text-4xl text-pink-200/60">●</div>
                <div className="absolute bottom-10 right-1/3 text-5xl text-amber-200/50">■</div>
              </div>
              <h2 className="relative z-10 text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900 font-display">
                <span>👑</span>
                {studentRankingTab === 'total'
                  ? t('个人总分冠军榜', 'Total Student Champions')
                  : t('本周个人冠军榜', 'Weekly Student Champions')}
              </h2>
              <div className="relative z-10 flex items-center gap-2 mb-6">
                <button
                  onClick={() => setStudentRankingTab('total')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    studentRankingTab === 'total' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('总分榜', 'Total Rankings')}
                </button>
                <button
                  onClick={() => setStudentRankingTab('weekly')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    studentRankingTab === 'weekly' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('本周榜', 'Weekly Rankings')}
                </button>
              </div>
              <div className="mb-8 relative z-10">
                {studentRankingTab === 'total'
                  ? renderPodium(
                      totalStudentRankings.slice(0, 3).map(student => ({
                        id: student.id,
                        name: student.name,
                        score: student.score,
                      })),
                      'total'
                    )
                  : renderPodium(
                      weeklyStudentRankings.slice(0, 3).map(student => ({
                        id: student.id,
                        name: student.name,
                        score: student.weekScore,
                      })),
                      'weekly'
                    )}
              </div>
              {studentRankingTab === 'weekly' && (
                <>
                  <h3 className="text-xl font-bold mb-4 text-slate-900 font-display">
                    {t('本周个人排名', 'Weekly Student Rankings')}
                  </h3>
                  <div className="space-y-3">
                    {weeklyStudentRankings.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">{t('暂无学生', 'No students')}</p>
                    ) : (
                      weeklyStudentRankings.map((student, index) => {
                        const group = getStudentGroup(student.id);
                        const gam = gamMap.get(student.id);
                        const level = gam ? getLevelForXp(gam.xp) : LEVEL_DEFINITIONS[0];
                        return (
                          <div
                            key={student.id}
                            className={`flex items-center gap-3 p-3 rounded-2xl border shadow-sm ${
                              index === 0
                                ? 'bg-amber-50 border-amber-200'
                                : index === 1
                                ? 'bg-slate-100 border-slate-200'
                                : index === 2
                                ? 'bg-orange-50 border-orange-200'
                                : 'bg-white border-slate-200/70'
                            }`}
                          >
                            <div className="text-xl w-10 text-center">{getRankEmoji(index)}</div>
                            {group && <div className="w-2 h-10 rounded-full" style={{ backgroundColor: group.color }} />}
                            <span className="text-lg">{level.emoji}</span>
                            <div className="flex-1">
                              <div className="font-bold text-slate-900">{student.name}</div>
                              {group && <div className="text-slate-500 text-xs">{group.name}</div>}
                            </div>
                            {gam && gam.currentStreak > 0 && (
                              <span className="text-orange-500 text-sm">🔥{gam.currentStreak}</span>
                            )}
                            <div className="text-xl font-bold text-slate-900">+{student.weekScore}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
              {studentRankingTab === 'total' && (
                <>
                  <h3 className="text-xl font-bold mb-4 text-slate-900 font-display">
                    {t('个人总分排名', 'Total Student Rankings')}
                  </h3>
                  <div className="space-y-3">
                    {totalStudentRankings.length === 0 ? (
                      <p className="text-slate-400 text-center py-6">{t('暂无学生', 'No students')}</p>
                    ) : (
                      totalStudentRankings.map((student, index) => {
                        const group = getStudentGroup(student.id);
                        const gam = gamMap.get(student.id);
                        const level = gam ? getLevelForXp(gam.xp) : LEVEL_DEFINITIONS[0];
                        return (
                          <div key={student.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
                            <div className="text-lg w-8 text-center">{getRankEmoji(index)}</div>
                            {group && <div className="w-2 h-10 rounded-full" style={{ backgroundColor: group.color }} />}
                            <span className="text-lg">{level.emoji}</span>
                            <div className="flex-1">
                              <div className="font-bold text-slate-900">{student.name}</div>
                              {group && <div className="text-slate-500 text-xs">{group.name}</div>}
                            </div>
                            <div className="text-xl font-bold text-slate-900">{student.score}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Level Distribution */}
          <div className="mt-8 bg-white/80 rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 font-display">
              <span>📊</span>
              {t('等级分布', 'Level Distribution')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {levelDistribution.map(level => (
                <div key={level.level} className="text-center bg-white rounded-2xl p-3 border border-slate-200/70 shadow-sm">
                  <div className="text-3xl mb-1">{level.emoji}</div>
                  <div className="text-sm font-medium text-slate-700">{t(level.name, level.nameEn)}</div>
                  <div className="text-2xl font-bold mt-1 text-slate-900">{level.count}</div>
                  <div className="text-xs text-slate-500">{t('人', 'students')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-4 text-center border border-slate-200/70 shadow-sm">
              <div className="text-3xl font-bold text-slate-900">{currentGroups.length}</div>
              <div className="text-slate-500">{t('组别', 'Groups')}</div>
            </div>
            <div className="bg-white rounded-3xl p-4 text-center border border-slate-200/70 shadow-sm">
              <div className="text-3xl font-bold text-slate-900">{currentStudents.length}</div>
              <div className="text-slate-500">{t('学生', 'Students')}</div>
            </div>
            <div className="bg-white rounded-3xl p-4 text-center border border-slate-200/70 shadow-sm">
              <div className="text-3xl font-bold text-emerald-500">
                {currentStudents.reduce((sum, s) => sum + Math.max(0, s.score), 0)}
              </div>
              <div className="text-slate-500">{t('总加分', 'Total Added')}</div>
            </div>
            <div className="bg-white rounded-3xl p-4 text-center border border-slate-200/70 shadow-sm">
              <div className="text-3xl font-bold text-slate-900">
                {(currentStudents.reduce((sum, s) => sum + s.score, 0) / Math.max(1, currentStudents.length)).toFixed(1)}
              </div>
              <div className="text-slate-500">{t('人均分数', 'Avg Score')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
