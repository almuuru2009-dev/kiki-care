import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';

export default function ProgressScreen() {
  const { sessions, weeklyAdherence, exercises } = useAppStore();
  const totalSessions = sessions.length;
  const daysActive = new Set(sessions.map(s => s.date)).size;

  return (
    <AppShell>
      <ScreenHeader title="Progreso de Valentín" />
      <div className="px-4 pb-6 space-y-4">
        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-xl bg-navy p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: `${daysActive}/30`, label: 'Días activos' },
                { value: totalSessions.toString(), label: 'Sesiones' },
                { value: '78%', label: 'Adherencia' },
                { value: '5 días', label: 'Mejor racha' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-lg font-bold text-mint">{s.value}</p>
                  <p className="text-[11px] text-navy-300">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <KikiCard>
            <h3 className="text-sm font-semibold mb-3">Adherencia semanal</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weeklyAdherence}>
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#7A8FA8' }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="adherence" radius={[4, 4, 0, 0]}>
                  {weeklyAdherence.map((entry, i) => (
                    <Cell key={i} fill={entry.adherence >= 70 ? '#7EEDC4' : entry.adherence >= 50 ? '#D4971A' : '#C84B2F'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </KikiCard>
        </motion.div>

        {/* Calendar placeholder */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <KikiCard>
            <h3 className="text-sm font-semibold mb-3">Calendario de actividad</h3>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 30 }).map((_, i) => {
                const hasSession = sessions.some(s => {
                  const d = new Date(s.date).getDate();
                  return d === i + 1;
                });
                return (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground mb-0.5">{i + 1}</span>
                    <div className={`w-5 h-5 rounded-full ${hasSession ? 'bg-mint' : 'bg-muted'}`} />
                  </div>
                );
              })}
            </div>
          </KikiCard>
        </motion.div>

        {/* Top exercises */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-semibold mb-2">Ejercicios más frecuentes</h3>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
            {exercises.slice(0, 4).map(ex => (
              <div key={ex.id} className="min-w-[130px] card-kiki p-3">
                <div className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center" style={{ backgroundColor: ex.thumbnailColor + '30' }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ex.thumbnailColor }} />
                </div>
                <p className="text-xs font-medium truncate">{ex.name.split(' ').slice(0, 3).join(' ')}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{Math.floor(8 + Math.random() * 12)} veces</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
