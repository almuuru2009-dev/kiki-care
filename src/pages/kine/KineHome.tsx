import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CalendarCheck, MessageCircle, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard, StatBadge, AvatarCircle } from '@/components/kiki/KikiComponents';
import { PatientCard } from '@/components/kiki/PatientCard';
import { useAppStore } from '@/stores/useAppStore';

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } },
};

export default function KineHome() {
  const navigate = useNavigate();
  const { currentUser, patients, maaAlerts, conversations, dailySessions } = useAppStore();

  const activeAlerts = maaAlerts.filter(a => a.isActive);
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();
  const firstName = currentUser?.name.split(' ').pop() || 'Valeria';

  const recentPatients = patients.slice().sort((a, b) => a.lastSessionDaysAgo - b.lastSessionDaysAgo).slice(0, 4);

  return (
    <AppShell>
      <motion.div className="px-4 pb-6" variants={stagger.container} initial="initial" animate="animate">
        {/* Header */}
        <motion.div variants={stagger.item} className="flex items-center justify-between pt-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">{greeting}, {firstName}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {patients.length} pacientes activos
            </p>
          </div>
          <AvatarCircle name={currentUser?.name || 'VM'} color="#7EEDC4" size="md" />
        </motion.div>

        {/* MAA Alert Banner */}
        {activeAlerts.length > 0 && (
          <motion.div variants={stagger.item}>
            <KikiCard
              className="bg-amber-50 border-l-4 border-l-gold mb-4 cursor-pointer"
              onClick={() => navigate('/kine/alerts')}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-gold shrink-0" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activeAlerts.length} {activeAlerts.length === 1 ? 'familia' : 'familias'} en riesgo de abandono
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    Ver alertas <ChevronRight size={12} />
                  </p>
                </div>
              </div>
            </KikiCard>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div variants={stagger.item} className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
          <StatBadge
            value={`${Math.round(patients.reduce((s, p) => s + p.adherence, 0) / patients.length)}%`}
            label="Adherencia promedio"
            color="bg-mint-50"
          />
          <StatBadge
            value="14"
            label="Sesiones hoy"
            icon={<CalendarCheck size={16} className="text-mint-500" />}
            color="bg-blue-50"
          />
          <StatBadge
            value={unreadMessages}
            label="Mensajes sin leer"
            icon={<MessageCircle size={16} className="text-blue-brand" />}
            color="bg-blue-50"
          />
        </motion.div>

        {/* Upcoming sessions */}
        <motion.div variants={stagger.item} className="mt-5">
          <h2 className="text-base font-semibold mb-3">Próximas sesiones presenciales</h2>
          <div className="space-y-2">
            {[patients[0], patients[2]].map((p, i) => (
              <KikiCard key={p.id} className={`border-l-4 ${i === 0 ? 'border-l-mint' : 'border-l-blue-brand'}`} onClick={() => navigate(`/kine/patients/${p.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{i === 0 ? 'Mié 5 mar · 10:00' : 'Jue 6 mar · 14:30'}</p>
                  </div>
                  <button className="text-xs text-mint-500 font-medium">Ver pre-informe →</button>
                </div>
              </KikiCard>
            ))}
          </div>
        </motion.div>

        {/* Weekly chart */}
        <motion.div variants={stagger.item} className="mt-5">
          <h2 className="text-base font-semibold mb-3">Sesiones registradas esta semana</h2>
          <KikiCard>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={dailySessions}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#7A8FA8' }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="sessions" fill="#7EEDC4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </KikiCard>
        </motion.div>

        {/* Recent patients */}
        <motion.div variants={stagger.item} className="mt-5">
          <h2 className="text-base font-semibold mb-3">Actividad reciente</h2>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
            {recentPatients.map(p => (
              <PatientCard key={p.id} patient={p} compact onClick={() => navigate(`/kine/patients/${p.id}`)} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
