import { useCallback, useMemo } from 'react';
import { useApp } from '@/app/AppProvider';
import { createDefaultGamification, cloneGamificationSnapshot } from '@/shared/utils/gamification';
import { generateId } from '@/shared/utils/storage';
import { formatDateKey } from '@/shared/utils/date';
import type { StudentGamification, AttendanceRecord } from '@/shared/types';
import { applyAttendanceMakeup, applyAttendanceRevoke, applyAttendanceToday, applyPositiveScore, applyRewardRedemption, type GamificationEventDraft } from '@/services/gamificationEngine';
import { computeScoreStreaks } from '@/services/scoreStreaks';

export function useGamification() {
  const { state, dispatch, t } = useApp();

  const exemptDates = useMemo(() => {
    const dates = state.attendanceExemptions
      .filter(e => e.classId === state.currentClassId)
      .map(e => e.date);
    return new Set(dates);
  }, [state.attendanceExemptions, state.currentClassId]);

  const getGamification = useCallback((studentId: string): StudentGamification => {
    return state.gamification.find(g => g.studentId === studentId) || createDefaultGamification(studentId);
  }, [state.gamification]);

  const dispatchEvents = useCallback((events: GamificationEventDraft[], now: number) => {
    events.forEach(event => {
      dispatch({
        type: 'ADD_GAMIFICATION_EVENT',
        payload: {
          id: generateId(),
          timestamp: now,
          ...event,
        },
      });
    });
  }, [dispatch]);

  const processScore = useCallback((studentId: string, studentName: string, scoreValue: number) => {
    const gam = getGamification(studentId);
    const now = Date.now();
    const { gam: next, events } = applyPositiveScore(gam, scoreValue, {
      studentId,
      studentName,
      customBadges: state.customBadges,
      exemptDates,
      t,
      now,
    });
    dispatchEvents(events, now);
    dispatch({ type: 'UPDATE_GAMIFICATION', payload: next });
  }, [getGamification, dispatch, dispatchEvents, t, state.customBadges]);

  const processReward = useCallback((studentId: string, studentName: string) => {
    const gam = getGamification(studentId);
    const now = Date.now();
    const { gam: next, events } = applyRewardRedemption(gam, {
      studentId,
      studentName,
      customBadges: state.customBadges,
      t,
      now,
    });
    dispatchEvents(events, now);
    dispatch({ type: 'UPDATE_GAMIFICATION', payload: next });
  }, [getGamification, dispatch, dispatchEvents, t, state.customBadges]);

  const processAttendance = useCallback((studentId: string, studentName: string, attendanceMeta?: AttendanceRecord) => {
    const snapshot = cloneGamificationSnapshot(getGamification(studentId));
    const todayStr = formatDateKey(new Date());

    // Skip if already marked today
    const currentGam = getGamification(studentId);
    if (currentGam.lastAttendanceDate === todayStr) {
      return;
    }
    const now = Date.now();
    const { gam, events } = applyAttendanceToday(currentGam, {
      studentId,
      studentName,
      customBadges: state.customBadges,
      exemptDates,
      t,
      now,
    }, todayStr);

    // Update gamification state
    dispatch({ type: 'UPDATE_GAMIFICATION', payload: gam });
    dispatchEvents(events, now);

    // Also add score to student
    dispatch({ type: 'UPDATE_STUDENT_SCORE', payload: { studentId, delta: 1 } });

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
        value: 1,
        timestamp: Date.now(),
        note: t('每日出勤', 'Daily attendance'),
        gamificationSnapshot: snapshot,
        attendanceMeta,
      },
    });
  }, [getGamification, dispatch, dispatchEvents, t, state.customBadges, state.currentClassId, exemptDates]);

  // Process makeup attendance (for past dates - no streak bonus, just score and XP)
  const processAttendanceMakeup = useCallback((studentId: string, studentName: string, date: string, attendanceMeta?: AttendanceRecord) => {
    const snapshot = cloneGamificationSnapshot(getGamification(studentId));
    const now = Date.now();
    const { gam, events } = applyAttendanceMakeup(getGamification(studentId), {
      studentId,
      studentName,
      customBadges: state.customBadges,
      t,
      now,
    });

    const classId = state.currentClassId;
    const historyRecord = {
      id: generateId(),
      classId: classId || '',
      type: 'score' as const,
      targetType: 'student' as const,
      targetId: studentId,
      targetName: studentName,
      itemId: 'attendance_makeup',
      itemName: t('补签出勤', 'Makeup Attendance'),
      value: 1,
      timestamp: now,
      note: t(`补签日期: ${date}`, `Makeup date: ${date}`),
      gamificationSnapshot: snapshot,
      attendanceMeta,
    };

    if (classId) {
      const exemptions = state.attendanceExemptions.filter(e => e.classId === classId);
      const updatedHistory = [...state.history, historyRecord];
      const streaks = computeScoreStreaks(updatedHistory, exemptions, [studentId]);
      const summary = streaks[studentId];
      if (summary) {
        gam.currentStreak = summary.currentStreak;
        gam.longestStreak = summary.longestStreak;
        gam.lastPositiveScoringDate = summary.lastPositiveScoringDate;
      }
    }

    // Update gamification state
    dispatch({ type: 'UPDATE_GAMIFICATION', payload: gam });
    dispatchEvents(events, now);

    // Also add score to student
    dispatch({ type: 'UPDATE_STUDENT_SCORE', payload: { studentId, delta: 1 } });

    // Add history record
    dispatch({
      type: 'ADD_HISTORY',
      payload: historyRecord,
    });
  }, [getGamification, dispatch, dispatchEvents, t, state.customBadges, state.currentClassId, state.history, state.attendanceExemptions]);

  // Revoke attendance (deduct score and XP)
  const revokeAttendance = useCallback((studentId: string, studentName: string, date: string, attendanceMeta?: AttendanceRecord) => {
    const snapshot = cloneGamificationSnapshot(getGamification(studentId));
    const todayStr = formatDateKey(new Date());
    const gam = applyAttendanceRevoke(getGamification(studentId), date, todayStr);

    const classId = state.currentClassId;
    const historyRecord = {
      id: generateId(),
      classId: classId || '',
      type: 'score' as const,
      targetType: 'student' as const,
      targetId: studentId,
      targetName: studentName,
      itemId: 'attendance_revoke',
      itemName: t('撤销出勤', 'Revoke Attendance'),
      value: -1,
      timestamp: Date.now(),
      note: t(`撤销日期: ${date}`, `Revoked date: ${date}`),
      gamificationSnapshot: snapshot,
      attendanceMeta,
    };

    if (classId) {
      const exemptions = state.attendanceExemptions.filter(e => e.classId === classId);
      const updatedHistory = [...state.history, historyRecord];
      const streaks = computeScoreStreaks(updatedHistory, exemptions, [studentId]);
      const summary = streaks[studentId];
      if (summary) {
        gam.currentStreak = summary.currentStreak;
        gam.longestStreak = summary.longestStreak;
        gam.lastPositiveScoringDate = summary.lastPositiveScoringDate;
      }
    }

    // Update gamification state
    dispatch({ type: 'UPDATE_GAMIFICATION', payload: gam });

    // Deduct score from student
    dispatch({ type: 'UPDATE_STUDENT_SCORE', payload: { studentId, delta: -1 } });

    // Add history record for the revocation
    dispatch({
      type: 'ADD_HISTORY',
      payload: historyRecord,
    });
  }, [getGamification, dispatch, t, state.currentClassId, state.history, state.attendanceExemptions]);

  return { getGamification, processScore, processReward, processAttendance, processAttendanceMakeup, revokeAttendance };
}
