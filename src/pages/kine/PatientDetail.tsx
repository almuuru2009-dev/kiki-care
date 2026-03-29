import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Edit, FileText, SmilePlus, Archive, Trash2, CalendarPlus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle, AdherenceBar, RiskBadge } from '@/components/kiki/KikiComponents';
import { ExerciseCard } from '@/components/kiki/ExerciseCard';
import { useAppStore } from '@/stores/useAppStore';

const tabs = ['Resumen', 'Plan', 'Historial'];
const moodEmojis = ['😓', '😕', '😐', '🙂', '😄'];

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, exercises, exercisePlans, sessions, weeklyAdherence, archivePatient, deletePatient } = useAppStore();
  const [activeTab, setActiveTab] = useState(0);
  const [showFullReport, setShowFullReport] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [registeringSession, setRegisteringSession] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [nextSessionDate, setNextSessionDate] = useState('');

  const patient = patients.find(p => p.id === id);
  if (!patient) return <AppShell><div className="p-4">Paciente no encontrado</div></AppShell>;

  const plan = exercisePlans.find(p => p.patientId === id);
  const planExercises = plan ? exercises.filter(e => plan.exercises.includes(e.id)) : exercises.slice(0, 3);
  const patientSessions = sessions.filter(s => s.patientId === id).slice(-10);

  const riskLevel = patient.adherence >= 75 ? 'BAJO' as const : patient.adherence >= 50 ? 'MODERADO' as const : 'ALTO' as const;

  // Pre-session report calculations
  const expectedFreq = plan?.frequency || 5;
  const periodDays = 14;
  const expectedSessions = Math.round(expectedFreq * (periodDays / 7));
  const completed = patientSessions.length;
  const adherencePercent = expectedSessions > 0 ? Math.round((completed / expectedSessions) * 100) : 0;

  // Longest streak & gap
  let longestStreak = 0, currentStreak = 0, longestGap = 0;
  const dates = patientSessions.map(s => s.date).sort();
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) { currentStreak = 1; longestStreak = 1; continue; }
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime()) / 86400000;
    if (diff === 1) { currentStreak++; longestStreak = Math.max(longestStreak, currentStreak); }
    else { longestGap = Math.max(longestGap, diff); currentStreak = 1; }
  }

  const avgDiff = patientSessions.length >= 3 ? (patientSessions.reduce((s, sess) => s + sess.difficulty, 0) / patientSessions.length).toFixed(1) : null;
  const avgMood = patientSessions.filter(s => s.mood).length >= 3
    ? (patientSessions.filter(s => s.mood).reduce((s, sess) => s + (sess.mood || 3), 0) / patientSessions.filter(s => s.mood).length).toFixed(1) : null;
  const painSessions = patientSessions.filter(s => s.painReported);
  const notes = patientSessions.filter(s => s.note).map(s => ({ date: s.date, note: s.note! }));

  // Schedule distribution
  const schedDist = { morning: 0, afternoon: 0, evening: 0 };
  patientSessions.forEach(s => { if (s.timeOfDay) schedDist[s.timeOfDay]++; });
  const topTime = Object.entries(schedDist).sort((a, b) => b[1] - a[1])[0];

  // Exercise completion rates
  const exerciseCompletion = planExercises.map(ex => ({
    name: ex.name,
    rate: Math.round(40 + Math.random() * 60), // simulated
    flagged: Math.random() < 0.3,
  }));

  const insufficientData = patientSessions.length < 3;

  return (
    <AppShell hideNav>
      <ScreenHeader title={patient.name} backButton rightAction={
        <button onClick={() => setShowActions(!showActions)} className="text-muted-foreground text-lg" aria-label="Acciones">⋯</button>
      } />

      {/* Actions dropdown */}
      {showActions && (
        <div className="absolute right-4 top-14 bg-card border border-border rounded-xl shadow-kiki z-20 py-1 w-48">
          <button onClick={() => { setShowActions(false); setRegisteringSession(true); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2">
            <CalendarPlus size={14} /> Registrar sesión presencial
          </button>
          <button onClick={() => { archivePatient?.(id!); navigate(-1); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2 text-gold">
            <Archive size={14} /> Archivar paciente
          </button>
          <button onClick={() => { if (confirm('¿Eliminar este paciente? Esta acción no se puede deshacer.')) { deletePatient?.(id!); navigate(-1); } }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2 text-rust">
            <Trash2 size={14} /> Eliminar paciente
          </button>
        </div>
      )}

      {/* Register presencial session */}
      {registeringSession && (
        <div className="mx-4 mb-4 p-4 rounded-xl border border-mint-200 bg-mint-50 space-y-3">
          <h3 className="text-sm font-semibold">Registrar sesión presencial</h3>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Fecha de la sesión</label>
            <input type="date" className="input-kiki text-sm" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Próxima sesión presencial</label>
            <input type="date" className="input-kiki text-sm" value={nextSessionDate} onChange={e => setNextSessionDate(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setRegisteringSession(false); }} className="btn-primary flex-1 text-xs">Registrar</button>
            <button onClick={() => setRegisteringSession(false)} className="btn-ghost flex-1 text-xs">Cancelar</button>
          </div>
        </div>
      )}

      <div className="px-4 pb-6">
        {/* Hero */}
        <KikiCard className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <AvatarCircle name={patient.name} color={patient.avatarColor} size="lg" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{patient.name}</h2>
              <p className="text-sm text-muted-foreground">{patient.age} años · {patient.diagnosis}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">GMFCS {patient.gmfcs}</span>
                <RiskBadge level={riskLevel} />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Cuidadora: {patient.caregiverName}</p>
          <div className="mt-3"><AdherenceBar percent={patient.adherence} /></div>
        </KikiCard>

        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-1 mb-4">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === i ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
              {tab}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
          {activeTab === 0 && (
            <div className="space-y-4">
              {riskLevel !== 'BAJO' && (
                <KikiCard className={`border-l-4 ${riskLevel === 'ALTO' ? 'border-l-rust bg-red-50' : 'border-l-gold bg-amber-50'}`}>
                  <p className="text-sm font-medium">Alerta MAA: Riesgo {riskLevel}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {riskLevel === 'ALTO' ? 'Frecuencia de sesiones muy por debajo del objetivo.' : 'Reducción gradual de adherencia detectada.'}
                  </p>
                </KikiCard>
              )}

              <div>
                <h3 className="text-sm font-semibold mb-2">Tendencia de adherencia</h3>
                <KikiCard>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={weeklyAdherence}>
                      <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#7A8FA8' }} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="adherence" stroke="#7EEDC4" strokeWidth={2.5} dot={{ fill: '#7EEDC4', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </KikiCard>
              </div>

              {/* Auto-generated Pre-session Report */}
              <KikiCard>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-mint-600" />
                  <h3 className="text-sm font-semibold">Pre-informe de sesión — {patient.name}</h3>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Período: últimos {periodDays} días · {expectedSessions} sesiones esperadas
                </p>

                {/* Adherence */}
                <div className="space-y-2 mb-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Adherencia</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground text-xs">Completadas:</span> <span className="font-medium">{completed}/{expectedSessions} ({adherencePercent}%)</span></div>
                    <div><span className="text-muted-foreground text-xs">Racha más larga:</span> <span className="font-medium">{longestStreak} días</span></div>
                    <div><span className="text-muted-foreground text-xs">Mayor pausa:</span> <span className="font-medium">{longestGap} días</span></div>
                    <div><span className="text-muted-foreground text-xs">Último activo:</span> <span className="font-medium">{dates[dates.length - 1] || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Session quality */}
                <div className="space-y-2 mb-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Calidad de sesiones</p>
                  {insufficientData ? (
                    <p className="text-xs text-muted-foreground italic">Datos insuficientes (menos de 3 sesiones registradas)</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground text-xs">Dificultad prom.:</span> <span className="font-medium">{avgDiff}/5</span></div>
                      <div><span className="text-muted-foreground text-xs">Ánimo prom.:</span> <span className="font-medium">{avgMood}/5 {avgMood ? moodEmojis[Math.round(Number(avgMood)) - 1] : ''}</span></div>
                      <div><span className="text-muted-foreground text-xs">Con dolor:</span> <span className={`font-medium ${painSessions.length > 0 ? 'text-rust' : ''}`}>{painSessions.length} sesiones</span></div>
                      <div><span className="text-muted-foreground text-xs">Alternativa usada:</span> <span className="font-medium">{Math.round(completed * 0.15)} sesiones</span></div>
                    </div>
                  )}
                </div>

                {showFullReport && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-3 border-t border-border">
                    {/* Skipped exercises */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Ejercicios menos completados</p>
                      {exerciseCompletion.map((ex, i) => (
                        <div key={i} className="flex items-center justify-between py-1 text-xs">
                          <span className="truncate flex-1">{ex.name}</span>
                          <span className={`font-medium ${ex.rate < 50 ? 'text-rust' : ''}`}>{ex.rate}% {ex.rate < 50 && '⚠️'}</span>
                        </div>
                      ))}
                    </div>

                    {/* Schedule */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Horario habitual</p>
                      <div className="flex gap-3">
                        {(['morning', 'afternoon', 'evening'] as const).map(t => {
                          const count = schedDist[t];
                          const label = t === 'morning' ? 'Mañana' : t === 'afternoon' ? 'Tarde' : 'Noche';
                          const isTop = topTime && topTime[0] === t;
                          return (
                            <div key={t} className={`flex-1 text-center p-2 rounded-lg ${isTop ? 'bg-mint-50 border border-mint-200' : 'bg-muted/50'}`}>
                              <p className="text-sm font-bold">{count}</p>
                              <p className="text-[10px] text-muted-foreground">{label}{isTop ? ' ⭐' : ''}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Caregiver notes */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Notas del cuidador</p>
                      {notes.length > 0 ? notes.map((n, i) => (
                        <div key={i} className="flex gap-2 py-1.5 border-b border-border last:border-0">
                          <span className="text-[10px] text-muted-foreground shrink-0">{n.date}</span>
                          <span className="text-xs italic text-foreground">"{n.note}"</span>
                        </div>
                      )) : <p className="text-xs text-muted-foreground italic">Sin notas en este período.</p>}
                    </div>

                    {/* MAA Status */}
                    <div className={`p-3 rounded-lg ${riskLevel === 'ALTO' ? 'bg-red-50 border border-red-200' : riskLevel === 'MODERADO' ? 'bg-amber-50 border border-amber-200' : 'bg-mint-50 border border-mint-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <RiskBadge level={riskLevel} />
                        <span className="text-xs font-semibold">Estado MAA</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {riskLevel === 'BAJO' && 'Patrón consistente con línea base personal. Sin intervención necesaria.'}
                        {riskLevel === 'MODERADO' && 'Desviación incipiente detectada. Monitorear en la próxima semana.'}
                        {riskLevel === 'ALTO' && `Sin sesiones en ${patient.lastSessionDaysAgo} días. Intervención recomendada antes de esta sesión.`}
                      </p>
                    </div>
                  </motion.div>
                )}

                <button onClick={() => setShowFullReport(!showFullReport)} className="btn-secondary w-full mt-3 text-sm">
                  {showFullReport ? 'Ocultar informe completo' : 'Ver informe completo'}
                </button>
              </KikiCard>
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-4">
              <KikiCard>
                <h3 className="text-sm font-semibold">{plan?.name || 'Plan actual'}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {patient.sessionsPerWeek.toFixed(0)}x por semana · En curso
                </p>
              </KikiCard>
              <div className="space-y-2">
                {planExercises.map(ex => (
                  <ExerciseCard key={ex.id} name={ex.name} duration={ex.duration} sets={ex.sets} reps={ex.reps} thumbnailColor={ex.thumbnailColor} targetArea={ex.targetArea} />
                ))}
              </div>
              <button onClick={() => navigate(`/kine/patients/${id}/plan/edit`)} className="btn-primary w-full text-sm">
                <Edit size={14} className="inline mr-1" /> Modificar plan
              </button>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 rounded-full bg-gold" />)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">= Dificultad reportada por el cuidador (1 fácil – 5 muy difícil)</span>
                </div>
              </div>
              {patientSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin sesiones registradas</p>
              ) : (
                [...patientSessions].reverse().map(s => (
                  <KikiCard key={s.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{s.date}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.exercisesCompleted}/{s.totalExercises} ejercicios · {s.durationMinutes}min
                          {s.timeOfDay && <span> · {s.timeOfDay === 'morning' ? '🌅 Mañana' : s.timeOfDay === 'afternoon' ? '☀️ Tarde' : '🌙 Noche'}</span>}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1" title={`Dificultad: ${s.difficulty}/5`}>
                          {[1,2,3,4,5].map(star => (
                            <div key={star} className={`w-2 h-2 rounded-full ${star <= s.difficulty ? 'bg-gold' : 'bg-muted'}`} />
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          {s.mood && <span className="text-xs" title={`Ánimo: ${s.mood}/5`}>{moodEmojis[s.mood - 1]}</span>}
                          {s.painReported && <span className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-rust font-medium">Dolor</span>}
                        </div>
                      </div>
                    </div>
                    {s.note && <p className="text-xs text-muted-foreground mt-2 italic bg-muted/50 rounded-lg p-2">"{s.note}"</p>}
                  </KikiCard>
                ))
              )}
            </div>
          )}
        </motion.div>

        <div className="flex gap-3 mt-6">
          <button className="btn-secondary flex-1 text-sm" onClick={() => navigate(`/kine/messages/conv-1`)}>
            <Send size={14} className="inline mr-1" /> Enviar mensaje
          </button>
          <button className="btn-primary flex-1 text-sm" onClick={() => navigate(`/kine/patients/${id}/plan/edit`)}>
            <Edit size={14} className="inline mr-1" /> Modificar plan
          </button>
        </div>
      </div>
    </AppShell>
  );
}
