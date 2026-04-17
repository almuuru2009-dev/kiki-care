// Kiki Adherence Engine (KAE) — replaces MAA
// Score 0-100 calculated from session signals.

export interface KaeSignals {
  patientId: string;
  expectedSessionsPerWeek: number;     // baseline plan (default 5)
  sessionsLast14Days: number;          // completed sessions in last 14d
  expectedLast14Days: number;          // expected sessions in 14d (e.g. 10)
  lastSessionDaysAgo: number;          // days since last completed session
  currentStreak: number;               // consecutive days with sessions
  daysWithoutAppOpen: number;          // approx caregiver inactivity
  shortSessionsLast7Days: number;      // sessions with duration < 50% expected
  resumedAfterGap: boolean;            // came back after >=7 days
  weekDropPercent: number;             // % drop week-over-week (0-100)
}

export interface KaeAlert {
  type: 'no_sessions' | 'low_adherence' | 'caregiver_inactive' | 'streak_broken' | 'short_sessions';
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface KaePattern {
  text: string;
}

export interface KaeResult {
  score: number;                       // 0-100
  level: 'BAJO' | 'MEDIO' | 'ALTO';    // risk level (low risk = good adherence)
  triggerReason: string;
  suggestedAction: string;
  alerts: KaeAlert[];
  patterns: KaePattern[];
}

export function calculateKae(s: KaeSignals): KaeResult {
  let score = 50; // neutral start

  // Frequency: sessions vs expected (last 14d)
  if (s.expectedLast14Days > 0) {
    const ratio = s.sessionsLast14Days / s.expectedLast14Days;
    if (ratio >= 0.9) score += 25;
    else if (ratio >= 0.7) score += 15;
    else if (ratio >= 0.5) score += 5;
    else if (ratio >= 0.3) score -= 10;
    else score -= 25;
  }

  // Continuity: last session recency
  if (s.lastSessionDaysAgo <= 1) score += 10;
  else if (s.lastSessionDaysAgo <= 3) score += 3;
  else if (s.lastSessionDaysAgo <= 5) score -= 5;
  else if (s.lastSessionDaysAgo <= 7) score -= 12;
  else score -= 20;

  // Streak bonus
  if (s.currentStreak >= 7) score += 10;
  else if (s.currentStreak >= 3) score += 5;

  // Caregiver inactivity penalty
  if (s.daysWithoutAppOpen >= 5) score -= 5;

  // Short sessions penalty
  if (s.shortSessionsLast7Days >= 3) score -= 8;
  else if (s.shortSessionsLast7Days >= 1) score -= 3;

  // Resumed after gap bonus
  if (s.resumedAfterGap) score += 3;

  // Week-over-week drop
  if (s.weekDropPercent >= 50) score -= 10;
  else if (s.weekDropPercent >= 25) score -= 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Note: HIGH risk = LOW score (poor adherence)
  let level: 'BAJO' | 'MEDIO' | 'ALTO';
  if (score >= 70) level = 'BAJO';
  else if (score >= 40) level = 'MEDIO';
  else level = 'ALTO';

  // Build alerts
  const alerts: KaeAlert[] = [];
  if (s.lastSessionDaysAgo >= 3) {
    alerts.push({
      type: 'no_sessions',
      message: `No registró sesión en ${s.lastSessionDaysAgo} días`,
      severity: s.lastSessionDaysAgo >= 7 ? 'critical' : 'warning',
    });
  }
  const adherencePct = s.expectedLast14Days > 0
    ? Math.round((s.sessionsLast14Days / s.expectedLast14Days) * 100)
    : 0;
  if (adherencePct < 60 && s.expectedLast14Days > 0) {
    alerts.push({
      type: 'low_adherence',
      message: `Adherencia esta semana: ${adherencePct}% — por debajo del umbral`,
      severity: adherencePct < 40 ? 'critical' : 'warning',
    });
  }
  if (s.daysWithoutAppOpen >= 5) {
    alerts.push({
      type: 'caregiver_inactive',
      message: `El cuidador no abrió la app en ${s.daysWithoutAppOpen} días`,
      severity: 'warning',
    });
  }
  if (s.weekDropPercent >= 30 && s.currentStreak === 0) {
    alerts.push({
      type: 'streak_broken',
      message: `Racha interrumpida después de varios días activos`,
      severity: 'info',
    });
  }
  if (s.shortSessionsLast7Days >= 2) {
    alerts.push({
      type: 'short_sessions',
      message: `Sesiones más cortas que lo planificado en los últimos 7 días`,
      severity: 'info',
    });
  }

  // Patterns
  const patterns: KaePattern[] = [];
  if (s.weekDropPercent >= 20) {
    patterns.push({ text: `Duración promedio cayó un ${Math.round(s.weekDropPercent)}% en las últimas 2 semanas` });
  }
  if (s.shortSessionsLast7Days >= 2) {
    patterns.push({ text: `Sesiones completadas pero con duración reducida — posible fatiga` });
  }

  // Trigger reason + action
  let triggerReason = '';
  let suggestedAction = '';
  if (level === 'BAJO') {
    triggerReason = `Adherencia ${adherencePct}% · racha ${s.currentStreak}d. Patrón estable.`;
    suggestedAction = 'El paciente mantiene buena adherencia. Sin acción requerida.';
  } else if (level === 'MEDIO') {
    triggerReason = `Adherencia ${adherencePct}%, última sesión hace ${s.lastSessionDaysAgo}d.`;
    suggestedAction = 'Revisar dificultad del plan. Considerar contactar al cuidador.';
  } else {
    triggerReason = `Adherencia ${adherencePct}%, ${s.lastSessionDaysAgo}d sin sesión.`;
    suggestedAction = 'Riesgo de abandono. Se recomienda llamado al cuidador y revisión del plan esta semana.';
  }

  return { score, level, triggerReason, suggestedAction, alerts, patterns };
}

// Helper to build signals from raw session timestamps
export function buildSignals(opts: {
  patientId: string;
  sessionDates: Date[];     // completed sessions, any order
  expectedPerWeek?: number;
}): KaeSignals {
  const expectedPerWeek = opts.expectedPerWeek ?? 5;
  const now = new Date();
  const sorted = [...opts.sessionDates].sort((a, b) => b.getTime() - a.getTime());
  const last = sorted[0];
  const lastSessionDaysAgo = last
    ? Math.floor((now.getTime() - last.getTime()) / 86400000)
    : 30;

  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
  const sessionsLast14Days = sorted.filter(d => d >= twoWeeksAgo).length;
  const sessionsLast7Days = sorted.filter(d => d >= oneWeekAgo).length;
  const sessionsPrev7Days = sorted.filter(d => d >= twoWeeksAgo && d < oneWeekAgo).length;

  // Streak: consecutive days ending today or yesterday
  const dayKeys = new Set(sorted.map(d => d.toISOString().split('T')[0]));
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  // allow streak if today or yesterday
  if (!dayKeys.has(cursor.toISOString().split('T')[0])) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dayKeys.has(cursor.toISOString().split('T')[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weekDropPercent = sessionsPrev7Days > 0
    ? Math.max(0, Math.round((1 - sessionsLast7Days / sessionsPrev7Days) * 100))
    : 0;

  return {
    patientId: opts.patientId,
    expectedSessionsPerWeek: expectedPerWeek,
    sessionsLast14Days,
    expectedLast14Days: expectedPerWeek * 2,
    lastSessionDaysAgo,
    currentStreak: streak,
    daysWithoutAppOpen: lastSessionDaysAgo, // proxy
    shortSessionsLast7Days: 0,
    resumedAfterGap: lastSessionDaysAgo === 0 && sessionsPrev7Days === 0 && sessionsLast7Days >= 1,
    weekDropPercent,
  };
}
