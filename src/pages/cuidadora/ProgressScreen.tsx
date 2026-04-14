import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Flame, ChevronRight, Trophy, HelpCircle, Calendar as CalendarIcon, PlayCircle } from 'lucide-react';

interface SessionData {
  id: string;
  completed_at: string;
  difficulty: number | null;
  child_mood: number | null;
}

interface MedalData {
  id: string;
  medal_type: string;
  title: string;
  description: string | null;
  points_awarded: number;
  earned_at: string;
}

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Three-tier medal system
const medalDefs = [
  // Inicio (quick wins)
  { type: 'first-session', icon: '⭐', title: 'Primera sesión', desc: 'Completá tu primera sesión', threshold: 1, tier: 'inicio' },
  { type: 'streak-3', icon: '🔥', title: 'Racha de 3', desc: '3 días seguidos', threshold: 3, tier: 'inicio' },
  { type: 'five-sessions', icon: '🎯', title: '5 sesiones', desc: 'Completá 5 sesiones', threshold: 5, tier: 'inicio' },
  // Progreso mensual
  { type: 'ten-sessions', icon: '🏅', title: '10 sesiones', desc: 'Completá 10 sesiones', threshold: 10, tier: 'mensual' },
  { type: 'streak-7', icon: '💪', title: 'Semana completa', desc: '7 días seguidos', threshold: 7, tier: 'mensual' },
  { type: 'twenty-sessions', icon: '🏆', title: 'Campeón', desc: '20 sesiones', threshold: 20, tier: 'mensual' },
  { type: 'month-perfect', icon: '🌟', title: 'Mes perfecto', desc: 'Todas las sesiones del mes', threshold: 10, tier: 'mensual' },
  // Logros anuales
  { type: 'fifty-sessions', icon: '👑', title: 'Leyenda', desc: '50 sesiones', threshold: 50, tier: 'anual' },
  { type: 'hundred-sessions', icon: '💎', title: 'Centenario', desc: '100 sesiones', threshold: 100, tier: 'anual' },
  { type: 'year-consistent', icon: '🏛️', title: 'Constancia anual', desc: 'Al menos 1 sesión cada mes durante 12 meses', threshold: 12, tier: 'anual' },
];

export default function ProgressScreen() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [childName, setChildName] = useState('Mi niño');
  const [loading, setLoading] = useState(true);
  const [medals, setMedals] = useState<MedalData[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showPointsInfo, setShowPointsInfo] = useState(false);
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

    const { data: pts } = await supabase
      .from('user_points').select('*').eq('user_id', user.id);
    setTotalPoints((pts || []).reduce((s, p) => s + p.points, 0));

    const { data: meds } = await supabase
      .from('medals').select('*').eq('user_id', user.id);
    setMedals(meds || []);

    const sessionCount = (data || []).length;
    await checkAndAwardMedals(sessionCount, meds || []);

    setLoading(false);
  };

  const checkAndAwardMedals = async (count: number, existing: MedalData[]) => {
    if (!user) return;
    const year = new Date().getFullYear();
    const earnedTypes = new Set(existing.map(m => m.medal_type));
    for (const def of medalDefs) {
      if (def.type === 'month-perfect' || def.type === 'year-consistent') continue;
      if (count >= def.threshold && !earnedTypes.has(def.type)) {
        const points = def.tier === 'inicio' ? 10 : def.tier === 'mensual' ? 25 : 50;
        const { data: newMedal } = await supabase.from('medals').insert({
          user_id: user.id, medal_type: def.type, title: def.title,
          description: def.desc, points_awarded: points, year,
        }).select().single();
        if (newMedal) {
          setMedals(prev => [...prev, newMedal]);
          setTotalPoints(prev => prev + points);
        }
      }
    }
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const today = now.getDate();
  const monthlyGoal = 10;

  const thisMonthSessions = useMemo(() =>
    sessions.filter(s => {
      const d = new Date(s.completed_at);
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
    }), [sessions, currentYear, currentMonth]);

  const monthlyProgress = Math.min(100, Math.round((thisMonthSessions.length / monthlyGoal) * 100));

  // Streak calculation
  const streak = useMemo(() => {
    const dates = [...new Set(sessions.map(s => new Date(s.completed_at).toISOString().split('T')[0]))].sort().reverse();
    if (dates.length === 0) return 0;
    let count = 0;
    const todayStr = now.toISOString().split('T')[0];
    let checkDate = todayStr;
    for (const d of dates) {
      if (d === checkDate) {
        count++;
        const prev = new Date(checkDate);
        prev.setDate(prev.getDate() - 1);
        checkDate = prev.toISOString().split('T')[0];
      } else if (d < checkDate) break;
    }
    return count;
  }, [sessions]);

  // Week sessions
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeekSessions = sessions.filter(s => new Date(s.completed_at) >= weekStart).length;

  // Calendar
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const sessionDatesThisMonth = new Set(
    thisMonthSessions.map(s => new Date(s.completed_at).getDate())
  );
  const todayHasSession = sessionDatesThisMonth.has(today);

  // Greeting
  const hour = now.getHours();
  const greetEmoji = hour < 12 ? '☀️' : hour < 18 ? '🌤' : '🌙';
  const greetText = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  // Next medal to earn
  const earnedTypes = new Set(medals.map(m => m.medal_type));
  const nextMedal = medalDefs.find(d => !earnedTypes.has(d.type));

  // Streak reward message
  const streakMessage = streak === 0
    ? 'Empezá tu racha hoy'
    : streak < 3
    ? `${streak} día${streak > 1 ? 's' : ''} seguido${streak > 1 ? 's' : ''} — ¡seguí así!`
    : `🔥 ${streak} días seguidos — ¡increíble!`;

  return (
    <AppShell>
      <div className="px-4 pb-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header contextual */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
              <p className="text-sm text-muted-foreground">{greetEmoji} {greetText}</p>
              <h1 className="text-xl font-bold text-foreground mt-1">
                {todayHasSession ? '¡Hoy ya completaste tu sesión! 🎉' : 'Hoy te toca tu sesión'}
              </h1>
            </motion.div>

            {/* Main CTA */}
            {!todayHasSession && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
                <button
                  onClick={() => navigate('/cuidadora/session')}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-mint to-mint-600 text-navy font-bold text-lg flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-transform"
                >
                  <PlayCircle size={28} />
                  Completar sesión
                </button>
              </motion.div>
            )}

            {/* Dynamic feedback */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-3 px-1">
                <div className="flex items-center gap-1.5">
                  <Flame size={16} className={streak > 0 ? 'text-orange-500' : 'text-muted-foreground'} />
                  <span className="text-sm font-medium">{streakMessage}</span>
                </div>
              </div>
              {nextMedal && !todayHasSession && (
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  Completá hoy y avanzá hacia la medalla "{nextMedal.title}" {nextMedal.icon}
                </p>
              )}
            </motion.div>

            {/* Three key indicators */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="grid grid-cols-3 gap-2">
                <KikiCard className="text-center !p-3">
                  <div className="w-full h-2 rounded-full bg-muted mb-2">
                    <div className={`h-2 rounded-full transition-all ${monthlyProgress >= 100 ? 'bg-mint' : monthlyProgress >= 50 ? 'bg-amber-400' : 'bg-rust/60'}`}
                      style={{ width: `${monthlyProgress}%` }} />
                  </div>
                  <p className="text-sm font-bold">{thisMonthSessions.length}/{monthlyGoal}</p>
                  <p className="text-[10px] text-muted-foreground">Este mes</p>
                </KikiCard>
                <KikiCard className="text-center !p-3">
                  <p className="text-xl font-bold">{streak}</p>
                  <p className="text-[10px] text-muted-foreground">Racha</p>
                </KikiCard>
                <KikiCard className="text-center !p-3">
                  <p className="text-xl font-bold">{thisWeekSessions}</p>
                  <p className="text-[10px] text-muted-foreground">Esta semana</p>
                </KikiCard>
              </div>
            </motion.div>

            {/* Calendar */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <KikiCard>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <CalendarIcon size={14} />
                    {MONTHS_ES[currentMonth - 1]}
                  </h3>
                  <span className="text-[10px] text-muted-foreground">🟢 sesión completada</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const hasSession = sessionDatesThisMonth.has(day);
                    const isToday = day === today;
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <span className={`text-[10px] mb-0.5 ${isToday ? 'font-bold text-mint' : 'text-muted-foreground'}`}>{day}</span>
                        <div className={`w-5 h-5 rounded-full ${
                          hasSession ? 'bg-mint' :
                          isToday ? 'border-2 border-mint bg-background' :
                          day < today ? 'bg-muted/50' : 'bg-muted'
                        }`} />
                      </div>
                    );
                  })}
                </div>
                {!todayHasSession && (
                  <p className="text-[10px] text-amber-600 mt-2 text-center">
                    Hoy todavía no completaste tu sesión — ¡dale que podés!
                  </p>
                )}
              </KikiCard>
            </motion.div>

            {/* Medals collapsed */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <KikiCard className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20" onClick={() => setShowMedals(!showMedals)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Trophy size={24} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">Medallas ({medals.length})</h3>
                    <p className="text-xs text-muted-foreground">{totalPoints} puntos acumulados</p>
                  </div>
                  <ChevronRight size={18} className={`text-muted-foreground transition-transform ${showMedals ? 'rotate-90' : ''}`} />
                </div>
              </KikiCard>
            </motion.div>

            {showMedals && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {/* Tier: Inicio */}
                <div>
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">🌱 Inicio</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {medalDefs.filter(d => d.tier === 'inicio').map(def => {
                      const earned = earnedTypes.has(def.type);
                      return (
                        <div key={def.type} className={`rounded-xl p-2 text-center ${earned ? 'bg-gradient-to-br from-mint-200 to-mint-50 dark:from-mint-900/30 dark:to-mint-800/20' : 'bg-muted/50 opacity-50'}`}>
                          <span className="text-2xl">{def.icon}</span>
                          <p className="text-[9px] font-bold leading-tight mt-1">{def.title}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Tier: Mensual */}
                <div>
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">📈 Progreso mensual</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {medalDefs.filter(d => d.tier === 'mensual').map(def => {
                      const earned = earnedTypes.has(def.type);
                      return (
                        <div key={def.type} className={`rounded-xl p-2 text-center ${earned ? 'bg-gradient-to-br from-amber-200 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20' : 'bg-muted/50 opacity-50'}`}>
                          <span className="text-xl">{def.icon}</span>
                          <p className="text-[8px] font-bold leading-tight mt-1">{def.title}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Tier: Anual */}
                <div>
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">🏛️ Logros anuales</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {medalDefs.filter(d => d.tier === 'anual').map(def => {
                      const earned = earnedTypes.has(def.type);
                      return (
                        <div key={def.type} className={`rounded-xl p-2 text-center ${earned ? 'bg-gradient-to-br from-purple-200 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20' : 'bg-muted/50 opacity-50'}`}>
                          <span className="text-xl">{def.icon}</span>
                          <p className="text-[8px] font-bold leading-tight mt-1">{def.title}</p>
                          <p className="text-[7px] text-muted-foreground">{def.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Points info button */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <button
                onClick={() => setShowPointsInfo(!showPointsInfo)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <HelpCircle size={16} />
                ¿Cómo funcionan los puntos?
              </button>
            </motion.div>

            {showPointsInfo && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <KikiCard className="bg-muted/30">
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>• Completá <span className="font-medium text-foreground">10 sesiones/mes</span> para ganar una ⭐</p>
                    <p>• Las <span className="font-medium text-foreground">medallas</span> otorgan puntos extra</p>
                    <p>• Con <span className="font-medium text-foreground">≥85% adherencia + 100 pts</span> participás del sorteo anual 🎁</p>
                    <p>• Los puntos y medallas se renuevan cada año tras el sorteo</p>
                  </div>
                </KikiCard>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
