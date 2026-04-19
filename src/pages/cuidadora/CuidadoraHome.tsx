import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Heart, PlayCircle, ChevronRight, Clock, ChevronDown, ChevronUp, Hash, ArrowRight, MessageCircle, TrendingUp, Trophy, ListChecks, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } },
};

interface ChildExercise {
  id: string;
  name: string;
  duration: number;
  sets: number;
  reps: string;
  thumbnail_color: string;
  video_url: string | null;
  day_of_week: number[] | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  duration_minutes: number;
  description: string | null;
}

export default function CuidadoraHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuthContext();
  const firstName = (profile?.name || '').split(' ')[0] || 'Cuidador/a';
  const greetingEmoji = new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 18 ? '🌤' : '🌙';

  const [loading, setLoading] = useState(true);
  const [isLinked, setIsLinked] = useState<boolean | null>(null);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  
  // Update banner state
  const [hasUpdateBanner, setHasUpdateBanner] = useState(false);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [showTodayPlan, setShowTodayPlan] = useState(false);
  const [todayPlan, setTodayPlan] = useState<{ exercises: any[], totalTime: number } | null>(null);
  const [childId, setChildId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user, location.pathname]);

  const loadData = async () => {
    if (!user) return;

    // Get link status
    const { data: link } = await supabase
      .from('therapist_caregiver_links')
      .select('id, child_id')
      .eq('caregiver_id', user.id)
      .eq('status', 'active')
      .limit(1);

    const linked = !!link && link.length > 0;
    setIsLinked(linked);

    if (linked && link[0].child_id) {
      const cid = link[0].child_id;
      setChildId(cid);

      // 0. Load today's plan for the button/collapsible
      const { data: plans } = await supabase
        .from('treatment_plans')
        .select('exercise_id, day_of_week')
        .eq('child_id', cid)
        .eq('active', true);

      if (plans && plans.length > 0) {
        const jsDay = new Date().getDay();
        const todayExercises = plans.filter(p => !p.day_of_week || p.day_of_week.length === 0 || p.day_of_week.includes(jsDay));
        if (todayExercises.length > 0) {
          const { data: exData } = await supabase.from('exercises').select('*').in('id', todayExercises.map(p => p.exercise_id));
          if (exData) {
            setTodayPlan({
              exercises: exData,
              totalTime: exData.reduce((s, e) => s + (Number(e.duration) || 5), 0)
            });
          }
        }
      }

      // 1. Check if session completed today (excluding update sessions for initial check)
      const today = new Date().toISOString().split('T')[0];
      const { data: todaySessions } = await supabase
        .from('sessions')
        .select('completed_at, is_update')
        .eq('child_id', cid)
        .eq('caregiver_id', user.id)
        .gte('completed_at', today + 'T00:00:00')
        .lte('completed_at', today + 'T23:59:59')
        .order('completed_at', { ascending: false });

      const mainSessionDone = (todaySessions || []).some(s => s && !s.is_update);
      setTodayCompleted(mainSessionDone);

      // 2. Check for NEW exercises added after the main session
      if (mainSessionDone) {
        const lastMainSession = (todaySessions || []).find(s => s && !s.is_update);
        const lastSessionTime = lastMainSession?.completed_at;

        if (lastSessionTime) {
          const { data: newPlans } = await supabase
            .from('treatment_plans')
            .select('id')
            .eq('child_id', cid)
            .eq('active', true)
            .or(`created_at.gt.${lastSessionTime}`);
          
          if (newPlans && newPlans.length > 0) {
            setHasUpdateBanner(true);
          }
        }
      }

      // 3. Get upcoming appointments
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: appts } = await supabase
        .from('appointments')
        .select('*')
        .eq('child_id', cid)
        .gte('appointment_date', todayStr)
        .eq('status', 'scheduled')
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);

      if (appts && appts.length > 0) {
        setNextAppointment(appts[0]);
        setUpcomingAppointments(appts.slice(1));
      }
    }

    setLoading(false);
  };

  const formatApptDate = (date: string) =>
    new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <AppShell>
      <motion.div className="px-5 pb-10" variants={stagger.container} initial="initial" animate="animate">
        {/* Header */}
        <motion.div variants={stagger.item} className="pt-6 mb-6">
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            Hola, {firstName} <span className="text-2xl">{greetingEmoji}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Update Banner */}
            <AnimatePresence>
              {hasUpdateBanner && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -20 }} 
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  className="overflow-hidden"
                >
                  <KikiCard className="bg-amber-50 border-amber-200 !p-4 mb-2">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <AlertCircle size={20} className="text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-900 leading-tight">Plan actualizado</p>
                        <p className="text-xs text-amber-800 mt-0.5">
                          Tu kinesiólogo actualizó el plan de hoy. Hay un ejercicio nuevo para completar.
                        </p>
                        <button 
                          onClick={() => navigate('/cuidadora/session?update=true')}
                          className="mt-3 text-xs font-bold text-amber-700 underline underline-offset-2"
                        >
                          Completar ejercicio nuevo →
                        </button>
                      </div>
                    </div>
                  </KikiCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content: Plan or Welcome */}
            {!isLinked || !todayPlan ? (
              <motion.div variants={stagger.item}>
                <KikiCard className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-mint-50 flex items-center justify-center mx-auto mb-4">
                    <Heart size={28} className="text-mint-500" />
                  </div>
                  <h2 className="text-lg font-bold text-navy mb-2">¡Bienvenida a KikiCare!</h2>
                  <p className="text-sm text-muted-foreground mb-8 px-8 leading-relaxed">
                    Tu kinesiólogo/a te asignará un plan de ejercicios. Mientras tanto, completá el perfil de tu hijo/a.
                  </p>
                  <button onClick={() => navigate('/cuidadora/child')} className="btn-secondary w-full max-w-[240px] mx-auto py-3">
                    Ir a Mi Perfil
                  </button>
                </KikiCard>
              </motion.div>
            ) : (
              <motion.div variants={stagger.item}>
                <KikiCard className={`!p-5 ${todayCompleted ? 'bg-mint-50/30 border-mint-100' : ''}`}>
                  {todayCompleted ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center mx-auto mb-4">
                        <Trophy size={32} className="text-navy" />
                      </div>
                      <h2 className="text-xl font-bold text-navy">¡Sesión completada!</h2>
                      <p className="text-sm text-muted-foreground mt-2">¡Buen trabajo por hoy!</p>
                      <button onClick={() => setShowTodayPlan(!showTodayPlan)} className="text-xs text-mint-600 font-bold mt-4 underline">
                        {showTodayPlan ? 'Ocultar ejercicios' : 'Ver ejercicios realizados'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-lg font-bold text-navy">Plan de hoy</h2>
                          <p className="text-xs text-muted-foreground">{todayPlan.exercises.length} ejercicios · ~{todayPlan.totalTime} minutos</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-mint-50 flex items-center justify-center">
                          <PlayCircle size={22} className="text-mint-600" />
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        {todayPlan.exercises.map(ex => (
                          <div key={ex.id} onClick={() => navigate(`/cuidadora/exercise/${ex.id}`)}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border/50 cursor-pointer hover:border-mint-200 transition-colors">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (ex.thumbnail_color || '#7EEDC4') + '20' }}>
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ex.thumbnail_color || '#7EEDC4' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{ex.name}</p>
                              <p className="text-xs text-muted-foreground">{ex.sets} series · {ex.reps}</p>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground" />
                          </div>
                        ))}
                      </div>

                      <button onClick={() => navigate('/cuidadora/session')} className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base shadow-mint-lg">
                        Comenzar sesión <ArrowRight size={20} />
                      </button>
                    </>
                  )}
                  
                  {/* Collapsible exercises if completed */}
                  <AnimatePresence>
                    {todayCompleted && showTodayPlan && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-mint-100 space-y-2">
                        {todayPlan.exercises.map(ex => (
                          <div key={ex.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/50">
                            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: (ex.thumbnail_color || '#7EEDC4') + '20' }}>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ex.thumbnail_color || '#7EEDC4' }} />
                            </div>
                            <p className="text-xs font-medium truncate">{ex.name}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </KikiCard>
              </motion.div>
            )}

            {/* Next Appointment */}
            <motion.div variants={stagger.item}>
              <KikiCard className="bg-blue-50 border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Calendar size={20} className="text-blue-brand" />
                  </div>
                  <h3 className="text-sm font-bold text-navy uppercase tracking-wider">Próxima consulta</h3>
                </div>

                {nextAppointment ? (
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-base font-bold text-navy capitalize">
                        {formatApptDate(nextAppointment.appointment_date)}
                      </p>
                      <p className="text-sm text-blue-700 flex items-center gap-1.5 mt-0.5">
                        <Clock size={16} /> {nextAppointment.start_time.slice(0, 5)} hs
                      </p>
                    </div>
                    {upcomingAppointments.length > 0 && (
                      <button onClick={() => setShowUpcoming(!showUpcoming)} className="text-xs font-bold text-blue-600 bg-blue-100/50 px-2 py-1 rounded-lg">
                        {showUpcoming ? 'Ver menos' : `+${upcomingAppointments.length} más`}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aún sin consulta agendada</p>
                )}

                <AnimatePresence>
                  {showUpcoming && upcomingAppointments.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-blue-100 space-y-2">
                      {upcomingAppointments.map(appt => (
                        <div key={appt.id} className="flex items-center justify-between text-xs py-1">
                          <span className="text-blue-800 font-medium capitalize">{formatApptDate(appt.appointment_date)}</span>
                          <span className="font-bold text-blue-900">{appt.start_time.slice(0, 5)} hs</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </KikiCard>
            </motion.div>

            {/* Quick Access Grid (Mini) */}
            {!todayCompleted && (
              <motion.div variants={stagger.item} className="grid grid-cols-3 gap-3">
                <button onClick={() => navigate('/cuidadora/progress')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-card border border-border shadow-sm">
                  <TrendingUp size={18} className="text-blue-brand mb-1" />
                  <span className="text-[10px] font-bold">Progreso</span>
                </button>
                <button onClick={() => navigate('/cuidadora/messages')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-card border border-border shadow-sm">
                  <MessageCircle size={18} className="text-violet-500 mb-1" />
                  <span className="text-[10px] font-bold">Mensajes</span>
                </button>
                <button onClick={() => navigate('/cuidadora/medals')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-card border border-border shadow-sm">
                  <Trophy size={18} className="text-amber-500 mb-1" />
                  <span className="text-[10px] font-bold">Logros</span>
                </button>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
