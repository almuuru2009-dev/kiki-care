import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, FileText, Archive, Trash2, MessageCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle, RiskBadge } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calculateRisk, type FamilyPattern } from '@/lib/kae';
import { toast } from 'sonner';

const tabs = ['Resumen', 'Plan', 'Historial'];
const moodEmojis = ['😓', '😕', '😐', '🙂', '😄'];

interface ChildData {
  id: string;
  name: string;
  age: number | null;
  diagnosis: string | null;
  gmfcs: number | null;
  avatar_color: string | null;
  caregiver_id: string;
}

interface SessionData {
  id: string;
  completed_at: string;
  difficulty: number | null;
  child_mood: number | null;
  pain_reported: boolean | null;
  note: string | null;
}

interface PlanExercise {
  planId: string;
  exerciseId: string;
  exerciseName: string;
  duration: number | null;
  sets: number | null;
  reps: string | null;
  targetArea: string | null;
  dayOfWeek: number[] | null;
  active: boolean | null;
}

export default function PatientDetail() {
  const { id: linkId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [loading, setLoading] = useState(true);

  const [child, setChild] = useState<ChildData | null>(null);
  const [caregiverName, setCaregiverName] = useState('Cuidador/a');
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>([]);
  const [weeklyAdherence, setWeeklyAdherence] = useState<{ week: string; adherence: number }[]>([]);

  useEffect(() => {
    if (user && linkId) loadPatientData();
  }, [user, linkId]);

  const loadPatientData = async () => {
    if (!user || !linkId) return;

    // Get link info
    const { data: link } = await supabase
      .from('therapist_caregiver_links')
      .select('*')
      .eq('id', linkId)
      .single();

    if (!link) { setLoading(false); return; }

    // Fetch child, caregiver profile, sessions, treatment plans in parallel
    const [childRes, caregiverRes, sessionsRes, plansRes] = await Promise.all([
      link.child_id ? supabase.from('children').select('*').eq('id', link.child_id).single() : { data: null },
      link.caregiver_id ? supabase.from('profiles').select('name').eq('id', link.caregiver_id).single() : { data: null },
      link.child_id ? supabase.from('sessions').select('*').eq('child_id', link.child_id).order('completed_at', { ascending: false }).limit(50) : { data: [] },
      link.child_id ? supabase.from('treatment_plans').select('id, exercise_id, day_of_week, active').eq('child_id', link.child_id).eq('therapist_id', user.id) : { data: [] },
    ]);

    if (childRes.data) setChild(childRes.data as ChildData);
    if (caregiverRes.data) setCaregiverName(caregiverRes.data.name || 'Cuidador/a');

    const sessData = (sessionsRes.data || []) as SessionData[];
    setSessions(sessData);

    // Load exercises for treatment plans
    const plans = plansRes.data || [];
    if (plans.length > 0) {
      const exIds = plans.map(p => p.exercise_id);
      const { data: exData } = await supabase.from('exercises').select('id, name, duration, sets, reps, target_area').in('id', exIds);
      const exMap = new Map((exData || []).map(e => [e.id, e]));
      const mapped: PlanExercise[] = plans.map(p => {
        const ex = exMap.get(p.exercise_id);
        return {
          planId: p.id,
          exerciseId: p.exercise_id,
          exerciseName: ex?.name || 'Ejercicio',
          duration: ex?.duration || null,
          sets: ex?.sets || null,
          reps: ex?.reps || null,
          targetArea: ex?.target_area || null,
          dayOfWeek: p.day_of_week,
          active: p.active,
        };
      });
      setPlanExercises(mapped);
    }

    // Calculate weekly adherence trend (last 6 weeks)
    const now = new Date();
    const weeklyData: { week: string; adherence: number }[] = [];
    for (let w = 5; w >= 0; w--) {
      const weekStart = new Date(now.getTime() - (w + 1) * 7 * 86400000);
      const weekEnd = new Date(now.getTime() - w * 7 * 86400000);
      const weekSessions = sessData.filter(s => {
        const d = new Date(s.completed_at);
        return d >= weekStart && d < weekEnd;
      });
      const adherence = Math.min(100, Math.round((weekSessions.length / 5) * 100));
      weeklyData.push({ week: `S${6 - w}`, adherence });
    }
    setWeeklyAdherence(weeklyData);
    setLoading(false);
  };

  if (loading) {
    return (
      <AppShell hideNav>
        <ScreenHeader title="Paciente" backButton />
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!child) {
    return (
      <AppShell hideNav>
        <ScreenHeader title="Paciente" backButton />
        <div className="p-4 text-center text-muted-foreground">Paciente no encontrado o pendiente de vinculación.</div>
      </AppShell>
    );
  }

  // Calculations
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
  const recentSessions = sessions.filter(s => new Date(s.completed_at) >= twoWeeksAgo);
  const expectedSessions = 10;
  const adherencePercent = Math.min(100, Math.round((recentSessions.length / expectedSessions) * 100));
  const totalSessions = sessions.length;
  const lastSession = sessions[0];
  const lastSessionDaysAgo = lastSession ? Math.floor((now.getTime() - new Date(lastSession.completed_at).getTime()) / 86400000) : 30;

  const pattern: FamilyPattern = {
    patientId: linkId!,
    baselineFrequency: 5,
    baselineHour: 10,
    recentFrequency: recentSessions.length / 2,
    lastSessionDaysAgo,
    avgDurationMinutes: 15,
    baselineDurationMinutes: 20,
    responseLatencyHours: lastSessionDaysAgo > 3 ? 48 : 6,
  };
  const kaeResult = calculateRisk(pattern);

  const sessionsWithDiff = sessions.filter(s => s.difficulty !== null);
  const avgDiff = sessionsWithDiff.length >= 3 ? (sessionsWithDiff.reduce((s, ss) => s + (ss.difficulty || 0), 0) / sessionsWithDiff.length).toFixed(1) : null;
  const sessionsWithMood = sessions.filter(s => s.child_mood !== null);
  const avgMood = sessionsWithMood.length >= 3 ? (sessionsWithMood.reduce((s, ss) => s + (ss.child_mood || 3), 0) / sessionsWithMood.length).toFixed(1) : null;
  const painSessions = sessions.filter(s => s.pain_reported);

  // Streak & gap
  const dates = sessions.map(s => s.completed_at.split('T')[0]).sort();
  let longestStreak = 0, currentStreak = 0, longestGap = 0;
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) { currentStreak = 1; longestStreak = 1; continue; }
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
    if (diff === 1) { currentStreak++; longestStreak = Math.max(longestStreak, currentStreak); }
    else { longestGap = Math.max(longestGap, diff); currentStreak = 1; }
  }

  const notes = sessions.filter(s => s.note).map(s => ({ date: s.completed_at.split('T')[0], note: s.note! }));

  const handleArchive = async () => {
    await supabase.from('therapist_caregiver_links').update({ status: 'archived' }).eq('id', linkId!);
    toast.success('Paciente archivado');
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este paciente? Esta acción no se puede deshacer.')) return;
    await supabase.from('therapist_caregiver_links').update({ status: 'rejected' }).eq('id', linkId!);
    toast.success('Paciente desvinculado');
    navigate(-1);
  };

  const generateReport = async () => {
    const avgDiffVal = avgDiff || 'N/A';
    const avgMoodVal = avgMood || 'N/A';
    const dateRange = sessions.length > 0
      ? `${new Date(sessions[sessions.length - 1].completed_at).toLocaleDateString('es-AR')} – ${new Date(sessions[0].completed_at).toLocaleDateString('es-AR')}`
      : 'Sin datos';

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Informe ${child.name}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #1a1a2e; }
        h1 { color: #1a1a2e; border-bottom: 2px solid #7EEDC4; padding-bottom: 8px; }
        h2 { color: #1a1a2e; margin-top: 24px; }
        table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background-color: #f0fdf4; }
        .highlight { background-color: #f0fdf4; padding: 12px; border-radius: 6px; margin: 12px 0; }
        .footer { margin-top: 40px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 12px; }
      </style></head>
      <body>
        <h1>Informe de Seguimiento — ${child.name}</h1>
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>Período:</strong> ${dateRange}</p>
        <h2>Datos del paciente</h2>
        <table>
          <tr><th>Nombre</th><td>${child.name}</td></tr>
          <tr><th>Edad</th><td>${child.age ? child.age + ' años' : 'No especificada'}</td></tr>
          <tr><th>Diagnóstico</th><td>${child.diagnosis || 'No especificado'}</td></tr>
          <tr><th>GMFCS</th><td>${child.gmfcs ? 'Nivel ' + child.gmfcs : 'No especificado'}</td></tr>
          <tr><th>Cuidador/a</th><td>${caregiverName}</td></tr>
          <tr><th>Riesgo KAE</th><td>${kaeResult.riskLevel} (${kaeResult.riskScore}/100)</td></tr>
        </table>
        <h2>Resumen de adherencia</h2>
        <table>
          <tr><th>Sesiones totales</th><td>${totalSessions}</td></tr>
          <tr><th>Adherencia (14 días)</th><td>${adherencePercent}%</td></tr>
          <tr><th>Dificultad prom.</th><td>${avgDiffVal}/5</td></tr>
          <tr><th>Ánimo prom.</th><td>${avgMoodVal}/5</td></tr>
          <tr><th>Sesiones con dolor</th><td>${painSessions.length}</td></tr>
          <tr><th>Racha más larga</th><td>${longestStreak} días</td></tr>
          <tr><th>Mayor pausa</th><td>${longestGap} días</td></tr>
        </table>
        <h2>Historial reciente</h2>
        <table>
          <tr><th>Fecha</th><th>Dificultad</th><th>Ánimo</th><th>Dolor</th><th>Nota</th></tr>
          ${sessions.slice(0, 20).map(s => `
            <tr>
              <td>${new Date(s.completed_at).toLocaleDateString('es-AR')}</td>
              <td>${s.difficulty || '—'}/5</td>
              <td>${s.child_mood || '—'}/5</td>
              <td>${s.pain_reported ? 'Sí' : 'No'}</td>
              <td>${s.note || '—'}</td>
            </tr>
          `).join('')}
        </table>
        <h2>Observaciones clínicas</h2>
        <p>${kaeResult.triggerReason}</p>
        <p><strong>Acción sugerida:</strong> ${kaeResult.suggestedAction}</p>
        <div class="footer">
          <p>Generado por KikiCare · ${new Date().toLocaleDateString('es-AR')} · Herramienta de apoyo clínico.</p>
        </div>
      </body></html>
    `;

    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Informe_${child.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Informe descargado');
  };

  const activePlanExercises = planExercises.filter(e => e.active !== false);
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <AppShell hideNav>
      <ScreenHeader title={child.name} backButton rightAction={
        <button onClick={() => setShowActions(!showActions)} className="text-muted-foreground text-lg" aria-label="Acciones">⋯</button>
      } />

      {showActions && (
        <div className="absolute right-4 top-14 bg-card border border-border rounded-xl shadow-kiki z-20 py-1 w-48">
          <button onClick={() => { setShowActions(false); generateReport(); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2">
            <FileText size={14} /> Descargar informe
          </button>
          <button onClick={() => { setShowActions(false); handleArchive(); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2 text-gold">
            <Archive size={14} /> Archivar paciente
          </button>
          <button onClick={() => { setShowActions(false); handleDelete(); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2 text-rust">
            <Trash2 size={14} /> Desvincular
          </button>
        </div>
      )}

      <div className="px-4 pb-6">
        {/* Compact Header */}
        <KikiCard className="mb-3 !p-3">
          <div className="flex items-center gap-3">
            <AvatarCircle name={child.name} color={child.avatar_color || '#7EEDC4'} size="md" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold truncate">{child.name}</h2>
              <p className="text-xs text-muted-foreground">
                {child.age ? `${child.age} años · ` : ''}{child.diagnosis || 'Sin diagnóstico'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {child.gmfcs && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted">GMFCS {child.gmfcs}</span>}
                <RiskBadge level={kaeResult.riskLevel} />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Cuidador/a: {caregiverName}</p>
        </KikiCard>

        {/* Metric Cards */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mb-3">
          <div className="rounded-xl bg-mint-50 p-2.5 min-w-[90px] text-center">
            <p className="text-lg font-bold text-foreground">{adherencePercent}%</p>
            <p className="text-[10px] text-muted-foreground">Adherencia</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-2.5 min-w-[90px] text-center">
            <p className="text-lg font-bold text-foreground">{recentSessions.length}/{expectedSessions}</p>
            <p className="text-[10px] text-muted-foreground">Sesiones 14d</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-2.5 min-w-[90px] text-center">
            <p className="text-lg font-bold text-foreground">{avgDiff || '—'}</p>
            <p className="text-[10px] text-muted-foreground">Dificultad</p>
          </div>
          {avgMood && (
            <div className="rounded-xl bg-violet-50 p-2.5 min-w-[90px] text-center">
              <p className="text-lg font-bold text-foreground">{avgMood} {moodEmojis[Math.round(Number(avgMood)) - 1]}</p>
              <p className="text-[10px] text-muted-foreground">Ánimo</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-1 mb-3 sticky top-0 z-10">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === i ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
              {tab}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
          {/* TAB: RESUMEN */}
          {activeTab === 0 && (
            <div className="space-y-3">
              {kaeResult.riskLevel !== 'BAJO' && (
                <KikiCard className={`border-l-4 !p-3 ${kaeResult.riskLevel === 'ALTO' ? 'border-l-rust bg-red-50' : 'border-l-gold bg-amber-50'}`}>
                  <p className="text-xs font-semibold">Alerta KAE: Riesgo {kaeResult.riskLevel}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{kaeResult.triggerReason}</p>
                </KikiCard>
              )}

              {/* Adherence Chart */}
              <KikiCard className="!p-3">
                <h3 className="text-xs font-semibold mb-2">Tendencia de adherencia</h3>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={weeklyAdherence}>
                    <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#7A8FA8' }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="adherence" stroke="#7EEDC4" strokeWidth={2.5} dot={{ fill: '#7EEDC4', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </KikiCard>

              {/* Pre-informe */}
              <KikiCard className="!p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-mint-600" />
                  <h3 className="text-xs font-semibold">Pre-informe automático</h3>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">Últimos 14 días · {expectedSessions} sesiones esperadas</p>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] mb-2">
                  <div><span className="text-muted-foreground">Completadas:</span> <span className="font-medium">{recentSessions.length}/{expectedSessions}</span></div>
                  <div><span className="text-muted-foreground">Racha:</span> <span className="font-medium">{longestStreak} días</span></div>
                  <div><span className="text-muted-foreground">Mayor pausa:</span> <span className="font-medium">{longestGap} días</span></div>
                  <div><span className="text-muted-foreground">Con dolor:</span> <span className={`font-medium ${painSessions.length > 0 ? 'text-rust' : ''}`}>{painSessions.length}</span></div>
                </div>

                {showFullReport && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-2 border-t border-border">
                    {notes.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Notas del cuidador</p>
                        {notes.slice(0, 5).map((n, i) => (
                          <div key={i} className="flex gap-2 py-1 border-b border-border last:border-0">
                            <span className="text-[10px] text-muted-foreground shrink-0">{n.date}</span>
                            <span className="text-[11px] italic">"{n.note}"</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={`p-2.5 rounded-lg ${kaeResult.riskLevel === 'ALTO' ? 'bg-red-50 border border-red-200' : kaeResult.riskLevel === 'MODERADO' ? 'bg-amber-50 border border-amber-200' : 'bg-mint-50 border border-mint-200'}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <RiskBadge level={kaeResult.riskLevel} />
                        <span className="text-[10px] font-semibold">Estado KAE</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{kaeResult.suggestedAction}</p>
                    </div>
                  </motion.div>
                )}

                <button onClick={() => setShowFullReport(!showFullReport)} className="btn-secondary w-full mt-2 text-xs">
                  {showFullReport ? 'Ocultar detalle' : 'Ver informe completo'}
                </button>
              </KikiCard>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-xs" onClick={() => navigate('/kine/messages')}>
                  <MessageCircle size={13} className="inline mr-1" /> Mensaje
                </button>
                <button className="btn-primary flex-1 text-xs" onClick={() => navigate(`/kine/patients/${linkId}/plan/edit`)}>
                  <Edit size={13} className="inline mr-1" /> Modificar plan
                </button>
              </div>
            </div>
          )}

          {/* TAB: PLAN */}
          {activeTab === 1 && (
            <div className="space-y-3">
              <KikiCard className="!p-3">
                <h3 className="text-sm font-semibold">Plan de tratamiento</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activePlanExercises.length} ejercicios asignados
                </p>
              </KikiCard>

              {activePlanExercises.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-3">Sin ejercicios asignados aún</p>
                  <button onClick={() => navigate(`/kine/patients/${linkId}/plan/edit`)} className="btn-primary text-sm">
                    Crear plan
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {activePlanExercises.map(ex => (
                    <KikiCard key={ex.planId} onClick={() => navigate(`/kine/exercise/${ex.exerciseId}`)} className="!p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-mint-50 flex items-center justify-center shrink-0">
                          <span className="text-sm">🏋️</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ex.exerciseName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {ex.duration ? `${ex.duration}min` : ''}{ex.sets ? ` · ${ex.sets}×${ex.reps || '10'}` : ''}
                            {ex.targetArea ? ` · ${ex.targetArea}` : ''}
                          </p>
                          {ex.dayOfWeek && ex.dayOfWeek.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {ex.dayOfWeek.map(d => (
                                <span key={d} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted font-medium">
                                  {dayNames[d] || d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </KikiCard>
                  ))}
                </div>
              )}

              <button onClick={() => navigate(`/kine/patients/${linkId}/plan/edit`)} className="btn-primary w-full text-sm mt-2">
                <Edit size={14} className="inline mr-1" /> Modificar plan
              </button>
            </div>
          )}

          {/* TAB: HISTORIAL */}
          {activeTab === 2 && (
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin sesiones registradas</p>
              ) : (
                sessions.slice(0, 20).map((s, i) => (
                  <KikiCard key={s.id} className="!p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{new Date(s.completed_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(s.completed_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.difficulty !== null && (
                          <div className="flex items-center gap-0.5" title={`Dificultad: ${s.difficulty}/5`}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <div key={star} className={`w-1.5 h-1.5 rounded-full ${star <= s.difficulty! ? 'bg-gold' : 'bg-muted'}`} />
                            ))}
                          </div>
                        )}
                        {s.child_mood !== null && <span className="text-xs">{moodEmojis[(s.child_mood || 3) - 1]}</span>}
                        {s.pain_reported && <span className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-rust font-medium">Dolor</span>}
                      </div>
                    </div>
                    {s.note && <p className="text-[11px] text-muted-foreground mt-1.5 italic bg-muted/50 rounded-lg p-2">"{s.note}"</p>}
                  </KikiCard>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}
