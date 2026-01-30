import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, AppAction } from '../types';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { defaultScoreItems, defaultRewards } from '../utils/defaults';
import { DEFAULT_BADGE_DEFINITIONS } from '../utils/badges';

const initialState: AppState = {
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
  onboardingClassId: null,
  onboardingStep: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
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
        gamification: loaded.gamification || [],
        gamificationEvents: loaded.gamificationEvents || [],
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
            ? { ...s, score: s.score + action.payload.delta }
            : s
        ),
      };

    case 'UPDATE_GROUP_SCORE':
      return {
        ...state,
        students: state.students.map(s =>
          s.groupId === action.payload.groupId
            ? { ...s, score: s.score + action.payload.delta }
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
        // Reverse group score
        newState.groups = newState.groups.map(g =>
          g.id === record.targetId ? { ...g, score: (g.score || 0) - record.value } : g
        );
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => {
    const saved = loadFromStorage();
    if (saved) {
      // Migrate: if customBadges is empty or doesn't exist, initialize with default badges
      let badges = saved.customBadges;
      if (!badges || badges.length === 0) {
        badges = [...DEFAULT_BADGE_DEFINITIONS];
      }

      return {
        ...initialState,
        ...saved,
        scoreItems: saved.scoreItems?.length ? saved.scoreItems : defaultScoreItems,
        rewards: saved.rewards?.length ? saved.rewards : defaultRewards,
        gamification: saved.gamification || [],
        gamificationEvents: saved.gamificationEvents || [],
        customBadges: badges,
        attendanceRecords: saved.attendanceRecords || [],
        onboardingClassId: saved.onboardingClassId || null,
        onboardingStep: saved.onboardingStep || null,
        groups: (saved.groups || []).map((g: any) => ({ ...g, score: g.score ?? 0 })),
      };
    }
    return initialState;
  });

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const t = (zh: string, en: string): string => {
    return state.language === 'zh-CN' ? zh : en;
  };

  return (
    <AppContext.Provider value={{ state, dispatch, t }}>
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
