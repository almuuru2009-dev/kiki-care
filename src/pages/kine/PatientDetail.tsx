import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MoreVertical, Send, Edit } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle, AdherenceBar, RiskBadge } from '@/components/kiki/KikiComponents';
import { ExerciseCard } from '@/components/kiki/ExerciseCard';
import { useAppStore } from '@/stores/useAppStore';

const tabs = ['Resumen', 'Plan', 'Historial'];

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, exercises, exercisePlans, sessions, weeklyAdherence } = useAppStore();
  const [activeTab, setActiveTab] = useState(0);

  const patient = patients.find(p => p.id === id);
  if (!patient) return <AppShell><div className="p-4">Paciente no encontrado</div></AppShell>;

  const plan = exercisePlans.find(p => p.patientId === id);
  const planExercises = plan ? exercises.filter(e => plan.exercises.includes(e.id)) : exercises.slice(0, 3);
  const patientSessions = sessions.filter(s => s.patientId === id).slice(-10);

  const riskLevel = patient.adherence >= 75 ? 'BAJO' as const : patient.adherence >= 50 ? 'MODERADO' as const : 'ALTO' as const;

  return (
    <AppShell>
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

              <KikiCard>
                <h3 className="text-sm font-semibold mb-2">Pre-informe de sesión</h3>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Sesiones realizadas:</span> <span className="font-medium">18/20</span></p>
                  <p><span className="text-muted-foreground">Dificultad promedio:</span> <span className="font-medium">3.1/5</span></p>
                  <p><span className="text-muted-foreground">Mejor día:</span> <span className="font-medium">Martes</span></p>
                </div>
                <button
                  onClick={() => navigate(`/kine/patients/${id}/pre-report`)}
                  className="btn-secondary w-full mt-3 text-sm"
                >
                  Ver informe completo
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
                Modificar plan
              </button>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-3">
              {patientSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin sesiones registradas</p>
              ) : (
                patientSessions.reverse().map(s => (
                  <KikiCard key={s.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{s.date}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.exercisesCompleted}/{s.totalExercises} ejercicios · {s.durationMinutes}min
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(star => (
                          <div key={star} className={`w-2 h-2 rounded-full ${star <= s.difficulty ? 'bg-gold' : 'bg-muted'}`} />
                        ))}
                      </div>
                    </div>
                    {s.note && <p className="text-xs text-muted-foreground mt-2 italic">"{s.note}"</p>}
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
