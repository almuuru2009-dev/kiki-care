export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'kinesiologist' | 'caregiver';
  specialty?: string;
  institution?: string;
  matricula?: string;
  childId?: string;
  therapistId?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  gmfcs: number;
  adherence: number;
  caregiverId: string;
  caregiverName: string;
  therapistId: string;
  avatarColor: string;
  lastSessionDaysAgo: number;
  sessionsPerWeek: number;
  baselineFrequency: number;
  baselineDuration: number;
  avgDuration: number;
  responseLatency: number;
}

export interface Exercise {
  id: string;
  name: string;
  targetArea: string;
  duration: number;
  sets: number;
  reps: string;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  thumbnailColor: string;
  description: string;
  videoDescription: string;
  contraindications: string;
  gmfcsLevels: number[];
}

export interface Session {
  id: string;
  patientId: string;
  date: string;
  exercisesCompleted: number;
  totalExercises: number;
  durationMinutes: number;
  difficulty: number;
  note?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  patientId: string;
  patientName: string;
  caregiverName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface MAAAlert {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  riskLevel: 'BAJO' | 'MODERADO' | 'ALTO';
  riskScore: number;
  triggerReason: string;
  suggestedAction: string;
  alertType: string;
  detectedAt: string;
  isActive: boolean;
  detectedDaysBefore: number;
}

export interface ExercisePlan {
  id: string;
  patientId: string;
  name: string;
  startDate: string;
  endDate: string;
  frequency: number;
  exercises: string[];
  isActive: boolean;
}

export interface Notification {
  id: string;
  type: 'alert' | 'session' | 'message' | 'plan' | 'milestone';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  link: string;
  color: string;
}

export interface Milestone {
  id: string;
  patientId: string;
  title: string;
  date?: string;
  achieved: boolean;
}
