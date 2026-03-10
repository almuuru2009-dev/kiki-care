import type { FamilyPattern, MAAResult } from './types-maa';

export interface FamilyPattern {
  patientId: string;
  baselineFrequency: number;
  baselineHour: number;
  recentFrequency: number;
  lastSessionDaysAgo: number;
  avgDurationMinutes: number;
  baselineDurationMinutes: number;
  responseLatencyHours: number;
}

export interface MAAResult {
  riskScore: number;
  riskLevel: 'BAJO' | 'MODERADO' | 'ALTO';
  triggerReason: string;
  suggestedAction: string;
  detectedDaysBeforeFullAbandon: number;
}

export function calculateRisk(pattern: FamilyPattern): MAAResult {
  const freqDrop = pattern.baselineFrequency > 0
    ? Math.max(0, (1 - pattern.recentFrequency / pattern.baselineFrequency) * 100)
    : 0;

  const daysSinceScore = Math.min(100, pattern.lastSessionDaysAgo * 12);

  const durationDrop = pattern.baselineDurationMinutes > 0
    ? Math.max(0, (1 - pattern.avgDurationMinutes / pattern.baselineDurationMinutes) * 100)
    : 0;

  const latencyScore = Math.min(100, pattern.responseLatencyHours * 4);

  const riskScore = Math.round(
    freqDrop * 0.4 +
    daysSinceScore * 0.3 +
    durationDrop * 0.2 +
    latencyScore * 0.1
  );

  const clampedScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel: 'BAJO' | 'MODERADO' | 'ALTO';
  if (clampedScore <= 35) riskLevel = 'BAJO';
  else if (clampedScore <= 65) riskLevel = 'MODERADO';
  else riskLevel = 'ALTO';

  let triggerReason = '';
  let suggestedAction = '';
  let detectedDays = 0;

  if (riskLevel === 'ALTO') {
    if (pattern.lastSessionDaysAgo >= 5) {
      triggerReason = `${pattern.lastSessionDaysAgo} días sin registrar sesión. Frecuencia cayó de ${pattern.baselineFrequency.toFixed(1)} a ${pattern.recentFrequency.toFixed(1)} sesiones/semana.`;
      suggestedAction = 'Contactar a la familia para evaluar barreras. Considerar simplificar el plan.';
      detectedDays = Math.max(1, 14 - pattern.lastSessionDaysAgo);
    } else {
      triggerReason = `Patrón de registro irregular. Sesiones acortadas (promedio ${pattern.avgDurationMinutes}min vs ${pattern.baselineDurationMinutes}min normal).`;
      suggestedAction = 'Revisar la dificultad del plan actual. Enviar mensaje motivacional.';
      detectedDays = 7;
    }
  } else if (riskLevel === 'MODERADO') {
    triggerReason = `Reducción de adherencia detectada en últimas 2 semanas. Cambio de horario detectado.`;
    suggestedAction = 'Monitorear la próxima semana. Preguntar si hay cambios en la rutina.';
    detectedDays = 10;
  } else {
    triggerReason = 'Patrón estable. Sin cambios significativos.';
    suggestedAction = 'Continuar con el plan actual.';
    detectedDays = 0;
  }

  return {
    riskScore: clampedScore,
    riskLevel,
    triggerReason,
    suggestedAction,
    detectedDaysBeforeFullAbandon: detectedDays,
  };
}
