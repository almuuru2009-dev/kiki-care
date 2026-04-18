import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  }, [user]);

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
        const todayExercises = plans.filter(p => !p.day_of_week || p.day_of_week.length === 0 || p.day_of_week.includes(jsDay === 0 ? 7 : jsDay));
        if (todayExercises.length > 0) {
          const { data: exData } = await supabase.from('exercises').select('*').in('id', todayExercises.map(p => p.exercise_id));
          if (exData) {
            setTodayPlan({
              exercises: exData,
              totalTime: exData.reduce((s, e) => s + (e.duration || 5), 0)
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
        .order('completed_at', { descending: true });

      const mainSessionDone = (todaySessions || []).some(s => !s.is_update);
      setTodayCompleted(mainSessionDone);

      // 2. Check for NEW exercises added after the main session
      if (mainSessionDone) {
        const lastMainSession = todaySessions?.find(s => !s.is_update);
        const lastSessionTime = lastMainSession?.completed_at;

        if (lastSessionTime) {
          const { data: newPlans } = await supabase
            .from('treatment_plans')
            .select('id')
            .eq('child_id', cid)
            .eq('active', true)
            .or(`created_at.gt.${lastSessionTime},updated_at.gt.${lastSessionTime}`);
          
          // Check if these new exercises were already completed in an "update session"
          const updateSessionsDone = (todaySessions || []).filter(s => s.is_update);
          // For simplicity, if there are new plans and no update session happened AFTER them, show banner
          if (newPlans && newPlans.length > 0) {
            // Check if any update session happened after the latest new plan
            // (Assuming we only show banner if there's pending update)
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
        {/* Simplified Header */}
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
        ) : !isLinked ? (
          <motion.div variants={stagger.item}>
            <KikiCard className="text-center py-12 border-dashed border-2 border-mint/30 bg-mint-50/10">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Hash size={28} className="text-blue-brand" />
              </div>
              <h2 className="text-lg font-bold text-navy mb-2">Vincular Kinesiólogo</h2>
              <p className="text-sm text-muted-foreground mb-8 px-6 leading-relaxed">
                Ingresá el código proporcionado por tu profesional para comenzar con el plan de rehabilitación.
              </p>
              <button onClick={() => navigate('/join')} className="btn-primary w-full max-w-[240px] flex items-center justify-center gap-2 mx-auto py-4 shadow-mint-lg">
                Ingresar código <ArrowRight size={18} />
              </button>
            </KikiCard>
          </motion.div>
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

            {/* Next Appointment - MAIN FOCUS */}
            <motion.div variants={stagger.item}>
              <KikiCard className="bg-blue-600 text-white shadow-blue-lg border-none overflow-hidden relative">
                {/* Decorative circles */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Calendar size={20} className="text-white" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-wider text-blue-100">Próxima sesión</p>
                  </div>

                  {nextAppointment ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-2xl font-bold capitalize">
                          {formatApptDate(nextAppointment.appointment_date)}
                        </p>
                        <p className="text-lg text-blue-100 flex items-center gap-1.5 mt-0.5 font-medium">
                          <Clock size={18} /> {nextAppointment.start_time.slice(0, 5)} hs
                        </p>
                      </div>

                      {nextAppointment.description && (
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/5">
                          <p className="text-xs text-blue-50 italic">"{nextAppointment.description}"</p>
                        </div>
                      )}

                      <button 
                        onClick={() => setShowUpcoming(!showUpcoming)}
                        className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold text-sm shadow-sm transition-transform active:scale-95"
                      >
                        {showUpcoming ? 'Ocultar agenda' : 'Ver próximas sesiones'}
                      </button>

                      <AnimatePresence>
                        {showUpcoming && upcomingAppointments.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 pt-4 border-t border-white/20"
                          >
                            {upcomingAppointments.map(appt => (
                              <div key={appt.id} className="flex items-center justify-between text-xs py-1">
                                <span className="text-blue-50 capitalize">{formatApptDate(appt.appointment_date)}</span>
                                <span className="font-bold">{appt.start_time.slice(0, 5)} hs</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="py-2">
                      <p className="text-lg font-bold">Sin consultas agendadas</p>
                      <p className="text-sm text-blue-100 mt-1">Tu profesional aún no definió la próxima fecha.</p>
                    </div>
                  )}
                </div>
              </KikiCard>
            </motion.div>

            {/* Navigation Grid */}
            <motion.div variants={stagger.item} className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowTodayPlan(!showTodayPlan)}
                className={`group p-5 rounded-2xl bg-card border shadow-kiki transition-all text-left relative overflow-hidden ${showTodayPlan ? 'border-mint' : 'border-border hover:border-mint'}`}
              >
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-mint/5 rounded-full group-hover:scale-150 transition-transform" />
                <div className="w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center mb-4">
                  <PlayCircle size={22} className="text-mint-600" />
                </div>
                <p className="text-sm font-bold text-navy">Plan de hoy</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {todayCompleted ? '¡Sesión completada!' : `${todayPlan?.exercises.length || 0} ejercicios`}
                </p>
              </button>

              <button 
                onClick={() => navigate('/cuidadora/progress')}
                className="group p-5 rounded-2xl bg-card border border-border shadow-kiki hover:border-blue-brand transition-all text-left relative overflow-hidden"
              >
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-50 rounded-full group-hover:scale-150 transition-transform" />
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <TrendingUp size={22} className="text-blue-brand" />
                </div>
                <p className="text-sm font-bold text-navy">Progreso</p>
                <p className="text-[10px] text-muted-foreground mt-1">Evolución y rachas</p>
              </button>

              <button 
                onClick={() => navigate('/cuidadora/messages')}
                className="group p-5 rounded-2xl bg-card border border-border shadow-kiki hover:border-violet-500 transition-all text-left relative overflow-hidden"
              >
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-violet-50 rounded-full group-hover:scale-150 transition-transform" />
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
                  <MessageCircle size={22} className="text-violet-500" />
                </div>
                <p className="text-sm font-bold text-navy">Mensajes</p>
                <p className="text-[10px] text-muted-foreground mt-1">Consultar al profesional</p>
              </button>

              <button 
                onClick={() => navigate('/cuidadora/medals')}
                className="group p-5 rounded-2xl bg-card border border-border shadow-kiki hover:border-amber-500 transition-all text-left relative overflow-hidden"
              >
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-amber-50 rounded-full group-hover:scale-150 transition-transform" />
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                  <Trophy size={22} className="text-amber-500" />
                </div>
                <p className="text-sm font-bold text-navy">Medallas</p>
                <p className="text-[10px] text-muted-foreground mt-1">Logros desbloqueados</p>
              </button>
            </motion.div>

            {/* Today's Plan Collapsible Content */}
            <AnimatePresence>
              {showTodayPlan && todayPlan && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <KikiCard className="!p-4 border-mint-100 bg-mint-50/5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                        <ListChecks size={18} className="text-mint-600" /> Detalle del plan
                      </h3>
                      <span className="text-[10px] font-bold text-mint-700 bg-mint-100 px-2 py-0.5 rounded-full uppercase">
                        ~{todayPlan.totalTime} min
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {todayPlan.exercises.map(ex => (
                        <div key={ex.id} onClick={() => navigate(`/cuidadora/exercise/${ex.id}`)}
                          className="flex items-center gap-3 p-2 rounded-xl bg-white/80 border border-mint-50 cursor-pointer hover:bg-white transition-colors">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (ex.thumbnail_color || '#7EEDC4') + '20' }}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ex.thumbnail_color || '#7EEDC4' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{ex.name}</p>
                            <p className="text-[9px] text-muted-foreground">{ex.sets} series · {ex.reps}</p>
                          </div>
                          <ChevronRight size={14} className="text-muted-foreground" />
                        </div>
                      ))}
                    </div>

                    {!todayCompleted && (
                      <button 
                        onClick={() => navigate('/cuidadora/session')}
                        className="btn-primary w-full py-3 text-sm shadow-mint-sm"
                      >
                        Comenzar sesión completa →
                      </button>
                    )}
                  </KikiCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
