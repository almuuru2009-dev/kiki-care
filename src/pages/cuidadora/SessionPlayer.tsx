import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import kikiMascot from '@/assets/kiki-mascot.png';
import { evaluateMedalsAfterSession, type MedalUnlock } from '@/lib/medals';

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
  duration: number;
}

type Stage = 'session' | 'survey' | 'completed' | 'medal';

export default function SessionPlayer() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [searchParams] = useSearchParams();
  const isUpdate = searchParams.get('update') === 'true';

  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [childId, setChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentEx, setCurrentEx] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [stage, setStage] = useState<Stage>('session');
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [childMood, setChildMood] = useState<number | null>(null);
  const [painReported, setPainReported] = useState(false);
  const [note, setNote] = useState('');
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  // Earned points/medals queue
  const [medalQueue, setMedalQueue] = useState<MedalUnlock[]>([]);
  const [medalIdx, setMedalIdx] = useState(0);

  useEffect(() => { if (user) loadExercises(); }, [user]);

  const loadExercises = async () => {
    if (!user) return;
    const { data: children } = await supabase.from('children').select('id').eq('caregiver_id', user.id).limit(1);
    if (!children || children.length === 0) { setLoading(false); return; }
    const cid = children[0].id;
    setChildId(cid);

    const { data: plans } = await supabase.from('treatment_plans').select('exercise_id, created_at, updated_at').eq('child_id', cid).eq('active', true);
    if (plans && plans.length > 0) {
      let exerciseIds = plans.map(p => p.exercise_id);

      if (isUpdate) {
        // Find latest non-update session today
        const today = new Date().toISOString().split('T')[0];
        const { data: lastSession } = await supabase
          .from('sessions')
          .select('completed_at')
          .eq('child_id', cid)
          .eq('caregiver_id', user.id)
          .eq('is_update', false)
          .gte('completed_at', today + 'T00:00:00')
          .order('completed_at', { descending: true })
          .limit(1)
          .maybeSingle();
        
        if (lastSession) {
          const cutOff = lastSession.completed_at;
          const newPlanIds = plans
            .filter(p => p.created_at > cutOff || (p.updated_at && p.updated_at > cutOff))
            .map(p => p.exercise_id);
          exerciseIds = newPlanIds;
        }
      }

      if (exerciseIds.length > 0) {
        const { data: exData } = await supabase.from('exercises').select('*').in('id', exerciseIds);
        if (exData) {
          setExercises(exData.map(e => ({
            id: e.id, name: e.name, sets: e.sets || 3, reps: e.reps || '10 repeticiones',
            target_area: e.target_area, thumbnail_color: e.thumbnail_color || '#7EEDC4',
            description: e.description, duration: e.duration || 5,
          })));
        }
      }
    }
    setLoading(false);
  };

  const exercise = exercises[currentEx];
  const totalSets = exercise?.sets || 3;

  const handleNextSet = () => {
    if (currentSet + 1 < totalSets) setCurrentSet(currentSet + 1);
    else if (currentEx + 1 < exercises.length) { setCurrentEx(currentEx + 1); setCurrentSet(0); }
    else setStage('survey');
  };

  const handlePrevExercise = () => {
    if (currentEx > 0) { setCurrentEx(currentEx - 1); setCurrentSet(0); }
  };

  const handleSubmit = async () => {
    if (difficulty === null || !childId || !user) return;

    await supabase.from('sessions').insert({
      child_id: childId, caregiver_id: user.id,
      difficulty: difficulty + 1,
      child_mood: childMood !== null ? childMood + 1 : null,
      pain_reported: painReported,
      note: note || (isUpdate ? 'Sesión completada con actualización' : null),
      is_update: isUpdate
    });

    if (isUpdate) {
      setMedalQueue([]);
      setStage('completed');
    } else {
      // Recompute everything from real data
      const result = await evaluateMedalsAfterSession(user.id);
      setMedalQueue(result.unlocked);
      setMedalIdx(0);
      setStage('completed');
    }
  };

  const continueAfterCompleted = () => {
    if (medalQueue.length > 0) setStage('medal');
    else navigate('/cuidadora/home');
  };

  const continueAfterMedal = () => {
    if (medalIdx + 1 < medalQueue.length) setMedalIdx(medalIdx + 1);
    else navigate('/cuidadora/home');
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

  // STAGE: completion celebration
  if (stage === 'completed') {
    const currentMedal = medalQueue[0];
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6">
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
        <h2 className="text-2xl font-bold mb-1">¡Sesión completada!</h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          {exercises.length} {exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
        </p>

        <div className="bg-mint-50 rounded-2xl px-6 py-4 mb-2 text-center w-full max-w-[280px]">
          <p className="text-3xl font-bold text-mint-700">+5 pts</p>
          <p className="text-xs text-mint-700 mt-1">Por completar la sesión</p>
        </div>
        {currentMedal && (
          <p className="text-xs text-amber-600 font-medium mb-4">
            ✨ ¡Y desbloqueaste {medalQueue.length} medalla{medalQueue.length > 1 ? 's' : ''}!
          </p>
        )}

        <button onClick={continueAfterCompleted} className="btn-primary w-full max-w-[280px] mt-4">
          Continuar
        </button>
      </div>
    );
  }

  // STAGE: medal popups
  if (stage === 'medal') {
    const medal = medalQueue[medalIdx];
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6">
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 12 }} className="text-7xl mb-4">
          {medal.icon}
        </motion.div>
        <p className="text-xs text-amber-600 font-medium mb-1">
          Medalla {medalIdx + 1} de {medalQueue.length}
        </p>
        <h2 className="text-2xl font-bold mb-1 text-center">¡Nueva medalla!</h2>
        <p className="text-base font-semibold text-mint-700 mb-2">{medal.title}</p>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-[280px]">{medal.description}</p>
        <div className="bg-amber-50 rounded-2xl px-6 py-3 mb-6">
          <p className="text-xl font-bold text-amber-700">+{medal.points} pts</p>
        </div>
        <button onClick={continueAfterMedal} className="btn-primary w-full max-w-[280px]">
          {medalIdx + 1 < medalQueue.length ? 'Siguiente medalla' : 'Continuar'}
        </button>
        <button onClick={() => navigate('/cuidadora/medals')} className="text-sm text-mint-600 font-medium mt-3">
          Ver todas las medallas
        </button>
      </div>
    );
  }

  // STAGE: post-session survey
  if (stage === 'survey') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
          <h2 className="text-xl font-bold mb-1">¡Sesión completada!</h2>
          <p className="text-sm text-muted-foreground mb-6">Contanos cómo fue</p>

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

  // STAGE: session in progress
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
              <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                <div className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-base font-bold">{exercise.sets}</p>
                  <p className="text-[9px] text-muted-foreground">Series</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-base font-bold">{exercise.reps}</p>
                  <p className="text-[9px] text-muted-foreground">Repeticiones</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2 text-center">
                  <p className="text-base font-bold">{exercise.duration} min</p>
                  <p className="text-[9px] text-muted-foreground">Duración</p>
                </div>
              </div>
              {exercise.description && <p className="text-xs text-muted-foreground leading-relaxed">{exercise.description}</p>}
              <p className="text-xs text-mint-600 mt-3 font-medium text-center">Serie {currentSet + 1} de {totalSets}</p>
              <div className="flex gap-2 mt-2 justify-center">
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
