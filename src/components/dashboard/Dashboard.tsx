import { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../common';
import { getLevelForXp, LEVEL_DEFINITIONS } from '../../utils/gamification';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Dashboard({ isOpen, onClose }: DashboardProps) {
  const { state, t } = useApp();
  const [showIndividual, setShowIndividual] = useState(true);

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

  const groupRankings = useMemo(() => {
    return currentGroups
      .map(group => {
        const groupStudents = currentStudents.filter(s => s.groupId === group.id);
        return { ...group, totalScore: group.score || 0, studentCount: groupStudents.length };
      })
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [currentGroups, currentStudents]);

  const studentRankings = useMemo(() => {
    return [...currentStudents]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [currentStudents]);

  // Weekly stars: all students with top positive scores in last 7 days (handles ties)
  const weeklyStars = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekHistory = state.history.filter(
      h => h.classId === state.currentClassId && h.type === 'score' && h.value > 0 && h.timestamp >= oneWeekAgo && h.targetType === 'student' && !h.undone
    );

    const studentScores: Record<string, number> = {};
    weekHistory.forEach(h => {
      studentScores[h.targetId] = (studentScores[h.targetId] || 0) + h.value;
    });

    // Find the highest score
    let bestScore = 0;
    Object.values(studentScores).forEach(score => {
      if (score > bestScore) bestScore = score;
    });

    if (bestScore === 0) return null;

    // Get all students with the best score (ties)
    const topStudentIds = Object.entries(studentScores)
      .filter(([, score]) => score === bestScore)
      .map(([id]) => id);

    const students = topStudentIds
      .map(id => currentStudents.find(s => s.id === id))
      .filter((s): s is typeof currentStudents[0] => s !== undefined);

    return students.length > 0 ? { students, weekScore: bestScore } : null;
  }, [state.history, state.currentClassId, currentStudents]);

  // Level distribution
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 to-purple-900 text-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{currentClass?.name || t('班级管理系统', 'Class Management System')}</h1>
            <p className="text-white/70">{t('分数排行榜', 'Score Leaderboard')}</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showIndividual}
                onChange={e => setShowIndividual(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span>{t('显示个人排名', 'Show Individual Rankings')}</span>
            </label>
            <Button variant="ghost" onClick={onClose} className="!text-white hover:!bg-white/10">
              {t('退出', 'Exit')} ✕
            </Button>
          </div>
        </div>
      </div>

      {!state.currentClassId ? (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-xl text-white/70">{t('请先选择一个班级', 'Please select a class first')}</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Weekly Stars (supports ties) */}
          {weeklyStars && (
            <div className="mb-8 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 backdrop-blur-sm rounded-2xl p-6 text-center ring-2 ring-yellow-400/50">
              <div className="text-5xl mb-2">⭐</div>
              <h2 className="text-2xl font-bold mb-1">
                {weeklyStars.students.length > 1
                  ? t('本周之星们', 'Stars of the Week')
                  : t('本周之星', 'Star of the Week')}
              </h2>
              <div className="flex flex-wrap justify-center gap-4 mt-3">
                {weeklyStars.students.map(student => {
                  const gam = gamMap.get(student.id);
                  const level = gam ? getLevelForXp(gam.xp) : LEVEL_DEFINITIONS[0];
                  return (
                    <div key={student.id} className="text-2xl font-bold">
                      <span>{level.emoji} </span>
                      {student.name}
                    </div>
                  );
                })}
              </div>
              <div className="text-white/80 mt-2">
                {t('本周获得', 'Earned this week')}: +{weeklyStars.weekScore} {t('分', 'pts')}
                {weeklyStars.students.length > 1 && (
                  <span className="ml-2 text-yellow-300">
                    ({t('并列', 'Tied')})
                  </span>
                )}
              </div>
            </div>
          )}

          <div className={`grid gap-8 ${showIndividual ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
            {/* Group Rankings */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>🏆</span>
                {t('组别排名', 'Group Rankings')}
              </h2>
              <div className="space-y-4">
                {groupRankings.length === 0 ? (
                  <p className="text-white/50 text-center py-8">{t('暂无组别', 'No groups')}</p>
                ) : (
                  groupRankings.map((group, index) => (
                    <div
                      key={group.id}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-transform hover:scale-[1.02] ${
                        index === 0
                          ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 ring-2 ring-yellow-400/50'
                          : index === 1
                          ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20'
                          : index === 2
                          ? 'bg-gradient-to-r from-amber-700/20 to-amber-800/20'
                          : 'bg-white/5'
                      }`}
                    >
                      <div className="text-3xl w-12 text-center">{getRankEmoji(index)}</div>
                      <div
                        className="w-4 h-16 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <div className="flex-1">
                        <div className="text-xl font-bold">{group.name}</div>
                        <div className="text-white/60 text-sm">
                          {group.studentCount} {t('名学生', 'students')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold">{group.totalScore}</div>
                        <div className="text-white/60 text-sm">{t('总分', 'Total')}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Individual Rankings */}
            {showIndividual && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span>⭐</span>
                  {t('个人排名 TOP 10', 'Individual Rankings TOP 10')}
                </h2>
                <div className="space-y-3">
                  {studentRankings.length === 0 ? (
                    <p className="text-white/50 text-center py-8">{t('暂无学生', 'No students')}</p>
                  ) : (
                    studentRankings.map((student, index) => {
                      const group = getStudentGroup(student.id);
                      const gam = gamMap.get(student.id);
                      const level = gam ? getLevelForXp(gam.xp) : LEVEL_DEFINITIONS[0];
                      return (
                        <div
                          key={student.id}
                          className={`flex items-center gap-3 p-3 rounded-xl ${
                            index === 0
                              ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30'
                              : index === 1
                              ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20'
                              : index === 2
                              ? 'bg-gradient-to-r from-amber-700/20 to-amber-800/20'
                              : 'bg-white/5'
                          }`}
                        >
                          <div className="text-2xl w-10 text-center">{getRankEmoji(index)}</div>
                          {group && (
                            <div
                              className="w-2 h-10 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                          )}
                          <span className="text-lg">{level.emoji}</span>
                          <div className="flex-1">
                            <div className="font-bold">{student.name}</div>
                            {group && (
                              <div className="text-white/60 text-xs">{group.name}</div>
                            )}
                          </div>
                          {gam && gam.currentStreak > 0 && (
                            <span className="text-orange-400 text-sm">🔥{gam.currentStreak}</span>
                          )}
                          <div className="text-2xl font-bold">{student.score}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Level Distribution */}
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📊</span>
              {t('等级分布', 'Level Distribution')}
            </h2>
            <div className="grid grid-cols-6 gap-3">
              {levelDistribution.map(level => (
                <div key={level.level} className="text-center bg-white/5 rounded-xl p-3">
                  <div className="text-3xl mb-1">{level.emoji}</div>
                  <div className="text-sm font-medium">{t(level.name, level.nameEn)}</div>
                  <div className="text-2xl font-bold mt-1">{level.count}</div>
                  <div className="text-xs text-white/60">{t('人', 'students')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{currentGroups.length}</div>
              <div className="text-white/60">{t('组别', 'Groups')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{currentStudents.length}</div>
              <div className="text-white/60">{t('学生', 'Students')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {currentStudents.reduce((sum, s) => sum + Math.max(0, s.score), 0)}
              </div>
              <div className="text-white/60">{t('总加分', 'Total Added')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">
                {(currentStudents.reduce((sum, s) => sum + s.score, 0) / Math.max(1, currentStudents.length)).toFixed(1)}
              </div>
              <div className="text-white/60">{t('人均分数', 'Avg Score')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
