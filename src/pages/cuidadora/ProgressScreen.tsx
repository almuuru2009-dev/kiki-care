import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp } from 'lucide-react';

interface SessionData {
  id: string;
  completed_at: string;
  difficulty: number | null;
  child_mood: number | null;
}

export default function ProgressScreen() {
  const { user } = useAuthContext();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [childName, setChildName] = useState('Mi niño');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Get child name
    const { data: children } = await supabase
      .from('children')
      .select('name')
      .eq('caregiver_id', user.id)
      .limit(1);

    if (children && children.length > 0) {
      setChildName(children[0].name);
    }

    // Get sessions
    const { data } = await supabase
      .from('sessions')
      .select('id, completed_at, difficulty, child_mood')
      .eq('caregiver_id', user.id)
      .order('completed_at', { ascending: false });

    setSessions(data || []);
    setLoading(false);
  };

  const totalSessions = sessions.length;
  const daysActive = new Set(sessions.map(s => new Date(s.completed_at).toISOString().split('T')[0])).size;

  // Weekly adherence chart data (last 4 weeks)
  const weeklyData = [
    { week: 'S1', adherence: 0 },
    { week: 'S2', adherence: 0 },
    { week: 'S3', adherence: 0 },
    { week: 'S4', adherence: 0 },
  ];

  // Simple calculation: sessions per week out of 7 possible
  const now = new Date();
  sessions.forEach(s => {
    const date = new Date(s.completed_at);
    const weeksAgo = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weeksAgo < 4) {
      weeklyData[3 - weeksAgo].adherence = Math.min(100, weeklyData[3 - weeksAgo].adherence + Math.round(100 / 7));
    }
  });

  return (
    <AppShell>
      <ScreenHeader title={`Progreso de ${childName}`} />
      <div className="px-4 pb-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : totalSessions === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <TrendingUp size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">Sin sesiones completadas</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Completá sesiones de ejercicios para ver tu progreso acá
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-xl bg-navy p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: `${daysActive}`, label: 'Días activos' },
                    { value: totalSessions.toString(), label: 'Sesiones' },
                    { value: `${Math.round((daysActive / 30) * 100)}%`, label: 'Adherencia' },
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
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#7A8FA8' }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="adherence" radius={[4, 4, 0, 0]}>
                      {weeklyData.map((entry, i) => (
                        <Cell key={i} fill={entry.adherence >= 70 ? '#7EEDC4' : entry.adherence >= 50 ? '#D4971A' : '#C84B2F'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </KikiCard>
            </motion.div>

            {/* Calendar */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <KikiCard>
                <h3 className="text-sm font-semibold mb-3">Calendario de actividad</h3>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const day = i + 1;
                    const hasSession = sessions.some(s => new Date(s.completed_at).getDate() === day);
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground mb-0.5">{day}</span>
                        <div className={`w-5 h-5 rounded-full ${hasSession ? 'bg-mint' : 'bg-muted'}`} />
                      </div>
                    );
                  })}
                </div>
              </KikiCard>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
