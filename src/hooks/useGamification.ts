import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { getLevelForXp, updateStreak, createDefaultGamification, STREAK_MILESTONES } from '../utils/gamification';
import { checkBadges, getBadgeById } from '../utils/badges';
import { generateId } from '../utils/storage';
import type { StudentGamification } from '../types';

export function useGamification() {
  const { state, dispatch, t } = useApp();

  const getGamification = useCallback((studentId: string): StudentGamification => {
    return state.gamification.find(g => g.studentId === studentId) || createDefaultGamification(studentId);
  }, [state.gamification]);

  const processScore = useCallback((studentId: string, studentName: string, scoreValue: number) => {
    let gam = getGamification(studentId);

    if (scoreValue > 0) {
      // Add XP
      const newXp = gam.xp + scoreValue;
      const oldLevel = getLevelForXp(gam.xp);
      const newLevel = getLevelForXp(newXp);

      gam = {
        ...gam,
        xp: newXp,
        level: newLevel.level,
        totalPositiveScores: gam.totalPositiveScores + 1,
      };

      // Update streak
      gam = updateStreak(gam);

      // Check level up
      if (newLevel.level > oldLevel.level) {
        dispatch({
          type: 'ADD_GAMIFICATION_EVENT',
          payload: {
            id: generateId(),
            type: 'level_up',
            studentId,
            studentName,
            data: {
              newLevel: newLevel.level,
              levelEmoji: newLevel.emoji,
              levelName: t(newLevel.name, newLevel.nameEn),
            },
            timestamp: Date.now(),
          },
        });
      }

      // Check streak milestones
      for (const milestone of STREAK_MILESTONES) {
        if (gam.currentStreak === milestone) {
          dispatch({
            type: 'ADD_GAMIFICATION_EVENT',
            payload: {
              id: generateId(),
              type: 'streak_milestone',
              studentId,
              studentName,
              data: { streakDays: milestone },
              timestamp: Date.now(),
            },
          });
          break;
        }
      }

      // Check badges (include custom badges from state)
      const newBadgeIds = checkBadges(gam, state.customBadges);
      if (newBadgeIds.length > 0) {
        const now = Date.now();
        gam = {
          ...gam,
          unlockedBadgeIds: [...gam.unlockedBadgeIds, ...newBadgeIds],
          badgeUnlockedAt: {
            ...gam.badgeUnlockedAt,
            ...Object.fromEntries(newBadgeIds.map(id => [id, now])),
          },
        };

        // Award bonus points for each badge earned
        let totalBonusPoints = 0;
        for (const badgeId of newBadgeIds) {
          const badge = getBadgeById(badgeId, state.customBadges);
          if (badge) {
            if (badge.bonusPoints && badge.bonusPoints > 0) {
              totalBonusPoints += badge.bonusPoints;
            }
            dispatch({
              type: 'ADD_GAMIFICATION_EVENT',
              payload: {
                id: generateId(),
                type: 'badge_earned',
                studentId,
                studentName,
                data: {
                  badgeId: badge.id,
                  badgeEmoji: badge.emoji,
                  badgeName: t(badge.name, badge.nameEn),
                  bonusPoints: badge.bonusPoints,
                },
                timestamp: Date.now(),
              },
            });
          }
        }

        // Add bonus XP from badges
        if (totalBonusPoints > 0) {
          gam = {
            ...gam,
            xp: gam.xp + totalBonusPoints,
          };
        }
      }
    }

    dispatch({ type: 'UPDATE_GAMIFICATION', payload: gam });
  }, [getGamification, dispatch, t, state.customBadges]);

  const processReward = useCallback((studentId: string, studentName: string) => {
    let gam = getGamification(studentId);
    gam = {
      ...gam,
      rewardRedeemedCount: gam.rewardRedeemedCount + 1,
    };

    // Check badges after reward (include custom badges)
    const newBadgeIds = checkBadges(gam, state.customBadges);
    if (newBadgeIds.length > 0) {
      const now = Date.now();
      gam = {
        ...gam,
        unlockedBadgeIds: [...gam.unlockedBadgeIds, ...newBadgeIds],
        badgeUnlockedAt: {
          ...gam.badgeUnlockedAt,
          ...Object.fromEntries(newBadgeIds.map(id => [id, now])),
        },
      };

      // Award bonus points for each badge earned
      let totalBonusPoints = 0;
      for (const badgeId of newBadgeIds) {
        const badge = getBadgeById(badgeId, state.customBadges);
        if (badge) {
          if (badge.bonusPoints && badge.bonusPoints > 0) {
            totalBonusPoints += badge.bonusPoints;
          }
          dispatch({
            type: 'ADD_GAMIFICATION_EVENT',
            payload: {
              id: generateId(),
              type: 'badge_earned',
              studentId,
              studentName,
              data: {
                badgeId: badge.id,
                badgeEmoji: badge.emoji,
                badgeName: t(badge.name, badge.nameEn),
                bonusPoints: badge.bonusPoints,
              },
              timestamp: Date.now(),
            },
          });
        }
      }

      // Add bonus XP from badges
      if (totalBonusPoints > 0) {
        gam = {
          ...gam,
          xp: gam.xp + totalBonusPoints,
        };
      }
    }

    dispatch({ type: 'UPDATE_GAMIFICATION', payload: gam });
  }, [getGamification, dispatch, t, state.customBadges]);

  const processAttendance = useCallback((studentId: string, studentName: string) => {
    let gam = getGamification(studentId);

    // Get today's date
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Skip if already marked today
    if (gam.lastAttendanceDate === todayStr) {
      return;
    }

    // Calculate attendance streak
    let newStreak = 1;
    if (gam.lastAttendanceDate) {
      const lastDate = new Date(gam.lastAttendanceDate);
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);
      if (diffDays === 1) {
        newStreak = (gam.attendanceStreak || 0) + 1;
      }
    }

    // Award +1 score and XP for attendance
    const attendanceScore = 1;
    const newXp = gam.xp + attendanceScore;
    const oldLevel = getLevelForXp(gam.xp);
    const newLevel = getLevelForXp(newXp);

    gam = {
      ...gam,
      xp: newXp,
      level: newLevel.level,
      attendanceDays: (gam.attendanceDays || 0) + 1,
      lastAttendanceDate: todayStr,
      attendanceStreak: newStreak,
      longestAttendanceStreak: Math.max(gam.longestAttendanceStreak || 0, newStreak),
      totalPositiveScores: gam.totalPositiveScores + 1,
    };

    // Also update the regular streak
    gam = updateStreak(gam);

    // Check level up
    if (newLevel.level > oldLevel.level) {
      dispatch({
        type: 'ADD_GAMIFICATION_EVENT',
        payload: {
          id: generateId(),
          type: 'level_up',
          studentId,
          studentName,
          data: {
            newLevel: newLevel.level,
            levelEmoji: newLevel.emoji,
            levelName: t(newLevel.name, newLevel.nameEn),
          },
          timestamp: Date.now(),
        },
      });
    }

    // Check attendance streak milestones
    const attendanceMilestones = [3, 7, 14, 30, 50, 100];
    for (const milestone of attendanceMilestones) {
      if (newStreak === milestone) {
        dispatch({
          type: 'ADD_GAMIFICATION_EVENT',
          payload: {
            id: generateId(),
            type: 'streak_milestone',
            studentId,
            studentName,
            data: { streakDays: milestone },
            timestamp: Date.now(),
          },
        });
        break;
      }
    }

    // Check badges (include attendance badges)
    const newBadgeIds = checkBadges(gam, state.customBadges);
    if (newBadgeIds.length > 0) {
      const now = Date.now();
      gam = {
        ...gam,
        unlockedBadgeIds: [...gam.unlockedBadgeIds, ...newBadgeIds],
        badgeUnlockedAt: {
          ...gam.badgeUnlockedAt,
          ...Object.fromEntries(newBadgeIds.map(id => [id, now])),
        },
      };

      // Award bonus points for each badge earned
      let totalBonusPoints = 0;
      for (const badgeId of newBadgeIds) {
        const badge = getBadgeById(badgeId, state.customBadges);
        if (badge) {
          if (badge.bonusPoints && badge.bonusPoints > 0) {
            totalBonusPoints += badge.bonusPoints;
          }
          dispatch({
            type: 'ADD_GAMIFICATION_EVENT',
            payload: {
              id: generateId(),
              type: 'badge_earned',
              studentId,
              studentName,
              data: {
                badgeId: badge.id,
                badgeEmoji: badge.emoji,
                badgeName: t(badge.name, badge.nameEn),
                bonusPoints: badge.bonusPoints,
              },
              timestamp: Date.now(),
            },
          });
        }
      }

      // Add bonus XP from badges
      if (totalBonusPoints > 0) {
        gam = {
          ...gam,
          xp: gam.xp + totalBonusPoints,
        };
      }
    }

    // Update gamification state
    dispatch({ type: 'UPDATE_GAMIFICATION', payload: gam });

    // Also add score to student
    dispatch({ type: 'UPDATE_STUDENT_SCORE', payload: { studentId, delta: attendanceScore } });

    // Add history record
    dispatch({
      type: 'ADD_HISTORY',
      payload: {
        id: generateId(),
        classId: state.currentClassId || '',
        type: 'score',
        targetType: 'student',
        targetId: studentId,
        targetName: studentName,
        itemId: 'attendance',
        itemName: t('出勤签到', 'Attendance'),
        value: attendanceScore,
        timestamp: Date.now(),
        note: t('每日出勤', 'Daily attendance'),
      },
    });
  }, [getGamification, dispatch, t, state.customBadges, state.currentClassId]);

  // Process makeup attendance (for past dates - no streak bonus, just score and XP)
  const processAttendanceMakeup = useCallback((studentId: string, studentName: string, date: string) => {
    let gam = getGamification(studentId);

    // Award +1 score and XP for makeup attendance (no streak update)
    const attendanceScore = 1;
    const newXp = gam.xp + attendanceScore;
    const oldLevel = getLevelForXp(gam.xp);
    const newLevel = getLevelForXp(newXp);

    gam = {
      ...gam,
      xp: newXp,
      level: newLevel.level,
      attendanceDays: (gam.attendanceDays || 0) + 1,
      totalPositiveScores: gam.totalPositiveScores + 1,
    };

    // Check level up
    if (newLevel.level > oldLevel.level) {
      dispatch({
        type: 'ADD_GAMIFICATION_EVENT',
        payload: {
          id: generateId(),
          type: 'level_up',
          studentId,
          studentName,
          data: {
            newLevel: newLevel.level,
            levelEmoji: newLevel.emoji,
            levelName: t(newLevel.name, newLevel.nameEn),
          },
          timestamp: Date.now(),
        },
      });
    }

    // Check badges
    const newBadgeIds = checkBadges(gam, state.customBadges);
    if (newBadgeIds.length > 0) {
      const now = Date.now();
      gam = {
        ...gam,
        unlockedBadgeIds: [...gam.unlockedBadgeIds, ...newBadgeIds],
        badgeUnlockedAt: {
          ...gam.badgeUnlockedAt,
          ...Object.fromEntries(newBadgeIds.map(id => [id, now])),
        },
      };

      // Award bonus points for each badge earned
      let totalBonusPoints = 0;
      for (const badgeId of newBadgeIds) {
        const badge = getBadgeById(badgeId, state.customBadges);
        if (badge) {
          if (badge.bonusPoints && badge.bonusPoints > 0) {
            totalBonusPoints += badge.bonusPoints;
          }
          dispatch({
            type: 'ADD_GAMIFICATION_EVENT',
            payload: {
              id: generateId(),
              type: 'badge_earned',
              studentId,
              studentName,
              data: {
                badgeId: badge.id,
                badgeEmoji: badge.emoji,
                badgeName: t(badge.name, badge.nameEn),
                bonusPoints: badge.bonusPoints,
              },
              timestamp: Date.now(),
            },
          });
        }
      }

      // Add bonus XP from badges
      if (totalBonusPoints > 0) {
        gam = {
          ...gam,
          xp: gam.xp + totalBonusPoints,
        };
      }
    }

    // Update gamification state
    dispatch({ type: 'UPDATE_GAMIFICATION', payload: gam });

    // Also add score to student
    dispatch({ type: 'UPDATE_STUDENT_SCORE', payload: { studentId, delta: attendanceScore } });

    // Add history record
    dispatch({
      type: 'ADD_HISTORY',
      payload: {
        id: generateId(),
        classId: state.currentClassId || '',
        type: 'score',
        targetType: 'student',
        targetId: studentId,
        targetName: studentName,
        itemId: 'attendance_makeup',
        itemName: t('补签出勤', 'Makeup Attendance'),
        value: attendanceScore,
        timestamp: Date.now(),
        note: t(`补签日期: ${date}`, `Makeup date: ${date}`),
      },
    });
  }, [getGamification, dispatch, t, state.customBadges, state.currentClassId]);

  // Revoke attendance (deduct score and XP)
  const revokeAttendance = useCallback((studentId: string, studentName: string, date: string) => {
    let gam = getGamification(studentId);

    // Deduct 1 score and XP
    const deductScore = -1;
    const newXp = Math.max(0, gam.xp - 1); // Ensure XP doesn't go below 0
    const newLevel = getLevelForXp(newXp);

    gam = {
      ...gam,
      xp: newXp,
      level: newLevel.level,
      attendanceDays: Math.max(0, (gam.attendanceDays || 0) - 1),
      totalPositiveScores: Math.max(0, gam.totalPositiveScores - 1),
    };

    // If revoking today's attendance, also reset lastAttendanceDate and streak
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (date === todayStr && gam.lastAttendanceDate === todayStr) {
      // Need to recalculate what the lastAttendanceDate should be
      // For simplicity, we'll just decrement the streak
      gam = {
        ...gam,
        attendanceStreak: Math.max(0, (gam.attendanceStreak || 0) - 1),
        lastAttendanceDate: null, // Reset, will need to be recalculated on next attendance
      };
    }

    // Update gamification state
    dispatch({ type: 'UPDATE_GAMIFICATION', payload: gam });

    // Deduct score from student
    dispatch({ type: 'UPDATE_STUDENT_SCORE', payload: { studentId, delta: deductScore } });

    // Add history record for the revocation
    dispatch({
      type: 'ADD_HISTORY',
      payload: {
        id: generateId(),
        classId: state.currentClassId || '',
        type: 'score',
        targetType: 'student',
        targetId: studentId,
        targetName: studentName,
        itemId: 'attendance_revoke',
        itemName: t('撤销出勤', 'Revoke Attendance'),
        value: deductScore,
        timestamp: Date.now(),
        note: t(`撤销日期: ${date}`, `Revoked date: ${date}`),
      },
    });
  }, [getGamification, dispatch, t, state.currentClassId]);

  return { getGamification, processScore, processReward, processAttendance, processAttendanceMakeup, revokeAttendance };
}
