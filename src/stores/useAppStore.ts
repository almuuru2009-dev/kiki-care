import { create } from 'zustand';
import { users, patients as initialPatients, sessions, messages, conversations, maaAlerts, notifications, exercises, exercisePlans, milestones, weeklyAdherence, dailySessions, medals, moodEntries } from '@/lib/mockData';
import type { User, Patient, Session, Message, Conversation, MAAAlert, Notification, Exercise, ExercisePlan, Milestone, Medal, MoodEntry } from '@/lib/types';

interface Feedback {
  id: string;
  userId: string;
  type: 'comment' | 'suggestion' | 'bug';
  text: string;
  timestamp: string;
}

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  selectedRole: 'kinesiologist' | 'caregiver' | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setSelectedRole: (role: 'kinesiologist' | 'caregiver') => void;

  patients: Patient[];
  exercises: Exercise[];
  sessions: Session[];
  messages: Message[];
  conversations: Conversation[];
  maaAlerts: MAAAlert[];
  notifications: Notification[];
  exercisePlans: ExercisePlan[];
  milestones: Milestone[];
  medals: Medal[];
  moodEntries: MoodEntry[];
  weeklyAdherence: { week: string; adherence: number }[];
  dailySessions: { day: string; sessions: number }[];
  feedbacks: Feedback[];

  todaySessionCompleted: boolean;
  todayDifficulty: number | null;
  todayNote: string;
  completeTodaySession: (difficulty: number, note: string, mood?: number, painReported?: boolean) => void;

  sendMessage: (conversationId: string, text: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissAlert: (id: string) => void;
  addMoodEntry: (entry: Omit<MoodEntry, 'id'>) => void;
  unlockMedal: (medalId: string) => void;

  // Patient CRUD
  archivePatient: (id: string) => void;
  deletePatient: (id: string) => void;
  addPatient: (patient: Patient) => void;

  // Feedback
  submitFeedback: (text: string, type?: 'comment' | 'suggestion' | 'bug') => void;

  // Subscription
  subscription: {
    plan: 'free_trial' | 'inicial' | 'pro';
    trialDaysLeft: number;
    active: boolean;
  };
  upgradePlan: (plan: 'inicial' | 'pro') => void;

  // Saved exercises
  savedExercises: string[];
  saveExercise: (id: string) => void;
  unsaveExercise: (id: string) => void;

  settings: {
    dailyReminder: boolean;
    therapistMessages: boolean;
    weeklyReports: boolean;
    soundEffects: boolean;
    language: string;
  };
  updateSettings: (key: string, value: boolean | string) => void;
  updateUserProfile: (data: Partial<User>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  selectedRole: null,

  login: (email: string, password: string) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false, selectedRole: null, todaySessionCompleted: false, todayDifficulty: null, todayNote: '' });
  },

  setSelectedRole: (role) => set({ selectedRole: role }),

  patients: initialPatients,
  exercises,
  sessions,
  messages,
  conversations,
  maaAlerts,
  notifications,
  exercisePlans,
  milestones,
  medals,
  moodEntries,
  weeklyAdherence,
  dailySessions,
  feedbacks: [],

  todaySessionCompleted: false,
  todayDifficulty: null,
  todayNote: '',

  completeTodaySession: (difficulty, note, mood, painReported) => {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' as const : new Date().getHours() < 18 ? 'afternoon' as const : 'evening' as const;
    const newSession: Session = {
      id: `sess-new-${Date.now()}`,
      patientId: 'pat-1',
      date: new Date().toISOString().split('T')[0],
      exercisesCompleted: 3,
      totalExercises: 3,
      durationMinutes: 22,
      difficulty,
      note: note || undefined,
      mood: mood || 3,
      painReported: painReported || false,
      timeOfDay,
    };
    set(state => ({
      todaySessionCompleted: true,
      todayDifficulty: difficulty,
      todayNote: note,
      sessions: [...state.sessions, newSession],
    }));
  },

  sendMessage: (conversationId, text) => {
    const user = get().currentUser;
    if (!user) return;
    const newMsg: Message = {
      id: `m-new-${Date.now()}`,
      conversationId,
      senderId: user.id,
      text,
      timestamp: new Date().toISOString(),
      isRead: true,
    };
    set(state => ({
      messages: [...state.messages, newMsg],
      conversations: state.conversations.map(c =>
        c.id === conversationId ? { ...c, lastMessage: text, lastMessageTime: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), unreadCount: 0 } : c
      ),
    }));
  },

  markNotificationRead: (id) => set(state => ({ notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) })),
  markAllNotificationsRead: () => set(state => ({ notifications: state.notifications.map(n => ({ ...n, isRead: true })) })),
  dismissAlert: (id) => set(state => ({ maaAlerts: state.maaAlerts.map(a => a.id === id ? { ...a, isActive: false } : a) })),
  addMoodEntry: (entry) => set(state => ({ moodEntries: [...state.moodEntries, { ...entry, id: `mood-${Date.now()}` }] })),
  unlockMedal: (medalId) => set(state => ({ medals: state.medals.map(m => m.id === medalId ? { ...m, earned: true, earnedDate: new Date().toISOString().split('T')[0] } : m) })),

  archivePatient: (id) => set(state => ({ patients: state.patients.filter(p => p.id !== id) })),
  deletePatient: (id) => set(state => ({
    patients: state.patients.filter(p => p.id !== id),
    sessions: state.sessions.filter(s => s.patientId !== id),
    exercisePlans: state.exercisePlans.filter(ep => ep.patientId !== id),
  })),
  addPatient: (patient) => set(state => ({ patients: [...state.patients, patient] })),

  submitFeedback: (text, type = 'comment') => {
    const user = get().currentUser;
    if (!user) return;
    set(state => ({
      feedbacks: [...state.feedbacks, { id: `fb-${Date.now()}`, userId: user.id, type, text, timestamp: new Date().toISOString() }],
    }));
  },

  subscription: {
    plan: 'free_trial',
    trialDaysLeft: 18,
    active: true,
  },
  upgradePlan: (plan) => set({ subscription: { plan, trialDaysLeft: 0, active: true } }),

  savedExercises: [],
  saveExercise: (id) => set(state => ({ savedExercises: [...state.savedExercises, id] })),
  unsaveExercise: (id) => set(state => ({ savedExercises: state.savedExercises.filter(e => e !== id) })),

  settings: {
    dailyReminder: true,
    therapistMessages: true,
    weeklyReports: false,
    soundEffects: true,
    language: 'es',
  },
  updateSettings: (key, value) => set(state => ({ settings: { ...state.settings, [key]: value } })),
  updateUserProfile: (data) => set(state => ({
    currentUser: state.currentUser ? { ...state.currentUser, ...data } : null,
  })),
}));
