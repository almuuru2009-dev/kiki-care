import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Star, Trophy, Gift, Award, ChevronRight, Lock } from 'lucide-react';

interface SessionData {
  id: string;
  completed_at: string;
  difficulty: number | null;
  child_mood: number | null;
}

interface PointsData {
  month: number;
  year: number;
  points: number;
  sessions_completed: number;
  sessions_required: number;
  star_earned: boolean;
}

interface MedalData {
  id: string;
  medal_type: string;
  title: string;
  description: string | null;
  points_awarded: number;
  earned_at: string;
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const medalDefs = [
  { type: 'first-session', icon: '⭐', title: 'Primera sesión', desc: 'Completá tu primera sesión', threshold: 1, points: 10 },
  { type: 'streak-3', icon: '🔥', title: 'Racha de 3', desc: '3 sesiones seguidas', threshold: 3, points: 15 },
  { type: 'streak-7', icon: '💪', title: 'Semana completa', desc: '7 sesiones seguidas', threshold: 7, points: 25 },
  { type: 'ten-sessions', icon: '🏅', title: '10 sesiones', desc: 'Completá 10 sesiones', threshold: 10, points: 30 },
  { type: 'twenty-sessions', icon: '🏆', title: 'Campeón', desc: 'Completá 20 sesiones', threshold: 20, points: 50 },
  { type: 'fifty-sessions', icon: '👑', title: 'Leyenda', desc: 'Completá 50 sesiones', threshold: 50, points: 100 },
  { type: 'hundred-sessions', icon: '🌟', title: 'Centenario', desc: 'Completá 100 sesiones', threshold: 100, points: 200 },
  { type: 'month-perfect', icon: '🎯', title: 'Mes perfecto', desc: 'Completá todas las sesiones de un mes', threshold: 10, points: 50 },
];

export default function ProgressScreen() {
  const { user } = useAuthContext();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [childName, setChildName] = useState('Mi niño');
  const [loading, setLoading] = useState(true);
  const [monthlyPoints, setMonthlyPoints] = useState<PointsData[]>([]);
  const [medals, setMedals] = useState<MedalData[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showMedals, setShowMedals] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: children } = await supabase
      .from('children').select('name').eq('caregiver_id', user.id).limit(1);
    if (children && children.length > 0) setChildName(children[0].name);

    const { data } = await supabase
      .from('sessions').select('id, completed_at, difficulty, child_mood')
      .eq('caregiver_id', user.id).order('completed_at', { ascending: false });
    setSessions(data || []);

    // Load points
    const { data: pts } = await supabase
      .from('user_points').select('*').eq('user_id', user.id)
      .order('year', { ascending: true }).order('month', { ascending: true });
    setMonthlyPoints(pts || []);
    setTotalPoints((pts || []).reduce((s, p) => s + p.points, 0));

    // Load medals
    const { data: meds } = await supabase
      .from('medals').select('*').eq('user_id', user.id);
    setMedals(meds || []);

    // Auto-award medals based on session count
    const sessionCount = (data || []).length;
    await checkAndAwardMedals(sessionCount, meds || []);

    setLoading(false);
  };

  const checkAndAwardMedals = async (count: number, existing: MedalData[]) => {
    if (!user) return;
    const now = new Date();
    const year = now.getFullYear();
    const earnedTypes = new Set(existing.map(m => m.medal_type));

    for (const def of medalDefs) {
      if (def.type === 'month-perfect') continue;
      if (count >= def.threshold && !earnedTypes.has(def.type)) {
        const { data: newMedal } = await supabase.from('medals').insert({
          user_id: user.id, medal_type: def.type, title: def.title,
          description: def.desc, points_awarded: def.points, year,
        }).select().single();
        if (newMedal) {
          setMedals(prev => [...prev, newMedal]);
          setTotalPoints(prev => prev + def.points);
        }
      }
    }
  };

  const totalSessions = sessions.length;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const daysActive = new Set(sessions.map(s => new Date(s.completed_at).toISOString().split('T')[0])).size;
  const annualGoal = 200;
  const annualProgress = Math.min(100, Math.round((totalSessions / annualGoal) * 100));
  const monthlyGoal = 10;
  const thisMonthSessions = sessions.filter(s => {
    const d = new Date(s.completed_at);
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
  }).length;
  const monthlyProgress = Math.min(100, Math.round((thisMonthSessions / monthlyGoal) * 100));
  const starsEarned = monthlyPoints.filter(p => p.star_earned).length;
  const adherencePercent = annualGoal > 0 ? Math.round((totalSessions / annualGoal) * 100) : 0;
  const canEnterRaffle = adherencePercent >= 85 && totalPoints >= 100;

  // Weekly chart
  const weeklyData = [
    { week: 'S1', adherence: 0 }, { week: 'S2', adherence: 0 },
    { week: 'S3', adherence: 0 }, { week: 'S4', adherence: 0 },
  ];
  const now = new Date();
  sessions.forEach(s => {
    const date = new Date(s.completed_at);
    const weeksAgo = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weeksAgo < 4) {
      weeklyData[3 - weeksAgo].adherence = Math.min(100, weeklyData[3 - weeksAgo].adherence + Math.round(100 / 7));
    }
  });

  // Calendar data for current month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const sessionDatesThisMonth = new Set(
    sessions.filter(s => {
      const d = new Date(s.completed_at);
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
    }).map(s => new Date(s.completed_at).getDate())
  );

  const earnedMedalTypes = new Set(medals.map(m => m.medal_type));

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
            <div className="w-20 h-20 rounded-full bg-mint-50 flex items-center justify-center mb-4">
              <span className="text-4xl">🦎</span>
            </div>
            <h3 className="font-semibold text-foreground">¡Hola! Soy Kiky</h3>
            <p className="text-sm text-muted-foreground mt-1 px-4">
              Completá tu primera sesión de ejercicios para empezar a ganar puntos y medallas 🏅
            </p>
            <div className="mt-4 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground max-w-[280px]">
              <p className="font-medium text-foreground mb-1">¿Cómo funciona?</p>
              <p>• Completá ~10 sesiones por mes</p>
              <p>• Ganá estrellas mensuales ⭐</p>
              <p>• Acumulá puntos con medallas 🏆</p>
              <p>• Participá del sorteo anual 🎁</p>
            </div>
          </div>
        ) : (
          <>
            {/* Kiky mascot + annual progress */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-2xl bg-gradient-to-br from-mint-200 via-mint-100 to-mint-50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">🦎</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-navy">¡Seguí así, {childName}!</p>
                    <p className="text-xs text-navy/70">{totalSessions} de {annualGoal} sesiones anuales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-navy">{totalPoints}</p>
                    <p className="text-[9px] text-navy/60">puntos</p>
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-navy/10">
                  <motion.div className="h-3 rounded-full bg-navy/40" initial={{ width: 0 }}
                    animate={{ width: `${annualProgress}%` }} transition={{ duration: 0.8 }} />
                </div>
                <p className="text-[10px] text-navy/60 mt-1">{annualProgress}% del objetivo anual</p>
              </div>
            </motion.div>

            {/* Monthly status */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="grid grid-cols-3 gap-2">
                <KikiCard className="text-center !p-3">
                  <p className="text-lg font-bold text-mint">{thisMonthSessions}/{monthlyGoal}</p>
                  <p className="text-[10px] text-muted-foreground">Este mes</p>
                </KikiCard>
                <KikiCard className="text-center !p-3">
                  <div className="flex justify-center gap-0.5 mb-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Star key={i} size={10} className={i < starsEarned ? 'text-gold fill-gold' : 'text-muted'} />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{starsEarned} estrellas</p>
                </KikiCard>
                <KikiCard className="text-center !p-3">
                  <p className="text-lg font-bold text-foreground">{daysActive}</p>
                  <p className="text-[10px] text-muted-foreground">Días activos</p>
                </KikiCard>
              </div>
            </motion.div>

            {/* Monthly progress bar */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <KikiCard>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Progreso mensual</h3>
                  <span className="text-xs text-muted-foreground">{MONTHS_ES[currentMonth - 1]} {currentYear}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Completá {monthlyGoal} sesiones para ganar una ⭐ y {monthlyGoal * 5} puntos
                </p>
                <div className="w-full h-3 rounded-full bg-muted">
                  <motion.div className={`h-3 rounded-full ${monthlyProgress >= 100 ? 'bg-mint' : monthlyProgress >= 50 ? 'bg-gold' : 'bg-rust/60'}`}
                    initial={{ width: 0 }} animate={{ width: `${monthlyProgress}%` }} transition={{ duration: 0.6 }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{monthlyProgress}% completado</p>
                {monthlyProgress < 100 && thisMonthSessions < monthlyGoal && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Faltan {monthlyGoal - thisMonthSessions} sesiones para ganar la estrella de este mes
                  </p>
                )}
              </KikiCard>
            </motion.div>

            {/* Adherence chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <KikiCard>
                <h3 className="text-sm font-semibold mb-1">Adherencia semanal</h3>
                <p className="text-[10px] text-muted-foreground mb-2">Porcentaje de días con sesión en las últimas 4 semanas</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#7A8FA8' }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Calendario · {MONTHS_ES[currentMonth - 1]}</h3>
                  <span className="text-[10px] text-muted-foreground">🟢 = sesión completada</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const hasSession = sessionDatesThisMonth.has(day);
                    const isToday = day === now.getDate();
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <span className={`text-[10px] mb-0.5 ${isToday ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{day}</span>
                        <div className={`w-5 h-5 rounded-full ${hasSession ? 'bg-mint' : isToday ? 'border-2 border-mint bg-background' : 'bg-muted'}`} />
                      </div>
                    );
                  })}
                </div>
              </KikiCard>
            </motion.div>

            {/* Medals section */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <KikiCard className="bg-gradient-to-br from-amber-50 to-orange-50" onClick={() => setShowMedals(!showMedals)}>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <Trophy size={28} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-foreground">Medallas</h3>
                    <p className="text-xs text-muted-foreground">
                      {medals.length} ganadas · {totalPoints} puntos acumulados
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Ganá medallas completando sesiones y acumulá puntos 🦎
                    </p>
                  </div>
                  <ChevronRight size={18} className={`text-muted-foreground transition-transform ${showMedals ? 'rotate-90' : ''}`} />
                </div>
              </KikiCard>
            </motion.div>

            {showMedals && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                {/* Earned */}
                {medals.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-2">Ganadas ✨</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {medals.map(m => {
                        const def = medalDefs.find(d => d.type === m.medal_type);
                        return (
                          <div key={m.id} className="rounded-xl p-2 text-center bg-gradient-to-br from-mint-200 to-mint-50 shadow-sm">
                            <span className="text-2xl">{def?.icon || '🏅'}</span>
                            <p className="text-[9px] font-bold text-navy leading-tight mt-1">{m.title}</p>
                            <p className="text-[8px] text-mint-700">+{m.points_awarded}pts</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Locked */}
                <div>
                  <h4 className="text-xs font-semibold mb-2">Por desbloquear 🔒</h4>
                  <div className="space-y-1.5">
                    {medalDefs.filter(d => !earnedMedalTypes.has(d.type)).map(def => (
                      <div key={def.type} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center relative">
                          <span className="text-xl opacity-30">{def.icon}</span>
                          <Lock size={8} className="absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">{def.title}</p>
                          <p className="text-[10px] text-muted-foreground">{def.desc}</p>
                        </div>
                        <span className="text-[10px] text-mint font-medium">+{def.points}pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Annual raffle */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <KikiCard className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Gift size={22} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">Sorteo anual 🎁</h3>
                    <p className="text-[10px] text-muted-foreground">
                      Un premio sorpresa para quienes cumplan sus metas
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${adherencePercent >= 85 ? 'bg-mint-100 text-mint-700' : 'bg-muted text-muted-foreground'}`}>
                        Adherencia: {adherencePercent}% {adherencePercent >= 85 ? '✓' : '(mín. 85%)'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${totalPoints >= 100 ? 'bg-mint-100 text-mint-700' : 'bg-muted text-muted-foreground'}`}>
                        Puntos: {totalPoints} {totalPoints >= 100 ? '✓' : '(mín. 100)'}
                      </span>
                    </div>
                  </div>
                </div>
                {canEnterRaffle ? (
                  <div className="mt-3 p-2 rounded-lg bg-mint-100 text-center">
                    <p className="text-xs font-semibold text-mint-700">🎉 ¡Estás participando del sorteo!</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Necesitás al menos 85% de adherencia y 100 puntos para participar. ¡Seguí sumando!
                  </p>
                )}
              </KikiCard>
            </motion.div>

            {/* Points explanation */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <KikiCard className="bg-muted/30">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1"><Award size={14} /> ¿Cómo funcionan los puntos?</h3>
                <div className="space-y-1 text-[10px] text-muted-foreground">
                  <p>• Completá <span className="font-medium text-foreground">10 sesiones/mes</span> para ganar una ⭐ (+50 pts)</p>
                  <p>• Las <span className="font-medium text-foreground">medallas</span> otorgan puntos extra</p>
                  <p>• Con <span className="font-medium text-foreground">≥85% adherencia + 100 pts</span> participás del sorteo anual</p>
                  <p>• Los puntos y medallas se renuevan cada año tras el sorteo</p>
                  <p>• Si no cumplís un mes, las sesiones siguientes no se desbloquean hasta regularizar</p>
                </div>
              </KikiCard>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
