import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Heart, PlayCircle } from 'lucide-react';
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
}

export default function CuidadoraHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const firstName = profile?.name?.split(' ')[0] || 'Cuidador/a';
  const greeting = new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 18 ? '🌤' : '🌙';

  const [exercises, setExercises] = useState<ChildExercise[]>([]);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Get child
    const { data: children } = await supabase
      .from('children')
      .select('id')
      .eq('caregiver_id', user.id)
      .limit(1);

    if (children && children.length > 0) {
      const childId = children[0].id;

      // Get treatment plans with exercises
      const { data: plans } = await supabase
        .from('treatment_plans')
        .select('exercise_id')
        .eq('child_id', childId)
        .eq('active', true);

      if (plans && plans.length > 0) {
        const exerciseIds = plans.map(p => p.exercise_id);
        const { data: exData } = await supabase
          .from('exercises')
          .select('*')
          .in('id', exerciseIds);

        if (exData) {
          setExercises(exData.map(e => ({
            id: e.id,
            name: e.name,
            duration: e.duration || 5,
            sets: e.sets || 3,
            reps: e.reps || '10 repeticiones',
            target_area: e.target_area,
            thumbnail_color: e.thumbnail_color || '#7EEDC4',
          })));
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
    }

    setLoading(false);
  };

  const hasExercises = exercises.length > 0;
  const totalTime = exercises.reduce((s, e) => s + e.duration, 0);

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
        ) : !hasExercises ? (
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
            {/* Plan de hoy */}
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
                    <p className="text-xs text-muted-foreground mb-3">{exercises.length} ejercicios · ~{totalTime} minutos</p>
                    <div className="space-y-2 mb-4">
                      {exercises.map(ex => (
                        <div key={ex.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: ex.thumbnail_color + '30' }}>
                            <PlayCircle size={18} style={{ color: ex.thumbnail_color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ex.name}</p>
                            <p className="text-[10px] text-muted-foreground">{ex.sets} series · {ex.reps} · {ex.duration} min</p>
                          </div>
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
          </>
        )}

        {/* Next appointment */}
        <motion.div variants={stagger.item} className="mt-4">
          <KikiCard className="bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-blue-brand" />
              <div>
                <p className="text-sm font-medium">Próxima consulta</p>
                <p className="text-xs text-muted-foreground">Aún sin consulta agendada</p>
              </div>
            </div>
          </KikiCard>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
