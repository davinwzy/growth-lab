import { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { AppState, AppAction } from '@/shared/types';
import { loadFromStorage, saveToStorage, loadFromCloud, saveToCloudDebounced, hasLocalData, clearLocalStorage } from '@/shared/utils/storage';
import { defaultScoreItems, defaultRewards } from '@/shared/utils/defaults';
import { createDefaultGamification } from '@/shared/utils/gamification';
import { computeAttendanceStreaks } from '@/services/attendanceStreaks';
import { computeScoreStreaks } from '@/services/scoreStreaks';
import { DEFAULT_BADGE_DEFINITIONS } from '@/shared/utils/badges';

export const initialState: AppState = {
  classes: [],
  currentClassId: null,
  groups: [],
  students: [],
  scoreItems: defaultScoreItems,
  rewards: defaultRewards,
  history: [],
  language: 'zh-CN',
  gamification: [],
  gamificationEvents: [],
  customBadges: [...DEFAULT_BADGE_DEFINITIONS], // Initialize with default badges
  attendanceRecords: [],
  attendanceExemptions: [],
  onboardingClassId: null,
  onboardingStep: null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };

    case 'LOAD_STATE': {
      const loaded = action.payload;
      return {
        ...state,
        ...loaded,
        scoreItems: loaded.scoreItems?.length ? loaded.scoreItems : defaultScoreItems,
        rewards: loaded.rewards?.length ? loaded.rewards : defaultRewards,
        gamification: (loaded.gamification || []).map(g => ({
          ...g,
          scoreItemCounts: g.scoreItemCounts || {},
        })),
        gamificationEvents: loaded.gamificationEvents || [],
        attendanceRecords: loaded.attendanceRecords || [],
        attendanceExemptions: loaded.attendanceExemptions || [],
        onboardingClassId: loaded.onboardingClassId || null,
        onboardingStep: loaded.onboardingStep || null,
      };
    }

    // Class actions
    case 'ADD_CLASS':
      return { ...state, classes: [...state.classes, action.payload] };

    case 'UPDATE_CLASS':
      return {
        ...state,
        classes: state.classes.map(c => c.id === action.payload.id ? action.payload : c),
      };

    case 'DELETE_CLASS': {
      const classId = action.payload;
      const deletedStudentIds = state.students.filter(s => s.classId === classId).map(s => s.id);
      return {
        ...state,
        classes: state.classes.filter(c => c.id !== classId),
        groups: state.groups.filter(g => g.classId !== classId),
        students: state.students.filter(s => s.classId !== classId),
        history: state.history.filter(h => h.classId !== classId),
        gamification: state.gamification.filter(g => !deletedStudentIds.includes(g.studentId)),
        attendanceRecords: state.attendanceRecords.filter(r => r.classId !== classId),
        attendanceExemptions: state.attendanceExemptions.filter(e => e.classId !== classId),
        currentClassId: state.currentClassId === classId ? null : state.currentClassId,
      };
    }

    case 'SET_CURRENT_CLASS':
      return { ...state, currentClassId: action.payload };

    // Group actions
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, action.payload] };

    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map(g => g.id === action.payload.id ? action.payload : g),
      };

    case 'DELETE_GROUP': {
      const groupId = action.payload;
      const deletedStudentIds = state.students.filter(s => s.groupId === groupId).map(s => s.id);
      return {
        ...state,
        groups: state.groups.filter(g => g.id !== groupId),
        students: state.students.filter(s => s.groupId !== groupId),
        gamification: state.gamification.filter(g => !deletedStudentIds.includes(g.studentId)),
      };
    }

    case 'REORDER_GROUPS':
      return { ...state, groups: action.payload };

    case 'UPDATE_GROUP_POINTS':
      return {
        ...state,
        groups: state.groups.map(g =>
          g.id === action.payload.groupId
            ? { ...g, score: (g.score || 0) + action.payload.delta }
            : g
        ),
      };

    case 'SETTLE_GROUP_SCORES': {
      let settledStudents = [...state.students];
      for (const bonus of action.payload.bonuses) {
        settledStudents = settledStudents.map(s =>
          s.groupId === bonus.groupId && s.classId === action.payload.classId
            ? { ...s, score: s.score + bonus.bonusPerStudent }
            : s
        );
      }
      return {
        ...state,
        students: settledStudents,
        groups: state.groups.map(g =>
          g.classId === action.payload.classId ? { ...g, score: 0 } : g
        ),
      };
    }

    // Student actions
    case 'ADD_STUDENT':
      return { ...state, students: [...state.students, action.payload] };

    case 'ADD_STUDENTS':
      return { ...state, students: [...state.students, ...action.payload] };

    case 'UPDATE_STUDENT':
      return {
        ...state,
        students: state.students.map(s => s.id === action.payload.id ? action.payload : s),
      };

    case 'DELETE_STUDENT':
      return {
        ...state,
        students: state.students.filter(s => s.id !== action.payload),
        gamification: state.gamification.filter(g => g.studentId !== action.payload),
      };

    case 'DELETE_STUDENTS':
      return {
        ...state,
        students: state.students.filter(s => !action.payload.includes(s.id)),
        gamification: state.gamification.filter(g => !action.payload.includes(g.studentId)),
      };

    case 'UPDATE_STUDENT_SCORE':
      return {
        ...state,
        students: state.students.map(s =>
          s.id === action.payload.studentId
            ? { ...s, score: Math.max(0, s.score + action.payload.delta) }
            : s
        ),
      };

    case 'UPDATE_GROUP_SCORE':
      return {
        ...state,
        students: state.students.map(s =>
          s.groupId === action.payload.groupId
            ? { ...s, score: Math.max(0, s.score + action.payload.delta) }
            : s
        ),
      };

    // Score Item actions
    case 'ADD_SCORE_ITEM':
      return { ...state, scoreItems: [...state.scoreItems, action.payload] };

    case 'UPDATE_SCORE_ITEM':
      return {
        ...state,
        scoreItems: state.scoreItems.map(item => item.id === action.payload.id ? action.payload : item),
      };

    case 'DELETE_SCORE_ITEM':
      return {
        ...state,
        scoreItems: state.scoreItems.filter(item => item.id !== action.payload),
      };

    // Reward actions
    case 'ADD_REWARD':
      return { ...state, rewards: [...state.rewards, action.payload] };

    case 'UPDATE_REWARD':
      return {
        ...state,
        rewards: state.rewards.map(r => r.id === action.payload.id ? action.payload : r),
      };

    case 'DELETE_REWARD':
      return {
        ...state,
        rewards: state.rewards.filter(r => r.id !== action.payload),
      };

    // History actions
    case 'ADD_HISTORY':
      return { ...state, history: [action.payload, ...state.history] };

    case 'CLEAR_HISTORY':
      if (action.payload) {
        return { ...state, history: state.history.filter(h => h.classId !== action.payload) };
      }
      return { ...state, history: [] };

    case 'UNDO_HISTORY': {
      const record = state.history.find(h => h.id === action.payload);
      if (!record || record.undone) return state;

      let newState = { ...state };

      // Mark record as undone
      newState.history = newState.history.map(h =>
        h.id === action.payload ? { ...h, undone: true } : h
      );

      if (record.targetType === 'student' && record.type === 'score') {
        // Reverse score
        newState.students = newState.students.map(s =>
          s.id === record.targetId ? { ...s, score: s.score - record.value } : s
        );
        // Restore gamification snapshot
        if (record.gamificationSnapshot) {
          const snapshot = { ...record.gamificationSnapshot, studentId: record.targetId };
          const exists = newState.gamification.some(g => g.studentId === record.targetId);
          newState.gamification = exists
            ? newState.gamification.map(g => g.studentId === record.targetId ? snapshot : g)
            : [...newState.gamification, snapshot];
        }
      } else if (record.targetType === 'group' && record.type === 'score') {
        // Reverse group score (if this record updated group totals)
        newState.groups = newState.groups.map(g =>
          g.id === record.targetId
            ? { ...g, score: record.groupScoreBefore ?? ((g.score || 0) - record.value) }
            : g
        );

        // Reverse any per-student impacts for group operations (e.g., settlement bonuses)
        if (record.perStudentDeltas && record.perStudentDeltas.length > 0) {
          const deltaMap = new Map(record.perStudentDeltas.map(d => [d.studentId, d]));
          newState.students = newState.students.map(s => {
            const delta = deltaMap.get(s.id);
            if (!delta) return s;
            return { ...s, score: s.score - delta.delta };
          });
          const snapMap = new Map(
            record.perStudentDeltas
              .filter(d => d.gamificationSnapshot)
              .map(d => [d.studentId, d.gamificationSnapshot!])
          );
          const existingIds = new Set(newState.gamification.map(g => g.studentId));
          newState.gamification = newState.gamification.map(g => {
            const snap = snapMap.get(g.studentId);
            if (snap) return { ...snap, studentId: g.studentId };
            return g;
          });
          for (const [studentId, snap] of snapMap.entries()) {
            if (!existingIds.has(studentId)) {
              newState.gamification.push({ ...snap, studentId });
            }
          }
        }
      } else if (record.type === 'reward' && record.targetType === 'student') {
        // Reverse reward: add back score (value is negative for rewards)
        newState.students = newState.students.map(s =>
          s.id === record.targetId ? { ...s, score: s.score - record.value } : s
        );
        if (record.gamificationSnapshot) {
          const snapshot = { ...record.gamificationSnapshot, studentId: record.targetId };
          const exists = newState.gamification.some(g => g.studentId === record.targetId);
          newState.gamification = exists
            ? newState.gamification.map(g => g.studentId === record.targetId ? snapshot : g)
            : [...newState.gamification, snapshot];
        }
      } else if (record.type === 'reward' && record.targetType === 'group') {
        // Reverse group reward: restore per-student score + gamification snapshots
        if (record.perStudentDeltas && record.perStudentDeltas.length > 0) {
          const deltaMap = new Map(record.perStudentDeltas.map(d => [d.studentId, d]));
          newState.students = newState.students.map(s => {
            const delta = deltaMap.get(s.id);
            if (!delta) return s;
            return { ...s, score: s.score - delta.delta };
          });
          const snapMap = new Map(
            record.perStudentDeltas
              .filter(d => d.gamificationSnapshot)
              .map(d => [d.studentId, d.gamificationSnapshot!])
          );
          const existingIds = new Set(newState.gamification.map(g => g.studentId));
          newState.gamification = newState.gamification.map(g => {
            const snap = snapMap.get(g.studentId);
            if (snap) return { ...snap, studentId: g.studentId };
            return g;
          });
          for (const [studentId, snap] of snapMap.entries()) {
            if (!existingIds.has(studentId)) {
              newState.gamification.push({ ...snap, studentId });
            }
          }
        }
      }

      if (record.attendanceMeta) {
        if (record.itemId === 'attendance_revoke') {
          const exists = newState.attendanceRecords.some(r => r.id === record.attendanceMeta!.id);
          if (!exists) {
            newState.attendanceRecords = [...newState.attendanceRecords, record.attendanceMeta];
          }
        } else if (record.itemId === 'attendance' || record.itemId === 'attendance_makeup') {
          newState.attendanceRecords = newState.attendanceRecords.filter(r => r.id !== record.attendanceMeta!.id);
        }
      }

      return newState;
    }

    // Gamification actions
    case 'UPDATE_GAMIFICATION': {
      const exists = state.gamification.some(g => g.studentId === action.payload.studentId);
      return {
        ...state,
        gamification: exists
          ? state.gamification.map(g => g.studentId === action.payload.studentId ? action.payload : g)
          : [...state.gamification, action.payload],
      };
    }

    case 'ADD_GAMIFICATION_EVENT':
      return {
        ...state,
        gamificationEvents: [...state.gamificationEvents, action.payload],
      };

    case 'DISMISS_GAMIFICATION_EVENT':
      return {
        ...state,
        gamificationEvents: state.gamificationEvents.filter(e => e.id !== action.payload),
      };

    case 'CLEAR_GAMIFICATION_EVENTS':
      return { ...state, gamificationEvents: [] };

    // Custom badge actions
    case 'ADD_CUSTOM_BADGE':
      return { ...state, customBadges: [...state.customBadges, action.payload] };

    case 'UPDATE_CUSTOM_BADGE':
      return {
        ...state,
        customBadges: state.customBadges.map(b => b.id === action.payload.id ? action.payload : b),
      };

    case 'DELETE_CUSTOM_BADGE':
      return {
        ...state,
        customBadges: state.customBadges.filter(b => b.id !== action.payload),
      };

    // Attendance actions
    case 'ADD_ATTENDANCE':
      return { ...state, attendanceRecords: [...state.attendanceRecords, action.payload] };

    case 'UPDATE_ATTENDANCE':
      return {
        ...state,
        attendanceRecords: state.attendanceRecords.map(r => r.id === action.payload.id ? action.payload : r),
      };

    case 'DELETE_ATTENDANCE':
      return {
        ...state,
        attendanceRecords: state.attendanceRecords.filter(r => r.id !== action.payload),
      };

    case 'ADD_ATTENDANCE_EXEMPTION': {
      const attendanceExemptions = [...state.attendanceExemptions, action.payload];
      const classId = action.payload.classId;
      const nextGamification = applyAttendanceStreakRecalc(state, classId, attendanceExemptions);
      return { ...state, attendanceExemptions, gamification: nextGamification };
    }

    case 'UPDATE_ATTENDANCE_EXEMPTION': {
      const attendanceExemptions = state.attendanceExemptions.map(e => e.id === action.payload.id ? action.payload : e);
      const classId = action.payload.classId;
      const nextGamification = applyAttendanceStreakRecalc(state, classId, attendanceExemptions);
      return { ...state, attendanceExemptions, gamification: nextGamification };
    }

    case 'DELETE_ATTENDANCE_EXEMPTION': {
      const removed = state.attendanceExemptions.find(e => e.id === action.payload);
      const attendanceExemptions = state.attendanceExemptions.filter(e => e.id !== action.payload);
      if (!removed) return { ...state, attendanceExemptions };
      const nextGamification = applyAttendanceStreakRecalc(state, removed.classId, attendanceExemptions);
      return { ...state, attendanceExemptions, gamification: nextGamification };
    }

    // Onboarding actions
    case 'START_ONBOARDING':
      return {
        ...state,
        onboardingClassId: action.payload,
        onboardingStep: 'setup_groups',
      };

    case 'SET_ONBOARDING_STEP':
      return { ...state, onboardingStep: action.payload };

    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingClassId: null, onboardingStep: null };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  t: (zh: string, en: string) => string;
}

const AppContext = createContext<AppContextType | null>(null);

function migrateState(saved: Partial<AppState>): AppState {
  let badges = saved.customBadges;
  if (!badges || badges.length === 0) {
    badges = [...DEFAULT_BADGE_DEFINITIONS];
  }
  return {
    ...initialState,
    ...saved,
    scoreItems: saved.scoreItems?.length ? saved.scoreItems : defaultScoreItems,
    rewards: saved.rewards?.length ? saved.rewards : defaultRewards,
    gamification: (saved.gamification || []).map(g => ({
      ...g,
      scoreItemCounts: g.scoreItemCounts || {},
    })),
    gamificationEvents: saved.gamificationEvents || [],
    customBadges: badges,
    attendanceRecords: saved.attendanceRecords || [],
    attendanceExemptions: saved.attendanceExemptions || [],
    onboardingClassId: saved.onboardingClassId || null,
    onboardingStep: saved.onboardingStep || null,
    groups: (saved.groups || []).map((g: any) => ({ ...g, score: g.score ?? 0 })),
  };
}

interface AppProviderProps {
  children: ReactNode;
  userId?: string | null;
}

export function AppProvider({ children, userId }: AppProviderProps) {
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [showMigration, setShowMigration] = useState(false);

  const [state, dispatch] = useReducer(appReducer, undefined, () => {
    // Always start with localStorage cache for instant loading
    const saved = loadFromStorage();
    if (saved) {
      return migrateState(saved);
    }
    return initialState;
  });

  // Load from cloud when userId is available
  useEffect(() => {
    if (!userId) {
      setCloudLoaded(true);
      return;
    }

    let cancelled = false;

    async function loadCloud() {
      const cloudData = await loadFromCloud(userId!);

      if (cancelled) return;

      if (cloudData) {
        // Cloud data exists — use it
        dispatch({ type: 'LOAD_STATE', payload: cloudData });
        setCloudLoaded(true);
      } else if (hasLocalData()) {
        // No cloud data, but has local data — offer migration
        setShowMigration(true);
        setCloudLoaded(true);
      } else {
        // No data anywhere — fresh start
        setCloudLoaded(true);
      }
    }

    loadCloud();
    return () => { cancelled = true; };
  }, [userId]);

  // Save to localStorage + cloud on state change
  useEffect(() => {
    if (!cloudLoaded) return; // Don't save until cloud load completes
    saveToStorage(state);
    if (userId) {
      saveToCloudDebounced(userId, state);
    }
  }, [state, userId, cloudLoaded]);

  const handleMigrateLocal = useCallback(() => {
    // Local data is already in state (loaded via lazy initializer)
    // Just close migration dialog — next state save will push to cloud
    setShowMigration(false);
  }, []);

  const handleSkipMigration = useCallback(() => {
    // Start fresh — clear local and reset state
    clearLocalStorage();
    dispatch({ type: 'LOAD_STATE', payload: initialState });
    setShowMigration(false);
  }, []);

  const t = (zh: string, en: string): string => {
    return state.language === 'zh-CN' ? zh : en;
  };

  return (
    <AppContext.Provider value={{ state, dispatch, t }}>
      {showMigration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="clay-card p-6 md:p-8 max-w-md w-full space-y-4 lab-animate">
            <div className="text-center space-y-2">
              <div className="text-4xl">📦</div>
              <h2 className="text-xl font-display text-slate-900">
                {t('发现本地数据', 'Local Data Found')}
              </h2>
              <p className="text-sm text-slate-600">
                {t(
                  '检测到此浏览器中有已保存的数据。是否要将其同步到云端？',
                  'We found saved data in this browser. Would you like to sync it to the cloud?'
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleMigrateLocal}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold shadow-md hover:bg-indigo-600 transition-colors"
              >
                {t('同步到云端', 'Sync to Cloud')}
              </button>
              <button
                onClick={handleSkipMigration}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:bg-slate-50 transition-colors"
              >
                {t('重新开始', 'Start Fresh')}
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

function applyAttendanceStreakRecalc(
  state: AppState,
  classId: string,
  attendanceExemptions: AppState['attendanceExemptions']
): AppState['gamification'] {
  const classStudents = state.students.filter(s => s.classId === classId);
  if (classStudents.length === 0) return state.gamification;

  const studentIds = classStudents.map(s => s.id);
  const classAttendance = state.attendanceRecords.filter(r => r.classId === classId);
  const classExemptions = attendanceExemptions.filter(e => e.classId === classId);
  const streaks = computeAttendanceStreaks(classAttendance, classExemptions, studentIds);
  const classHistory = state.history.filter(h => h.classId === classId);
  const scoreStreaks = computeScoreStreaks(classHistory, classExemptions, studentIds);

  const existingMap = new Map(state.gamification.map(g => [g.studentId, g]));
  const updated = state.gamification.filter(g => !studentIds.includes(g.studentId));

  studentIds.forEach(studentId => {
    const base = existingMap.get(studentId) || createDefaultGamification(studentId);
    const summary = streaks[studentId];
    const scoreSummary = scoreStreaks[studentId];
    if (!summary && !scoreSummary) {
      updated.push(base);
      return;
    }
    updated.push({
      ...base,
      attendanceStreak: summary?.attendanceStreak ?? base.attendanceStreak,
      longestAttendanceStreak: summary?.longestAttendanceStreak ?? base.longestAttendanceStreak,
      lastAttendanceDate: summary?.lastAttendanceDate ?? base.lastAttendanceDate,
      currentStreak: scoreSummary?.currentStreak ?? base.currentStreak,
      longestStreak: scoreSummary?.longestStreak ?? base.longestStreak,
      lastPositiveScoringDate: scoreSummary?.lastPositiveScoringDate ?? base.lastPositiveScoringDate,
    });
  });

  return updated;
}
