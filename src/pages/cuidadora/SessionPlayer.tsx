import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import kikiMascot from '@/assets/kiki-mascot.png';

const faces = ['😓', '😕', '😐', '🙂', '😄'];
const childMoods = ['😢', '😐', '🙂', '😄', '🤩'];

interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: string;
  target_area: string | null;
  thumbnail_color: string;
  description: string | null;
}

export default function SessionPlayer() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [childId, setChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentEx, setCurrentEx] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [childMood, setChildMood] = useState<number | null>(null);
  const [painReported, setPainReported] = useState(false);
  const [note, setNote] = useState('');
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  useEffect(() => {
    if (user) loadExercises();
  }, [user]);

  const loadExercises = async () => {
    if (!user) return;

    const { data: children } = await supabase
      .from('children')
      .select('id')
      .eq('caregiver_id', user.id)
      .limit(1);

    if (!children || children.length === 0) {
      setLoading(false);
      return;
    }

    const cid = children[0].id;
    setChildId(cid);

    const { data: plans } = await supabase
      .from('treatment_plans')
      .select('exercise_id')
      .eq('child_id', cid)
      .eq('active', true);

    if (plans && plans.length > 0) {
      const exerciseIds = plans.map(p => p.exercise_id);
      const { data: exData } = await supabase.from('exercises').select('*').in('id', exerciseIds);
      if (exData) {
        setExercises(exData.map(e => ({
          id: e.id,
          name: e.name,
          sets: e.sets || 3,
          reps: e.reps || '10 repeticiones',
          target_area: e.target_area,
          thumbnail_color: e.thumbnail_color || '#7EEDC4',
          description: e.description,
        })));
      }
    }

    setLoading(false);
  };

  const exercise = exercises[currentEx];
  const totalSets = exercise?.sets || 3;

  const handleNextSet = () => {
    if (currentSet + 1 < totalSets) {
      setCurrentSet(currentSet + 1);
    } else if (currentEx + 1 < exercises.length) {
      setCurrentEx(currentEx + 1);
      setCurrentSet(0);
    } else {
      setDone(true);
    }
  };

  const handlePrevExercise = () => {
    if (currentEx > 0) {
      setCurrentEx(currentEx - 1);
      setCurrentSet(0);
    }
  };

  const [showMedalPopup, setShowMedalPopup] = useState(false);
  const [earnedMedal, setEarnedMedal] = useState<{ icon: string; title: string } | null>(null);

  const handleSubmit = async () => {
    if (difficulty === null || !childId || !user) return;

    await supabase.from('sessions').insert({
      child_id: childId,
      caregiver_id: user.id,
      difficulty: difficulty + 1,
      child_mood: childMood !== null ? childMood + 1 : null,
      pain_reported: painReported,
      note: note || null,
    });

    // Check and award medals
    const { count: sessionCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('caregiver_id', user.id);

    const total = sessionCount || 0;
    const year = new Date().getFullYear();

    const medalChecks = [
      { type: 'first-session', threshold: 1, icon: '⭐', title: 'Primera sesión', points: 10 },
      { type: 'streak-3', threshold: 3, icon: '🔥', title: 'Racha de 3', points: 15 },
      { type: 'streak-7', threshold: 7, icon: '💪', title: 'Semana completa', points: 25 },
      { type: 'ten-sessions', threshold: 10, icon: '🏅', title: '10 sesiones', points: 30 },
      { type: 'twenty-sessions', threshold: 20, icon: '🏆', title: 'Campeón', points: 50 },
    ];

    const { data: existingMedals } = await supabase
      .from('medals')
      .select('medal_type')
      .eq('user_id', user.id);

    const existingTypes = new Set((existingMedals || []).map(m => m.medal_type));
    let newMedal: { icon: string; title: string } | null = null;

    for (const check of medalChecks) {
      if (total >= check.threshold && !existingTypes.has(check.type)) {
        await supabase.from('medals').insert({
          user_id: user.id,
          medal_type: check.type,
          title: check.title,
          description: `Completaste ${check.threshold} sesión(es)`,
          points_awarded: check.points,
          year,
        });
        newMedal = { icon: check.icon, title: check.title };
      }
    }

    // Update user_points
    const month = new Date().getMonth() + 1;
    const { data: existingPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (existingPoints) {
      await supabase.from('user_points').update({
        sessions_completed: (existingPoints.sessions_completed || 0) + 1,
        points: (existingPoints.points || 0) + 3,
      }).eq('id', existingPoints.id);
    } else {
      await supabase.from('user_points').insert({
        user_id: user.id, month, year, sessions_completed: 1, points: 3,
      });
    }

    if (newMedal) {
      setEarnedMedal(newMedal);
      setShowMedalPopup(true);
    } else {
      navigate('/cuidadora/home');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6">
        <p className="text-lg font-semibold mb-2">Sin ejercicios asignados</p>
        <p className="text-sm text-muted-foreground text-center mb-4">Tu kinesiólogo/a aún no te asignó ejercicios.</p>
        <button onClick={() => navigate('/cuidadora/home')} className="btn-primary text-sm px-6">Volver al inicio</button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative w-28 h-28 mb-4">
            <div className="absolute inset-0 rounded-full bg-mint flex items-center justify-center">
              <svg className="w-12 h-12 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <motion.img src={kikiMascot} alt="Kiki" className="absolute -right-4 -top-4 w-14 h-14 object-contain"
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1, rotate: [0, -10, 10, 0] }}
              transition={{ delay: 0.5, duration: 0.5 }} />
          </motion.div>

          <h2 className="text-xl font-bold mb-1">¡Sesión completada!</h2>
          <p className="text-sm text-muted-foreground mb-6">{exercises.length} ejercicios</p>

          <div className="w-full space-y-5 max-w-md">
            <div>
              <p className="text-sm font-medium text-center mb-2">¿Cómo fue la sesión?</p>
              <div className="flex justify-center gap-4">
                {faces.map((face, i) => (
                  <button key={i} onClick={() => setDifficulty(i)}
                    className={`text-3xl transition-transform ${difficulty === i ? 'scale-125' : 'opacity-50 hover:opacity-75'}`}>
                    {face}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-center mb-2">¿Cómo estuvo el ánimo?</p>
              <div className="flex justify-center gap-4">
                {childMoods.map((mood, i) => (
                  <button key={i} onClick={() => setChildMood(i)}
                    className={`text-3xl transition-transform ${childMood === i ? 'scale-125' : 'opacity-50 hover:opacity-75'}`}>
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
              <span className="text-sm">¿Reportó dolor?</span>
              <button onClick={() => setPainReported(!painReported)}
                className={`w-10 h-6 rounded-full relative transition-colors ${painReported ? 'bg-rust' : 'bg-muted'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${painReported ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <textarea value={note} onChange={e => setNote(e.target.value)} className="input-kiki h-16 resize-none"
              placeholder="¿Algo que quieras comentar? (opcional)" />

            <button onClick={handleSubmit} disabled={difficulty === null} className="btn-primary w-full disabled:opacity-40">
              Enviar registro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-base font-semibold">Sesión de hoy</h2>
        <button onClick={() => setShowConfirmExit(true)} className="text-sm text-muted-foreground">Salir</button>
      </div>

      <div className="flex gap-1 px-4 mb-4">
        {exercises.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < currentEx ? 'bg-mint' : i === currentEx ? 'bg-mint-300' : 'bg-muted'}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mb-4">Ejercicio {currentEx + 1} de {exercises.length}</p>

      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          <motion.div key={currentEx} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }} className="card-kiki overflow-hidden">
            <div className="h-40 rounded-t-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${exercise.thumbnail_color}40, ${exercise.thumbnail_color}20)` }}>
              <div className="w-16 h-16 rounded-full" style={{ backgroundColor: exercise.thumbnail_color + '60' }} />
            </div>
            <div className="p-4">
              {exercise.target_area && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-brand">{exercise.target_area}</span>
              )}
              <h3 className="text-lg font-semibold mt-2">{exercise.name}</h3>
              {exercise.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{exercise.description}</p>}
              <p className="text-xs text-muted-foreground mt-3 font-medium">Serie {currentSet + 1} de {totalSets} · {exercise.reps}</p>
              <div className="flex gap-2 mt-3 justify-center">
                {Array.from({ length: totalSets }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-all ${i <= currentSet ? 'bg-mint scale-110' : 'bg-muted'}`} />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={handlePrevExercise} disabled={currentEx === 0}
          className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-30">
          <ChevronLeft size={18} /> Anterior
        </button>
        <button onClick={() => setPlaying(!playing)}
          className="w-16 h-16 rounded-full bg-mint flex items-center justify-center active:scale-95 transition-transform">
          {playing ? <Pause size={28} className="text-navy" /> : <Play size={28} className="text-navy ml-1" />}
        </button>
        <button onClick={handleNextSet} className="flex items-center gap-1 text-sm font-medium text-mint-600">
          Siguiente <ChevronRight size={18} />
        </button>
      </div>

      {/* Medal celebration popup */}
      {showMedalPopup && earnedMedal && (
        <div className="fixed inset-0 bg-foreground/60 flex items-center justify-center z-50 px-6">
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="bg-card rounded-2xl p-8 w-full max-w-[320px] shadow-kiki-lg text-center">
            <motion.div className="text-6xl mb-4" animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, delay: 0.3 }}>
              {earnedMedal.icon}
            </motion.div>
            <h3 className="text-lg font-bold mb-1">¡Nueva medalla!</h3>
            <p className="text-base font-semibold text-mint-600 mb-2">{earnedMedal.title}</p>
            <p className="text-sm text-muted-foreground mb-6">¡Seguí así, lo estás haciendo genial!</p>
            <button onClick={() => navigate('/cuidadora/home')} className="btn-primary w-full text-sm">Continuar</button>
            <button onClick={() => navigate('/cuidadora/medals')} className="text-sm text-mint-500 font-medium mt-3 block mx-auto">Ver medallas</button>
          </motion.div>
        </div>
      )}

      {showConfirmExit && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50 px-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-xl p-6 w-full max-w-[320px] shadow-kiki-lg">
            <h3 className="font-semibold text-center mb-2">¿Salir de la sesión?</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">El progreso de hoy no se guardará.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmExit(false)} className="btn-secondary flex-1 text-sm">Continuar</button>
              <button onClick={() => navigate('/cuidadora/home')} className="flex-1 text-sm py-2.5 rounded-[10px] bg-rust/10 text-rust font-medium">Salir</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
