// Class (班级)
export interface Class {
  id: string;
  name: string;
  createdAt: number;
}

// Group (组别)
export interface Group {
  id: string;
  classId: string;
  name: string;
  color: string;
  order: number;
  score: number;
}

// Student (学生)
export interface Student {
  id: string;
  classId: string;
  groupId: string;
  name: string;
  score: number;
  createdAt: number;
  avatar?: string; // Emoji or image URL
}

// Score Item Category (加减分项目类别)
export type ScoreCategory = 'classroom' | 'academic' | 'behavior' | 'custom';

// Score Item (加减分项目)
export interface ScoreItem {
  id: string;
  name: string;
  nameEn: string;
  value: number;
  category: ScoreCategory;
  isDefault?: boolean;
}

// Reward (礼物)
export interface Reward {
  id: string;
  name: string;
  nameEn: string;
  cost: number;
  description?: string;
  descriptionEn?: string;
  isDefault?: boolean;
  minLevel?: number;
}

// History Record Type
export type HistoryType = 'score' | 'reward' | 'system';
export type TargetType = 'student' | 'group' | 'class';

// Gamification snapshot for undo
export interface GamificationSnapshot {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastPositiveScoringDate: string | null;
  unlockedBadgeIds: string[];
  badgeUnlockedAt: Record<string, number>;
  totalPositiveScores: number;
  perfectQuizCount: number;
  helpingOthersCount: number;
  rewardRedeemedCount: number;
  // Attendance tracking
  attendanceDays: number;
  lastAttendanceDate: string | null;
  attendanceStreak: number;
  longestAttendanceStreak: number;
}

// History Record (历史记录)
export interface HistoryRecord {
  id: string;
  classId: string;
  type: HistoryType;
  targetType: TargetType;
  targetId: string;
  targetName: string;
  itemId: string;
  itemName: string;
  value: number;
  timestamp: number;
  note?: string;
  undone?: boolean;
  gamificationSnapshot?: GamificationSnapshot;
  // For group operations that affect multiple students
  perStudentDeltas?: { studentId: string; delta: number; gamificationSnapshot?: GamificationSnapshot }[];
  // For group score operations that reset or adjust group totals
  groupScoreBefore?: number;
  // For attendance actions to allow correct undo
  attendanceMeta?: AttendanceRecord;
}

// Language
export type Language = 'zh-CN' | 'en';

// === GAMIFICATION TYPES ===

// Level definition
export interface LevelDefinition {
  level: number;
  name: string;
  nameEn: string;
  emoji: string;
  xpRequired: number;
}

// Student gamification data
export interface StudentGamification {
  studentId: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastPositiveScoringDate: string | null;
  unlockedBadgeIds: string[];
  badgeUnlockedAt: Record<string, number>;
  totalPositiveScores: number;
  perfectQuizCount: number;
  helpingOthersCount: number;
  rewardRedeemedCount: number;
  // Attendance tracking
  attendanceDays: number;
  lastAttendanceDate: string | null;
  attendanceStreak: number;
  longestAttendanceStreak: number;
}

// Badge condition types
export type BadgeCondition =
  | { type: 'first_score' }
  | { type: 'streak_days'; days: number }
  | { type: 'total_xp'; xp: number }
  | { type: 'level_reached'; level: number }
  | { type: 'score_count'; count: number }
  | { type: 'reward_redeemed'; count: number }
  | { type: 'perfect_quiz_count'; count: number }
  | { type: 'helping_others_count'; count: number }
  | { type: 'attendance_days'; days: number };

// Achievement badge definition
export interface BadgeDefinition {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  description: string;
  descriptionEn: string;
  category: 'streak' | 'score' | 'academic' | 'social' | 'milestone' | 'attendance' | 'custom';
  condition: BadgeCondition;
  bonusPoints?: number; // Points awarded when badge is earned
  isCustom?: boolean; // Whether this is a user-created badge
}

// Gamification event (for toast/celebration queue)
export interface GamificationEvent {
  id: string;
  type: 'level_up' | 'badge_earned' | 'streak_milestone';
  studentId: string;
  studentName: string;
  data: {
    newLevel?: number;
    levelEmoji?: string;
    levelName?: string;
    badgeId?: string;
    badgeEmoji?: string;
    badgeName?: string;
    bonusPoints?: number;
    streakDays?: number;
  };
  timestamp: number;
}

// Attendance Record (出勤记录)
export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string; // YYYY-MM-DD format
  status: 'present' | 'absent' | 'late' | 'excused';
  timestamp: number;
  note?: string;
}

// Attendance exemption (no-class day)
export interface AttendanceExemption {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD format
  createdAt: number;
  note?: string;
}

// Onboarding step
export type OnboardingStep = 'setup_groups' | 'add_students' | 'assign_groups' | 'complete';

// App State
export interface AppState {
  classes: Class[];
  currentClassId: string | null;
  groups: Group[];
  students: Student[];
  scoreItems: ScoreItem[];
  rewards: Reward[];
  history: HistoryRecord[];
  language: Language;
  // Gamification
  gamification: StudentGamification[];
  gamificationEvents: GamificationEvent[];
  customBadges: BadgeDefinition[];
  // Attendance
  attendanceRecords: AttendanceRecord[];
  attendanceExemptions: AttendanceExemption[];
  // Onboarding
  onboardingClassId: string | null;
  onboardingStep: OnboardingStep | null;
}

// Action Types
export type AppAction =
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  // Class actions
  | { type: 'ADD_CLASS'; payload: Class }
  | { type: 'UPDATE_CLASS'; payload: Class }
  | { type: 'DELETE_CLASS'; payload: string }
  | { type: 'SET_CURRENT_CLASS'; payload: string | null }
  // Group actions
  | { type: 'ADD_GROUP'; payload: Group }
  | { type: 'UPDATE_GROUP'; payload: Group }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'REORDER_GROUPS'; payload: Group[] }
  | { type: 'UPDATE_GROUP_POINTS'; payload: { groupId: string; delta: number } }
  | { type: 'SETTLE_GROUP_SCORES'; payload: { classId: string; bonuses: { groupId: string; bonusPerStudent: number }[] } }
  // Student actions
  | { type: 'ADD_STUDENT'; payload: Student }
  | { type: 'ADD_STUDENTS'; payload: Student[] }
  | { type: 'UPDATE_STUDENT'; payload: Student }
  | { type: 'DELETE_STUDENT'; payload: string }
  | { type: 'DELETE_STUDENTS'; payload: string[] }
  | { type: 'UPDATE_STUDENT_SCORE'; payload: { studentId: string; delta: number } }
  | { type: 'UPDATE_GROUP_SCORE'; payload: { groupId: string; delta: number } }
  // Score Item actions
  | { type: 'ADD_SCORE_ITEM'; payload: ScoreItem }
  | { type: 'UPDATE_SCORE_ITEM'; payload: ScoreItem }
  | { type: 'DELETE_SCORE_ITEM'; payload: string }
  // Reward actions
  | { type: 'ADD_REWARD'; payload: Reward }
  | { type: 'UPDATE_REWARD'; payload: Reward }
  | { type: 'DELETE_REWARD'; payload: string }
  // History actions
  | { type: 'ADD_HISTORY'; payload: HistoryRecord }
  | { type: 'CLEAR_HISTORY'; payload?: string }
  | { type: 'UNDO_HISTORY'; payload: string }
  // Gamification actions
  | { type: 'UPDATE_GAMIFICATION'; payload: StudentGamification }
  | { type: 'ADD_GAMIFICATION_EVENT'; payload: GamificationEvent }
  | { type: 'DISMISS_GAMIFICATION_EVENT'; payload: string }
  | { type: 'CLEAR_GAMIFICATION_EVENTS' }
  // Custom badge actions
  | { type: 'ADD_CUSTOM_BADGE'; payload: BadgeDefinition }
  | { type: 'UPDATE_CUSTOM_BADGE'; payload: BadgeDefinition }
  | { type: 'DELETE_CUSTOM_BADGE'; payload: string }
  // Attendance actions
  | { type: 'ADD_ATTENDANCE'; payload: AttendanceRecord }
  | { type: 'UPDATE_ATTENDANCE'; payload: AttendanceRecord }
  | { type: 'DELETE_ATTENDANCE'; payload: string }
  | { type: 'ADD_ATTENDANCE_EXEMPTION'; payload: AttendanceExemption }
  | { type: 'UPDATE_ATTENDANCE_EXEMPTION'; payload: AttendanceExemption }
  | { type: 'DELETE_ATTENDANCE_EXEMPTION'; payload: string }
  // Onboarding actions
  | { type: 'START_ONBOARDING'; payload: string }
  | { type: 'SET_ONBOARDING_STEP'; payload: OnboardingStep }
  | { type: 'COMPLETE_ONBOARDING' };
