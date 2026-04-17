import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Flame, ChevronRight, Trophy, HelpCircle, Calendar as CalendarIcon } from 'lucide-react';

interface SessionData { id: string; completed_at: string; }

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function ProgressScreen() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [childName, setChildName] = useState('');
  const [totalPoints, setTotalPoints] = useState(0);
  const [medalsCount, setMedalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPoints, setShowPoints] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    if (!user) return;
    const [childRes, sessRes, ptsRes, medRes] = await Promise.all([
      supabase.from('children').select('name').eq('caregiver_id', user.id).limit(1),
      supabase.from('sessions').select('id, completed_at').eq('caregiver_id', user.id).order('completed_at', { ascending: false }),
      supabase.from('user_points').select('points').eq('user_id', user.id),
      supabase.from('medals').select('medal_type', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    if (childRes.data?.[0]) setChildName(childRes.data[0].name);
    setSessions(sessRes.data || []);
    setTotalPoints((ptsRes.data || []).reduce((s, p) => s + (p.points || 0), 0));
    setMedalsCount(medRes.count || 0);
    setLoading(false);
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const today = now.getDate();

  const thisMonthSessions = useMemo(() =>
    sessions.filter(s => {
      const d = new Date(s.completed_at);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }), [sessions, currentYear, currentMonth]);

  const streak = useMemo(() => {
    const dates = [...new Set(sessions.map(s => new Date(s.completed_at).toISOString().split('T')[0]))].sort().reverse();
    if (dates.length === 0) return 0;
    let count = 0;
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    let key = cursor.toISOString().split('T')[0];
    if (!dates.includes(key)) { cursor.setDate(cursor.getDate() - 1); key = cursor.toISOString().split('T')[0]; }
    for (const d of dates) {
      if (d === key) { count++; cursor.setDate(cursor.getDate() - 1); key = cursor.toISOString().split('T')[0]; }
      else if (d < key) break;
    }
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeekSessions = sessions.filter(s => new Date(s.completed_at) >= weekStart).length;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const sessionDays = new Set(thisMonthSessions.map(s => new Date(s.completed_at).getDate()));

  // Adherencia para sorteo
  const expectedThisMonth = Math.max(1, Math.round((today / 7) * 5));
  const adherencePct = Math.min(100, Math.round((thisMonthSessions.length / expectedThisMonth) * 100));

  return (
    <AppShell>
      <div className="px-4 pb-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{MONTHS_ES[currentMonth]} {currentYear}</p>
              <h1 className="text-xl font-bold text-foreground mt-1">Progreso de {childName || 'tu niño'}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {thisMonthSessions.length} {thisMonthSessions.length === 1 ? 'sesión completada' : 'sesiones completadas'} este mes
              </p>
            </motion.div>

            {/* 3 stats — incluye racha como tarjeta interactiva */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-2">
              <KikiCard className="text-center !p-3">
                <p className="text-2xl font-bold text-foreground">{thisMonthSessions.length}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Este mes</p>
              </KikiCard>
              <button onClick={() => setShowPoints(false)} className="text-left">
                <KikiCard className="text-center !p-3 bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-2xl font-bold text-foreground">{streak}</p>
                    <Flame size={18} className={streak > 0 ? 'text-orange-500' : 'text-muted-foreground'} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Racha (días)</p>
                </KikiCard>
              </button>
              <KikiCard className="text-center !p-3">
                <p className="text-2xl font-bold text-foreground">{thisWeekSessions}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Esta semana</p>
              </KikiCard>
            </motion.div>

            {/* Calendario */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <KikiCard>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <CalendarIcon size={14} /> Calendario del mes
                  </h3>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {['D','L','M','X','J','V','S'].map(d => <div key={d} className="text-[10px] font-semibold text-muted-foreground">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
                    const cells: JSX.Element[] = [];
                    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} />);
                    for (let d = 1; d <= daysInMonth; d++) {
                      const completed = sessionDays.has(d);
                      const isToday = d === today;
                      const isPast = d < today;
                      cells.push(
                        <div key={d} className="aspect-square flex items-center justify-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium
                            ${completed ? 'bg-mint text-navy' :
                              isToday ? 'border-2 border-mint text-foreground' :
                              isPast ? 'bg-muted/40 text-muted-foreground' : 'text-muted-foreground'}`}>
                            {d}
                          </div>
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
                <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-mint" />Completada</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full border border-mint" />Hoy</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-muted/60" />Pendiente</span>
                </div>
              </KikiCard>
            </motion.div>

            {/* Medallas link */}
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              onClick={() => navigate('/cuidadora/medals')} className="w-full">
              <KikiCard className="bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Trophy size={22} className="text-amber-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">Medallas ({medalsCount})</p>
                    <p className="text-xs text-muted-foreground">Ver todas las medallas</p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </div>
              </KikiCard>
            </motion.button>

            {/* Puntos y sorteo */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <KikiCard>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-foreground">{totalPoints}</p>
                    <p className="text-xs text-muted-foreground">puntos acumulados en {currentYear}</p>
                  </div>
                  <div className="text-center px-3 py-2 rounded-xl bg-mint-50">
                    <p className="text-2xl">🎁</p>
                    <p className="text-[10px] font-medium text-mint-700">Sorteo dic.</p>
                  </div>
                </div>

                <button onClick={() => setShowPoints(!showPoints)}
                  className="flex items-center gap-1 text-xs text-mint-600 font-medium">
                  <HelpCircle size={12} /> ¿Cómo funcionan los puntos? <ChevronRight size={12} className={`transition-transform ${showPoints ? 'rotate-90' : ''}`} />
                </button>

                {showPoints && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs text-muted-foreground">
                    <div>
                      <p className="font-semibold text-foreground mb-1">Cómo ganar puntos:</p>
                      <ul className="space-y-0.5 ml-2">
                        <li>· Primera sesión: +10 pts</li>
                        <li>· Cada sesión completada: +5 pts</li>
                        <li>· Racha de 3 días: +15 pts</li>
                        <li>· Semana completa: +25 pts</li>
                        <li>· Medallas: +10 a +50 pts según medalla</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Sorteo anual (diciembre):</p>
                      <p>Para participar necesitás ≥85% de adherencia y al menos 100 puntos acumulados en el año. Los puntos y medallas se reinician cada enero.</p>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-2">🎁 Tu estado para el sorteo</p>
                  <div className="space-y-1.5">
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">Adherencia</span>
                        <span className="font-medium">{adherencePct}% / 85%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted">
                        <div className={`h-1.5 rounded-full ${adherencePct >= 85 ? 'bg-mint' : 'bg-amber-400'}`} style={{ width: `${Math.min(100, (adherencePct / 85) * 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">Puntos</span>
                        <span className="font-medium">{totalPoints} / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted">
                        <div className={`h-1.5 rounded-full ${totalPoints >= 100 ? 'bg-mint' : 'bg-amber-400'}`} style={{ width: `${Math.min(100, totalPoints)}%` }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {adherencePct >= 85 && totalPoints >= 100 ? '¡Estás dentro del sorteo!' : 'Alcanzá el 85% de adherencia y 100 pts para entrar al sorteo'}
                  </p>
                </div>
              </KikiCard>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
