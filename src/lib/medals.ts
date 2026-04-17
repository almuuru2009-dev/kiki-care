// Centralized medal definitions + evaluator (computes from real data, no fake counters)
import { supabase } from '@/integrations/supabase/client';

export type MedalTier = 'inicio' | 'racha' | 'cumplimiento' | 'adherencia' | 'comportamiento' | 'constancia';
export type MedalStatus = 'ganada' | 'progreso' | 'bloqueada';

export interface MedalDef {
  type: string;
  icon: string;
  title: string;
  description: string;
  criteria: string;        // human readable
  tier: MedalTier;
  points: number;
  // calculator returns { progress: 0..1, current: number, target: number, label }
  evaluate: (ctx: MedalContext) => { progress: number; current: number; target: number; label: string };
  // optional dependency: medal that must be earned first
  requires?: string;
}

export interface MedalContext {
  totalSessions: number;
  monthSessions: number;
  weekSessions: number;
  currentStreak: number;
  expectedThisMonth: number;
  daysSinceLastSession: number;
  resumedAfterGap: boolean;
  weeksActive: number;     // consecutive weeks with at least 1 session
  monthsActive: number;    // months with >=1 session in last 12
  fullSessionsCount: number;
}

export const MEDAL_DEFS: MedalDef[] = [
  // Inicio
  {
    type: 'first-session', icon: '⭐', title: 'Primera sesión',
    description: '¡Diste el primer paso!', criteria: 'Completar 1 sesión',
    tier: 'inicio', points: 10,
    evaluate: c => ({ progress: Math.min(1, c.totalSessions), current: Math.min(1, c.totalSessions), target: 1, label: `${Math.min(1, c.totalSessions)}/1` }),
  },
  {
    type: 'first-week', icon: '📅', title: 'Primera semana activa',
    description: 'Una semana de constancia', criteria: 'Estar activa al menos 1 semana',
    tier: 'inicio', points: 20,
    evaluate: c => ({ progress: Math.min(1, c.weeksActive), current: Math.min(1, c.weeksActive), target: 1, label: `${Math.min(1, c.weeksActive)}/1 semana` }),
  },
  // Rachas
  {
    type: 'streak-3', icon: '🔥', title: 'Racha de 3',
    description: '3 días consecutivos', criteria: '3 días seguidos con sesión',
    tier: 'racha', points: 15,
    evaluate: c => ({ progress: Math.min(1, c.currentStreak / 3), current: Math.min(c.currentStreak, 3), target: 3, label: `${Math.min(c.currentStreak, 3)}/3` }),
  },
  {
    type: 'streak-5', icon: '🔥', title: 'Racha de 5',
    description: '5 días consecutivos', criteria: '5 días seguidos con sesión',
    tier: 'racha', points: 25, requires: 'streak-3',
    evaluate: c => ({ progress: Math.min(1, c.currentStreak / 5), current: Math.min(c.currentStreak, 5), target: 5, label: `${Math.min(c.currentStreak, 5)}/5` }),
  },
  {
    type: 'streak-7', icon: '💪', title: 'Racha de 7',
    description: 'Una semana imparable', criteria: '7 días seguidos con sesión',
    tier: 'racha', points: 35, requires: 'streak-5',
    evaluate: c => ({ progress: Math.min(1, c.currentStreak / 7), current: Math.min(c.currentStreak, 7), target: 7, label: `${Math.min(c.currentStreak, 7)}/7` }),
  },
  // Cumplimiento
  {
    type: 'five-sessions', icon: '🎯', title: '5 sesiones',
    description: 'Buen ritmo', criteria: 'Completar 5 sesiones en total',
    tier: 'cumplimiento', points: 20,
    evaluate: c => ({ progress: Math.min(1, c.totalSessions / 5), current: Math.min(c.totalSessions, 5), target: 5, label: `${Math.min(c.totalSessions, 5)}/5` }),
  },
  {
    type: 'ten-sessions', icon: '🏅', title: '10 sesiones',
    description: 'Mucho progreso', criteria: 'Completar 10 sesiones en total',
    tier: 'cumplimiento', points: 30, requires: 'five-sessions',
    evaluate: c => ({ progress: Math.min(1, c.totalSessions / 10), current: Math.min(c.totalSessions, 10), target: 10, label: `${Math.min(c.totalSessions, 10)}/10` }),
  },
  {
    type: 'week-perfect', icon: '🌟', title: 'Semana completa (5/5)',
    description: 'Cumpliste toda la semana', criteria: 'Completar las 5 sesiones de la semana',
    tier: 'cumplimiento', points: 25,
    evaluate: c => ({ progress: Math.min(1, c.weekSessions / 5), current: Math.min(c.weekSessions, 5), target: 5, label: `${Math.min(c.weekSessions, 5)}/5` }),
  },
  // Adherencia
  {
    type: 'adherence-70', icon: '📈', title: '70% del mes',
    description: 'Buena adherencia', criteria: 'Lograr 70% de adherencia mensual',
    tier: 'adherencia', points: 30,
    evaluate: c => {
      const pct = c.expectedThisMonth > 0 ? c.monthSessions / c.expectedThisMonth : 0;
      return { progress: Math.min(1, pct / 0.7), current: Math.round(pct * 100), target: 70, label: `${Math.round(pct * 100)}%/70%` };
    },
  },
  {
    type: 'adherence-85', icon: '📈', title: '85% del mes',
    description: 'Excelente adherencia', criteria: 'Lograr 85% de adherencia mensual',
    tier: 'adherencia', points: 40, requires: 'adherence-70',
    evaluate: c => {
      const pct = c.expectedThisMonth > 0 ? c.monthSessions / c.expectedThisMonth : 0;
      return { progress: Math.min(1, pct / 0.85), current: Math.round(pct * 100), target: 85, label: `${Math.round(pct * 100)}%/85%` };
    },
  },
  {
    type: 'adherence-95', icon: '🏆', title: '95% del mes',
    description: 'Adherencia perfecta', criteria: 'Lograr 95% de adherencia mensual',
    tier: 'adherencia', points: 50, requires: 'adherence-85',
    evaluate: c => {
      const pct = c.expectedThisMonth > 0 ? c.monthSessions / c.expectedThisMonth : 0;
      return { progress: Math.min(1, pct / 0.95), current: Math.round(pct * 100), target: 95, label: `${Math.round(pct * 100)}%/95%` };
    },
  },
  // Comportamiento
  {
    type: 'resumed', icon: '🌱', title: 'Volviste a empezar',
    description: 'Retomaste después de varios días', criteria: 'Retomar después de 3+ días sin actividad',
    tier: 'comportamiento', points: 25,
    evaluate: c => ({ progress: c.resumedAfterGap ? 1 : 0, current: c.resumedAfterGap ? 1 : 0, target: 1, label: c.resumedAfterGap ? 'Listo' : 'Pendiente' }),
  },
  {
    type: 'full-session', icon: '✨', title: 'Sesión completa',
    description: 'Hiciste la sesión sin recortar', criteria: 'Completar 1 sesión sin recortar',
    tier: 'comportamiento', points: 15,
    evaluate: c => ({ progress: Math.min(1, c.fullSessionsCount), current: Math.min(c.fullSessionsCount, 1), target: 1, label: `${Math.min(c.fullSessionsCount, 1)}/1` }),
  },
  // Constancia
  {
    type: 'two-weeks-active', icon: '🌿', title: '2 semanas activas',
    description: 'Constancia consolidada', criteria: 'Estar activa 2 semanas seguidas',
    tier: 'constancia', points: 35, requires: 'first-week',
    evaluate: c => ({ progress: Math.min(1, c.weeksActive / 2), current: Math.min(c.weeksActive, 2), target: 2, label: `${Math.min(c.weeksActive, 2)}/2` }),
  },
  {
    type: 'one-month-active', icon: '🏛️', title: '1 mes activo',
    description: 'Hábito formado', criteria: 'Estar activa 4 semanas seguidas',
    tier: 'constancia', points: 50, requires: 'two-weeks-active',
    evaluate: c => ({ progress: Math.min(1, c.weeksActive / 4), current: Math.min(c.weeksActive, 4), target: 4, label: `${Math.min(c.weeksActive, 4)}/4 sem` }),
  },
];

export interface MedalUnlock {
  type: string;
  icon: string;
  title: string;
  description: string;
  points: number;
}

export async function buildMedalContext(userId: string): Promise<MedalContext> {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('completed_at')
    .eq('caregiver_id', userId)
    .order('completed_at', { ascending: false });

  const all = sessions || [];
  const now = new Date();
  const totalSessions = all.length;

  const month = now.getMonth();
  const year = now.getFullYear();
  const monthSessions = all.filter(s => {
    const d = new Date(s.completed_at);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;

  // expected this month: 5 per week * weeks elapsed (cap at full month)
  const dayOfMonth = now.getDate();
  const expectedThisMonth = Math.max(1, Math.round((dayOfMonth / 7) * 5));

  // week sessions (since last Sunday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekSessions = all.filter(s => new Date(s.completed_at) >= weekStart).length;

  // streak
  const dayKeys = new Set(all.map(s => new Date(s.completed_at).toISOString().split('T')[0]));
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!dayKeys.has(cursor.toISOString().split('T')[0])) cursor.setDate(cursor.getDate() - 1);
  while (dayKeys.has(cursor.toISOString().split('T')[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // last session days
  const last = all[0];
  const daysSinceLastSession = last ? Math.floor((now.getTime() - new Date(last.completed_at).getTime()) / 86400000) : 999;

  // weeks active (consecutive)
  let weeksActive = 0;
  const weekStartCursor = new Date(weekStart);
  while (true) {
    const weekEndCursor = new Date(weekStartCursor);
    weekEndCursor.setDate(weekEndCursor.getDate() + 7);
    const has = all.some(s => {
      const d = new Date(s.completed_at);
      return d >= weekStartCursor && d < weekEndCursor;
    });
    if (!has) break;
    weeksActive++;
    weekStartCursor.setDate(weekStartCursor.getDate() - 7);
    if (weeksActive > 60) break;
  }

  // months active in last 12
  const monthSet = new Set<string>();
  all.forEach(s => {
    const d = new Date(s.completed_at);
    if ((now.getTime() - d.getTime()) / 86400000 <= 365) {
      monthSet.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
  });
  const monthsActive = monthSet.size;

  // resumed after gap: today has session and there was a gap >=3 before
  const todayKey = now.toISOString().split('T')[0];
  let resumedAfterGap = false;
  if (dayKeys.has(todayKey) && all.length >= 2) {
    const sortedDates = [...all].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    const todaySession = sortedDates.find(s => new Date(s.completed_at).toISOString().split('T')[0] === todayKey);
    const previous = sortedDates.find(s => new Date(s.completed_at).toISOString().split('T')[0] !== todayKey);
    if (todaySession && previous) {
      const gap = (new Date(todaySession.completed_at).getTime() - new Date(previous.completed_at).getTime()) / 86400000;
      if (gap >= 3) resumedAfterGap = true;
    }
  }

  return {
    totalSessions,
    monthSessions,
    weekSessions,
    currentStreak: streak,
    expectedThisMonth,
    daysSinceLastSession,
    resumedAfterGap,
    weeksActive,
    monthsActive,
    fullSessionsCount: totalSessions, // proxy
  };
}

export function statusOf(def: MedalDef, ctx: MedalContext, earnedTypes: Set<string>): MedalStatus {
  if (earnedTypes.has(def.type)) return 'ganada';
  if (def.requires && !earnedTypes.has(def.requires)) return 'bloqueada';
  return 'progreso';
}

export async function evaluateMedalsAfterSession(userId: string): Promise<{ unlocked: MedalUnlock[]; pointsFromMedals: number }> {
  const ctx = await buildMedalContext(userId);
  const { data: existing } = await supabase.from('medals').select('medal_type').eq('user_id', userId);
  const earnedTypes = new Set((existing || []).map(m => m.medal_type));

  const unlocked: MedalUnlock[] = [];
  let pointsFromMedals = 0;
  const year = new Date().getFullYear();

  for (const def of MEDAL_DEFS) {
    if (earnedTypes.has(def.type)) continue;
    if (def.requires && !earnedTypes.has(def.requires)) continue;
    const ev = def.evaluate(ctx);
    if (ev.progress >= 1) {
      const { error } = await supabase.from('medals').insert({
        user_id: userId, medal_type: def.type, title: def.title,
        description: def.description, points_awarded: def.points, year,
      });
      if (!error) {
        unlocked.push({ type: def.type, icon: def.icon, title: def.title, description: def.description, points: def.points });
        earnedTypes.add(def.type);
        pointsFromMedals += def.points;
      }
    }
  }

  // Update user_points: +5 for the session + medal points
  const month = new Date().getMonth() + 1;
  const totalPoints = 5 + pointsFromMedals;
  const { data: existingPoints } = await supabase
    .from('user_points').select('*').eq('user_id', userId).eq('month', month).eq('year', year).maybeSingle();
  if (existingPoints) {
    await supabase.from('user_points').update({
      sessions_completed: (existingPoints.sessions_completed || 0) + 1,
      points: (existingPoints.points || 0) + totalPoints,
    }).eq('id', existingPoints.id);
  } else {
    await supabase.from('user_points').insert({
      user_id: userId, month, year, sessions_completed: 1, points: totalPoints,
    });
  }

  return { unlocked, pointsFromMedals };
}
