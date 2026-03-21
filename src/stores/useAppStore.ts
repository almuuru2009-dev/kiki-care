import { create } from 'zustand';
import { users, patients, sessions, messages, conversations, maaAlerts, notifications, exercises, exercisePlans, milestones, weeklyAdherence, dailySessions, medals, moodEntries } from '@/lib/mockData';
import type { User, Patient, Session, Message, Conversation, MAAAlert, Notification, Exercise, ExercisePlan, Milestone, Medal, MoodEntry } from '@/lib/types';

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  selectedRole: 'kinesiologist' | 'caregiver' | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setSelectedRole: (role: 'kinesiologist' | 'caregiver') => void;

  // Data
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

  // Session tracking (caregiver)
  todaySessionCompleted: boolean;
  todayDifficulty: number | null;
  todayNote: string;
  completeTodaySession: (difficulty: number, note: string, mood?: number, painReported?: boolean) => void;

  // Messages
  sendMessage: (conversationId: string, text: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Alerts
  dismissAlert: (id: string) => void;

  // Mood
  addMoodEntry: (entry: Omit<MoodEntry, 'id'>) => void;

  // Medals
  unlockMedal: (medalId: string) => void;

  // Settings
  settings: {
    dailyReminder: boolean;
    therapistMessages: boolean;
    weeklyReports: boolean;
    soundEffects: boolean;
    language: string;
  };
  updateSettings: (key: string, value: boolean | string) => void;
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

  patients,
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

  todaySessionCompleted: false,
  todayDifficulty: null,
  todayNote: '',

  completeTodaySession: (difficulty: number, note: string, mood?: number, painReported?: boolean) => {
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

  sendMessage: (conversationId: string, text: string) => {
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

  markNotificationRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
    }));
  },

  markAllNotificationsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    }));
  },

  dismissAlert: (id) => {
    set(state => ({
      maaAlerts: state.maaAlerts.map(a => a.id === id ? { ...a, isActive: false } : a),
    }));
  },

  addMoodEntry: (entry) => {
    const newEntry: MoodEntry = { ...entry, id: `mood-${Date.now()}` };
    set(state => ({ moodEntries: [...state.moodEntries, newEntry] }));
  },

  unlockMedal: (medalId) => {
    set(state => ({
      medals: state.medals.map(m => m.id === medalId ? { ...m, earned: true, earnedDate: new Date().toISOString().split('T')[0] } : m),
    }));
  },

  settings: {
    dailyReminder: true,
    therapistMessages: true,
    weeklyReports: false,
    soundEffects: true,
    language: 'es',
  },

  updateSettings: (key, value) => {
    set(state => ({
      settings: { ...state.settings, [key]: value },
    }));
  },
}));
