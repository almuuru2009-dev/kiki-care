import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Edit, FileText, SmilePlus } from 'lucide-react';
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
  const { patients, exercises, exercisePlans, sessions, weeklyAdherence } = useAppStore();
  const [activeTab, setActiveTab] = useState(0);
  const [showFullReport, setShowFullReport] = useState(false);

  const patient = patients.find(p => p.id === id);
  if (!patient) return <AppShell><div className="p-4">Paciente no encontrado</div></AppShell>;

  const plan = exercisePlans.find(p => p.patientId === id);
  const planExercises = plan ? exercises.filter(e => plan.exercises.includes(e.id)) : exercises.slice(0, 3);
  const patientSessions = sessions.filter(s => s.patientId === id).slice(-10);

  const riskLevel = patient.adherence >= 75 ? 'BAJO' as const : patient.adherence >= 50 ? 'MODERADO' as const : 'ALTO' as const;

  // Calculate report data
  const totalAssigned = 20;
  const completed = patientSessions.length;
  const avgDiff = patientSessions.length > 0 ? (patientSessions.reduce((s, sess) => s + sess.difficulty, 0) / patientSessions.length).toFixed(1) : '0';
  const bestDay = 'Martes';
  const notes = patientSessions.filter(s => s.note).map(s => ({ date: s.date, note: s.note! }));
  const avgMood = patientSessions.filter(s => s.mood).length > 0
    ? (patientSessions.filter(s => s.mood).reduce((s, sess) => s + (sess.mood || 3), 0) / patientSessions.filter(s => s.mood).length).toFixed(1)
    : '3.0';
  const painSessions = patientSessions.filter(s => s.painReported).length;

  return (
    <AppShell hideNav>
      <ScreenHeader title={patient.name} backButton />

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
          <div className="mt-3">
            <AdherenceBar percent={patient.adherence} />
          </div>
        </KikiCard>

        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-1 mb-4">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === i ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
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

              {/* Pre-report */}
              <KikiCard>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-mint-600" />
                  <h3 className="text-sm font-semibold">Pre-informe de sesión</h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Sesiones realizadas:</span> <span className="font-medium">{completed}/{totalAssigned}</span></p>
                  <p><span className="text-muted-foreground">Dificultad promedio:</span> <span className="font-medium">{avgDiff}/5</span></p>
                  <p><span className="text-muted-foreground">Mejor día:</span> <span className="font-medium">{bestDay}</span></p>
                  <p><span className="text-muted-foreground">Ánimo promedio:</span> <span className="font-medium">{avgMood}/5 {moodEmojis[Math.round(Number(avgMood)) - 1] || '😐'}</span></p>
                  <p><span className="text-muted-foreground">Sesiones con dolor:</span> <span className="font-medium">{painSessions}</span></p>
                </div>

                {!showFullReport ? (
                  <button onClick={() => setShowFullReport(true)} className="btn-secondary w-full mt-3 text-sm">
                    Ver informe completo
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-3 border-t border-border space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notas del cuidador</p>
                      {notes.length > 0 ? notes.map((n, i) => (
                        <div key={i} className="flex gap-2 py-1.5 border-b border-border last:border-0">
                          <span className="text-[10px] text-muted-foreground shrink-0">{n.date}</span>
                          <span className="text-xs italic text-foreground">"{n.note}"</span>
                        </div>
                      )) : <p className="text-xs text-muted-foreground">Sin notas en este período</p>}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Distribución por horario</p>
                      <div className="flex gap-3">
                        {['morning', 'afternoon', 'evening'].map(t => {
                          const count = patientSessions.filter(s => s.timeOfDay === t).length;
                          const label = t === 'morning' ? 'Mañana' : t === 'afternoon' ? 'Tarde' : 'Noche';
                          return (
                            <div key={t} className="flex-1 text-center p-2 rounded-lg bg-muted/50">
                              <p className="text-sm font-bold">{count}</p>
                              <p className="text-[10px] text-muted-foreground">{label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Estado MAA</p>
                      <div className="flex items-center gap-2">
                        <RiskBadge level={riskLevel} />
                        <span className="text-xs text-muted-foreground">durante el período analizado</span>
                      </div>
                    </div>
                  </motion.div>
                )}
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
                  <ExerciseCard
                    key={ex.id}
                    name={ex.name}
                    duration={ex.duration}
                    sets={ex.sets}
                    reps={ex.reps}
                    thumbnailColor={ex.thumbnailColor}
                    targetArea={ex.targetArea}
                  />
                ))}
              </div>

              <button
                onClick={() => navigate(`/kine/patients/${id}/plan/edit`)}
                className="btn-primary w-full text-sm"
              >
                <Edit size={14} className="inline mr-1" /> Modificar plan
              </button>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-3">
              {/* Legend */}
              <div className="flex items-center gap-3 px-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 rounded-full bg-gold" />)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">= Dificultad reportada (1–5)</span>
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

        {/* Bottom actions */}
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
