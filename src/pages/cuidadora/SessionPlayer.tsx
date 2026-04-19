import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, CheckCircle2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import kikiMascot from '@/assets/kiki-mascot.png';
import { evaluateMedalsAfterSession, type MedalUnlock } from '@/lib/medals';
import { toast } from 'sonner';

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
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // Earned points/medals queue
  const [medalQueue, setMedalQueue] = useState<MedalUnlock[]>([]);
  const [medalIdx, setMedalIdx] = useState(0);

  useEffect(() => { if (user) loadExercises(); }, [user]);

  const loadExercises = async () => {
    // FIX APPLIED: Using therapist_caregiver_links to match Home screen data source
    if (!user) return;
    
    try {
      // 1. Get linked child ID from links (Source of truth for family-therapist connection)
      const { data: link } = await supabase
        .from('therapist_caregiver_links')
        .select('id, child_id')
        .eq('caregiver_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!link?.child_id) {
        console.log('No active link or child found for session');
        setLoading(false);
        return;
      }

      const cid = link.child_id;
      setChildId(cid);

      // 2. Get active treatment plans for that child
      const { data: plans } = await supabase
        .from('treatment_plans')
        .select('exercise_id, created_at, updated_at')
        .eq('child_id', cid)
        .eq('active', true);

      if (!plans || plans.length === 0) {
        setExercises([]);
        setLoading(false);
        return;
      }

      let exerciseIds = plans.map(p => p.exercise_id);

      // Handle "isUpdate" logic (new exercises after last session today)
      if (isUpdate) {
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
            id: e.id,
            name: e.simple_name || e.name,
            sets: e.sets || 3,
            reps: e.reps || '10 repeticiones',
            target_area: e.target_area,
            thumbnail_color: e.thumbnail_color || '#7EEDC4',
            description: e.instructions || e.description,
            duration: e.duration || 5,
          })));
        }
      } else {
        setExercises([]);
      }
    } catch (error) {
      console.error('Error loading session exercises:', error);
      toast.error('Error al cargar la sesión');
    } finally {
      setLoading(false);
    }
  };
  const exercise = exercises[currentEx];
  const totalSets = exercise?.sets || 3;
  const isCurrentExCompleted = exercise ? completedExercises.has(exercise.id) : false;
  const allCompleted = exercises.length > 0 && completedExercises.size === exercises.length;

  const handleMarkAsCompleted = () => {
    if (!exercise) return;
    setCompletedExercises(prev => new Set(prev).add(exercise.id));
    toast.success('¡Ejercicio completado! 💪');
    
    if (currentEx + 1 < exercises.length) {
      setTimeout(() => {
        setCurrentEx(currentEx + 1);
        setCurrentSet(0);
      }, 1000);
    }
  };

  const handleNextSet = () => {
    if (currentSet + 1 < totalSets) setCurrentSet(currentSet + 1);
    else if (currentEx + 1 < exercises.length) { 
      setCurrentEx(currentEx + 1); 
      setCurrentSet(0); 
    }
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

        <button onClick={continueAfterCompleted} className="btn-primary w-full max-w-[280px] mt-4 shadow-mint-lg">
          Continuar
        </button>
      </div>
    );
  }

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
        <button onClick={continueAfterMedal} className="btn-primary w-full max-w-[280px] shadow-gold-lg">
          {medalIdx + 1 < medalQueue.length ? 'Siguiente medalla' : 'Continuar'}
        </button>
        <button onClick={() => navigate('/cuidadora/medals')} className="text-sm text-mint-600 font-medium mt-3">
          Ver todas las medallas
        </button>
      </div>
    );
  }

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

            <button onClick={handleSubmit} disabled={difficulty === null} className="btn-primary w-full disabled:opacity-40 shadow-mint-lg">
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
        {exercises.map((ex, i) => (
          <div key={i} onClick={() => { setCurrentEx(i); setCurrentSet(0); }}
            className={`flex-1 h-1.5 rounded-full transition-colors cursor-pointer ${completedExercises.has(ex.id) ? 'bg-mint' : i === currentEx ? 'bg-mint-300' : 'bg-muted'}`} />
        ))}
      </div>
      <div className="flex justify-center items-center gap-2 mb-4">
        <p className="text-xs text-muted-foreground">Ejercicio {currentEx + 1} de {exercises.length}</p>
        {isCurrentExCompleted && (
          <span className="text-[10px] font-bold text-mint-700 bg-mint-50 px-2 py-0.5 rounded-full border border-mint-200 flex items-center gap-1">
            <CheckCircle2 size={10} /> Completado
          </span>
        )}
      </div>

      <div className="flex-1 px-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={currentEx} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }} className="card-kiki overflow-hidden">
            <div className="h-32 rounded-t-xl flex items-center justify-center relative"
              style={{ background: `linear-gradient(135deg, ${exercise.thumbnail_color}40, ${exercise.thumbnail_color}20)` }}>
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: exercise.thumbnail_color + '60' }} />
              {isCurrentExCompleted && (
                <div className="absolute inset-0 bg-mint/10 flex items-center justify-center backdrop-blur-[1px]">
                  <CheckCircle2 size={40} className="text-mint-600 opacity-50" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  {exercise.target_area && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-brand">{exercise.target_area}</span>
                  )}
                  <h3 className="text-lg font-bold mt-1 text-navy">{exercise.name}</h3>
                </div>
                {isCurrentExCompleted && <CheckCircle2 size={20} className="text-mint-600" />}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
                <div className="bg-muted/30 rounded-lg p-2 text-center border border-border/50">
                  <p className="text-sm font-bold">{exercise.sets}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Series</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2 text-center border border-border/50">
                  <p className="text-sm font-bold truncate px-1">{exercise.reps}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Reps</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2 text-center border border-border/50">
                  <p className="text-sm font-bold">{exercise.duration} min</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Total</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {exercise.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex flex-col items-center">
                <p className="text-[10px] font-bold text-mint-600 uppercase tracking-widest mb-2">Progreso de series</p>
                <div className="flex gap-2.5">
                  {Array.from({ length: totalSets }).map((_, i) => (
                    <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${i <= currentSet ? 'bg-mint shadow-[0_0_8px_rgba(126,237,196,0.6)]' : 'bg-muted'}`} />
                  ))}
                </div>
                <p className="text-[10px] font-medium text-muted-foreground mt-2">Serie {currentSet + 1} de {totalSets}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={handlePrevExercise} disabled={currentEx === 0}
            className="flex items-center gap-1 text-sm font-bold text-muted-foreground disabled:opacity-30">
            <ChevronLeft size={20} /> Anterior
          </button>
          
          {isCurrentExCompleted ? (
            <button 
              onClick={() => {
                if (currentEx + 1 < exercises.length) {
                  setCurrentEx(currentEx + 1);
                  setCurrentSet(0);
                }
              }}
              className="text-sm font-bold text-mint-700 bg-mint-50 px-4 py-2 rounded-full border border-mint-200"
            >
              {currentEx + 1 < exercises.length ? 'Siguiente ejercicio' : 'Revisar sesión'}
            </button>
          ) : (
            <button 
              onClick={handleNextSet}
              className="text-sm font-bold text-navy"
            >
              {currentSet + 1 < totalSets ? 'Siguiente serie' : 'Última serie'}
            </button>
          )}
          
          <button 
            onClick={() => {
              if (currentEx + 1 < exercises.length) {
                setCurrentEx(currentEx + 1);
                setCurrentSet(0);
              }
            }} 
            disabled={currentEx + 1 >= exercises.length}
            className="flex items-center gap-1 text-sm font-bold text-muted-foreground disabled:opacity-30"
          >
            Siguiente <ChevronRight size={20} />
          </button>
        </div>

        {!isCurrentExCompleted ? (
          <button 
            onClick={handleMarkAsCompleted}
            className="btn-primary w-full py-4 text-base shadow-mint-lg flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} /> Marcar como completado
          </button>
        ) : allCompleted ? (
          <button 
            onClick={() => setStage('survey')}
            className="w-full py-4 text-base bg-navy text-white rounded-xl font-bold shadow-lg animate-pulse"
          >
            Finalizar sesión de hoy
          </button>
        ) : (
          <p className="text-center text-xs font-medium text-muted-foreground py-2 italic">
            Completá todos los ejercicios para finalizar la sesión
          </p>
        )}
      </div>

      {showConfirmExit && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50 px-6 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-[320px] shadow-2xl border border-border">
            <h3 className="font-bold text-center text-lg mb-2">¿Salir de la sesión?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">El progreso de hoy no se guardará en tu historial.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmExit(false)} className="btn-secondary flex-1 text-sm font-bold">Continuar</button>
              <button onClick={() => navigate('/cuidadora/home')} className="flex-1 text-sm py-2.5 rounded-xl bg-red-50 text-rust font-bold hover:bg-red-100 transition-colors">Salir</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
