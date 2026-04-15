import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Heart, PlayCircle, ChevronRight, Clock, ChevronDown, ChevronUp } from 'lucide-react';
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
  target_area: string | null;
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

interface DayPlan {
  date: string;
  label: string;
  exercises: ChildExercise[];
  isToday: boolean;
}

export default function CuidadoraHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const firstName = profile?.name?.split(' ')[0] || 'Cuidador/a';
  const greeting = new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 18 ? '🌤' : '🌙';

  const [exercises, setExercises] = useState<ChildExercise[]>([]);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: children } = await supabase
      .from('children').select('id').eq('caregiver_id', user.id).limit(1);

    if (children && children.length > 0) {
      const childId = children[0].id;

      // Get treatment plans WITH day_of_week
      const { data: plans } = await supabase
        .from('treatment_plans')
        .select('exercise_id, day_of_week')
        .eq('child_id', childId)
        .eq('active', true);

      if (plans && plans.length > 0) {
        const exerciseIds = [...new Set(plans.map(p => p.exercise_id))];
        const { data: exData } = await supabase
          .from('exercises').select('*').in('id', exerciseIds);

        if (exData) {
          const planMap = new Map<string, number[] | null>();
          plans.forEach(p => planMap.set(p.exercise_id, p.day_of_week));

          const allExercises = exData.map(e => ({
            id: e.id,
            name: e.name,
            duration: e.duration || 5,
            sets: e.sets || 3,
            reps: e.reps || '10 repeticiones',
            target_area: e.target_area,
            thumbnail_color: e.thumbnail_color || '#7EEDC4',
            video_url: e.video_url,
            day_of_week: planMap.get(e.id) || null,
          }));

          setExercises(allExercises);

          // Build day plans for next 14 days
          const today = new Date();
          const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          const plans14: DayPlan[] = [];

          for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const jsDay = d.getDay(); // 0=Sun
            const dayExercises = allExercises.filter(ex => {
              if (!ex.day_of_week || ex.day_of_week.length === 0) return true; // assigned every day
              return ex.day_of_week.includes(jsDay === 0 ? 7 : jsDay); // 1=Mon..7=Sun
            });

            if (dayExercises.length > 0) {
              plans14.push({
                date: d.toISOString().split('T')[0],
                label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${dayNames[jsDay]} ${d.getDate()}`,
                exercises: dayExercises,
                isToday: i === 0,
              });
            }
          }
          setDayPlans(plans14);
        }
      }

      // Check if session completed today
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', childId)
        .eq('caregiver_id', user.id)
        .gte('completed_at', today + 'T00:00:00')
        .lte('completed_at', today + 'T23:59:59');
      setTodayCompleted((count || 0) > 0);

      // Get upcoming appointments
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: appts } = await supabase
        .from('appointments')
        .select('*')
        .eq('child_id', childId)
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

  const todayPlan = dayPlans.find(d => d.isToday);
  const futurePlans = dayPlans.filter(d => !d.isToday);
  const totalTime = todayPlan ? todayPlan.exercises.reduce((s, e) => s + e.duration, 0) : 0;

  const formatApptDate = (date: string) =>
    new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <AppShell>
      <motion.div className="px-4 pb-6" variants={stagger.container} initial="initial" animate="animate">
        <motion.div variants={stagger.item} className="pt-4 mb-4">
          <h1 className="text-xl font-bold">Hola, {firstName} {greeting}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !todayPlan ? (
          <motion.div variants={stagger.item}>
            <KikiCard className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-mint-50 flex items-center justify-center mx-auto mb-4">
                <Heart size={28} className="text-mint-500" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">¡Bienvenida a KikiCare!</h2>
              <p className="text-sm text-muted-foreground mb-4 px-4">
                Tu kinesiólogo/a te asignará un plan de ejercicios. Mientras tanto, completá el perfil de tu hijo/a.
              </p>
              <button onClick={() => navigate('/cuidadora/child')} className="btn-primary text-sm px-6">
                Ir a Mi Perfil
              </button>
            </KikiCard>
          </motion.div>
        ) : (
          <>
            {/* Today's plan */}
            <motion.div variants={stagger.item}>
              <KikiCard className={todayCompleted ? 'bg-mint-50 border border-mint-200' : ''}>
                {todayCompleted ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-mint flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-semibold text-foreground">Sesión completada</p>
                    <p className="text-xs text-muted-foreground mt-1">¡Buen trabajo hoy!</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base font-semibold mb-1">Plan de hoy</h2>
                    <p className="text-xs text-muted-foreground mb-3">{todayPlan.exercises.length} ejercicios · ~{totalTime} minutos</p>
                    <div className="space-y-2 mb-4">
                      {todayPlan.exercises.map(ex => (
                        <div key={ex.id} onClick={() => navigate(`/cuidadora/exercise/${ex.id}`)}
                          className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: ex.thumbnail_color + '30' }}>
                            {ex.video_url ? (
                              <PlayCircle size={18} style={{ color: ex.thumbnail_color }} />
                            ) : (
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ex.thumbnail_color }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ex.name}</p>
                            <p className="text-[10px] text-muted-foreground">{ex.sets} series · {ex.reps} · {ex.duration} min</p>
                          </div>
                          <ChevronRight size={16} className="text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                    <button onClick={() => navigate('/cuidadora/session')} className="btn-primary w-full text-sm">
                      Comenzar sesión →
                    </button>
                  </>
                )}
              </KikiCard>
            </motion.div>

            {/* Upcoming days */}
            {futurePlans.length > 0 && (
              <motion.div variants={stagger.item} className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Próximos días</h3>
                <div className="space-y-2">
                  {futurePlans.slice(0, 5).map(plan => (
                    <KikiCard key={plan.date} className="!p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{plan.label}</p>
                          <p className="text-[10px] text-muted-foreground">{plan.exercises.length} ejercicios</p>
                        </div>
                        <div className="flex gap-1">
                          {plan.exercises.slice(0, 3).map(ex => (
                            <div key={ex.id} className="w-6 h-6 rounded-md" style={{ backgroundColor: ex.thumbnail_color + '40' }} />
                          ))}
                          {plan.exercises.length > 3 && (
                            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-[9px] font-medium">
                              +{plan.exercises.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </KikiCard>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Next appointment */}
        <motion.div variants={stagger.item} className="mt-4">
          <KikiCard className="bg-blue-50 border border-blue-100">
            {nextAppointment ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar size={18} className="text-blue-brand" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Próxima consulta</p>
                    <p className="text-xs text-foreground font-medium">
                      {formatApptDate(nextAppointment.appointment_date)} · {nextAppointment.start_time.slice(0, 5)}
                    </p>
                    {nextAppointment.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{nextAppointment.description}</p>
                    )}
                  </div>
                </div>
                {upcomingAppointments.length > 0 && (
                  <>
                    <button onClick={() => setShowUpcoming(!showUpcoming)}
                      className="flex items-center gap-1 text-xs text-blue-brand font-medium mt-3 mx-auto">
                      Ver siguientes {showUpcoming ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showUpcoming && (
                      <div className="mt-2 space-y-2 border-t border-blue-100 pt-2">
                        {upcomingAppointments.map(appt => (
                          <div key={appt.id} className="flex items-center gap-2">
                            <Clock size={12} className="text-blue-brand shrink-0" />
                            <p className="text-xs">
                              {formatApptDate(appt.appointment_date)} · {appt.start_time.slice(0, 5)}
                              {appt.description && <span className="text-muted-foreground"> · {appt.description}</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-blue-brand" />
                <div>
                  <p className="text-sm font-medium">Próxima consulta</p>
                  <p className="text-xs text-muted-foreground">Aún sin consulta agendada</p>
                </div>
              </div>
            )}
          </KikiCard>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
