import { useState, useEffect, useRef } from 'react';
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
  simple_name: string | null;
  sets: number;
  reps: string;
  target_area: string | null;
  thumbnail_color: string;
  description: string | null;
  instructions: string | null;
  duration: number;
  video_url: string | null;
}

type Stage = 'session' | 'survey' | 'completed' | 'medal';

export default function SessionPlayer() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [searchParams] = useSearchParams();
  const isUpdate = searchParams.get('update') === 'true';
  const sessionStartRef = useRef(Date.now());

  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [childId, setChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentEx, setCurrentEx] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [stage, setStage] = useState<Stage>('session');
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [childMood, setChildMood] = useState<number | null>(null);
  const [painReported, setPainReported] = useState(false);
  const [note, setNote] = useState('');
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [medalQueue, setMedalQueue] = useState<MedalUnlock[]>([]);
  const [medalIdx, setMedalIdx] = useState(0);

  useEffect(() => { if (user) loadExercises(); }, [user]);

  const loadExercises = async () => {
    if (!user) return;
    try {
      // FIX: Use .limit(1) instead of .maybeSingle() to handle multiple active links
      const { data: links } = await supabase
        .from('therapist_caregiver_links')
        .select('child_id')
        .eq('caregiver_id', user.id)
        .eq('status', 'active')
        .limit(1);

      const link = links?.[0];
      if (!link?.child_id) {
        setLoading(false);
        return;
      }

      const cid = link.child_id;
      setChildId(cid);

      const { data: plans } = await supabase
        .from('treatment_plans')
        .select('exercise_id, day_of_week, created_at, updated_at')
        .eq('child_id', cid)
        .eq('active', true);

      if (!plans || plans.length === 0) {
        setExercises([]);
        setLoading(false);
        return;
      }

      const jsDay = new Date().getDay();
      let filteredPlanItems = plans;

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
          filteredPlanItems = plans.filter(p => p.created_at > cutOff || (p.updated_at && p.updated_at > cutOff));
        }
      } else {
        // Normal session: filter by today's day of week (same logic as CuidadoraHome)
        filteredPlanItems = plans.filter(p => !p.day_of_week || p.day_of_week.length === 0 || p.day_of_week.includes(jsDay));
      }

      const exerciseIds = filteredPlanItems.map(p => p.exercise_id);

      if (exerciseIds.length > 0) {
        const { data: exData } = await supabase.from('exercises').select('*').in('id', exerciseIds);
        if (exData) {
          setExercises(exData.map(e => ({
            id: e.id,
            name: e.name,
            simple_name: e.simple_name || null,
            sets: e.sets || 3,
            reps: e.reps || '10 repeticiones',
            target_area: e.target_area,
            thumbnail_color: e.thumbnail_color || '#7EEDC4',
            description: e.description,
            instructions: e.instructions || e.description,
            duration: e.duration || 5,
            video_url: e.video_url || null,
          })));
        }
      } else {
        setExercises([]);
      }
    } catch (err) {
      console.error('Error loading session:', err);
      toast.error('Error al cargar la sesión');
    } finally {
      setLoading(false);
    }
  };

  // --- Navigation logic (series-step based) ---
  const exercise = exercises[currentEx];
  const totalSets = exercise?.sets || 3;
  const isFirstStep = currentEx === 0 && currentSet === 0;
  const isLastStep = currentEx === exercises.length - 1 && currentSet === totalSets - 1;
  const displayName = exercise?.simple_name || exercise?.name || '';

  const handleNext = () => {
    if (isLastStep) {
      setStage('survey');
      return;
    }
    if (currentSet + 1 < totalSets) {
      setCurrentSet(currentSet + 1);
    } else {
      setCurrentEx(currentEx + 1);
      setCurrentSet(0);
    }
    setVideoPlaying(false);
  };

  const handlePrev = () => {
    if (isFirstStep) return;
    if (currentSet > 0) {
      setCurrentSet(currentSet - 1);
    } else {
      const prevSets = exercises[currentEx - 1]?.sets || 3;
      setCurrentEx(currentEx - 1);
      setCurrentSet(prevSets - 1);
    }
    setVideoPlaying(false);
  };

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (videoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setVideoPlaying(!videoPlaying);
  };

  const handleSubmit = async () => {
    if (difficulty === null || !childId || !user) return;
    setSubmitting(true);
    try {
      await supabase.from('sessions').insert({
        child_id: childId,
        caregiver_id: user.id,
        difficulty: difficulty + 1,
        child_mood: childMood !== null ? childMood + 1 : null,
        pain_reported: painReported,
        note: note || (isUpdate ? 'Sesión completada con actualización' : null),
        is_update: isUpdate,
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
    } catch (err) {
      console.error('Error saving session:', err);
      toast.error('Error al guardar. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
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

  // --- RENDERS ---

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
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <p className="text-lg font-bold text-navy mb-2">No pudimos cargar los ejercicios</p>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Volvé a intentarlo o contactá a tu kinesiólogo/a.
        </p>
        <button onClick={() => loadExercises().then(() => setLoading(true))} className="btn-secondary text-sm px-6 py-3 mb-3">
          Reintentar
        </button>
        <button onClick={() => navigate('/cuidadora/home')} className="btn-primary text-sm px-8 py-3">
          Volver al inicio
        </button>
      </div>
    );
  }

  // ---- COMPLETED ----
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
          {exercises.length} {exercises.length === 1 ? 'ejercicio completado' : 'ejercicios completados'}
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

  // ---- MEDAL ----
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

  // ---- SURVEY ----
  if (stage === 'survey') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
          <motion.img src={kikiMascot} alt="Kiki" className="w-20 h-20 object-contain mb-4"
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} />
          <h2 className="text-xl font-bold mb-1">¡Sesión completada!</h2>
          <p className="text-sm text-muted-foreground mb-2">
            {exercises.length} {exercises.length === 1 ? 'ejercicio completado' : 'ejercicios completados'}
          </p>
          <div className="w-16 h-px bg-border my-4" />

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
              placeholder="Algo que quieras comentar... (opcional)" />

            <button onClick={handleSubmit} disabled={difficulty === null || submitting}
              className="btn-primary w-full disabled:opacity-40 shadow-mint-lg py-4">
              {submitting ? 'Enviando...' : 'Enviar registro'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- SESSION (series-step navigation) ----
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-base font-semibold text-navy">Sesión de hoy</h2>
        <button onClick={() => setShowConfirmExit(true)} className="text-sm text-muted-foreground font-medium">Salir</button>
      </div>

      {/* Exercise-level progress dots */}
      <div className="flex gap-1.5 px-4 mb-1">
        {exercises.map((ex, i) => (
          <div key={i}
            className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
              i < currentEx ? 'bg-mint' : i === currentEx ? 'bg-mint-300' : 'bg-muted'
            }`} />
        ))}
      </div>

      {/* Exercise counter */}
      <div className="text-center py-2">
        <p className="text-xs text-muted-foreground">Ejercicio {currentEx + 1} de {exercises.length}</p>
      </div>

      {/* Exercise content */}
      <div className="flex-1 px-4 overflow-y-auto pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentEx}-${currentSet}`}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="card-kiki overflow-hidden"
          >
            {/* Video or gradient header */}
            {exercise.video_url ? (
              <div className="relative aspect-video bg-navy/90 rounded-t-xl overflow-hidden">
                <video
                  ref={videoRef}
                  src={exercise.video_url}
                  className="w-full h-full object-cover"
                  onEnded={() => setVideoPlaying(false)}
                  playsInline
                />
                <button
                  onClick={toggleVideo}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                >
                  {videoPlaying ? (
                    <Pause size={40} className="text-white drop-shadow-lg" />
                  ) : (
                    <Play size={40} className="text-white drop-shadow-lg ml-1" fill="white" />
                  )}
                </button>
              </div>
            ) : (
              <div className="h-28 rounded-t-xl flex items-center justify-center relative"
                style={{ background: `linear-gradient(135deg, ${exercise.thumbnail_color}40, ${exercise.thumbnail_color}20)` }}>
                <div className="w-12 h-12 rounded-full" style={{ backgroundColor: exercise.thumbnail_color + '60' }} />
              </div>
            )}

            <div className="p-4">
              {/* Area tag */}
              {exercise.target_area && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-brand">
                  {exercise.target_area}
                </span>
              )}

              {/* Exercise name */}
              <h3 className="text-lg font-bold mt-1 text-navy">{displayName}</h3>

              {/* Series info */}
              <p className="text-sm text-mint-600 font-semibold mt-1">
                Serie {currentSet + 1} de {totalSets} · {exercise.reps}
              </p>

              {/* Stats grid */}
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
                  <p className="text-sm font-bold">{exercise.duration} seg</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Por rep</p>
                </div>
              </div>

              {/* Instructions */}
              {exercise.instructions && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Instrucciones</p>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {exercise.instructions}
                  </p>
                </div>
              )}

              {/* Series progress dots */}
              <div className="mt-6 pt-4 border-t border-border/50 flex flex-col items-center">
                <p className="text-[10px] font-bold text-mint-600 uppercase tracking-widest mb-2">Progreso de series</p>
                <div className="flex gap-2.5">
                  {Array.from({ length: totalSets }).map((_, i) => (
                    <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                      i <= currentSet ? 'bg-mint shadow-[0_0_8px_rgba(126,237,196,0.6)]' : 'bg-muted'
                    }`} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="px-6 py-4 border-t border-border bg-background space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={handlePrev} disabled={isFirstStep}
            className="flex items-center gap-1 text-sm font-bold text-muted-foreground disabled:opacity-30">
            <ChevronLeft size={20} /> Anterior
          </button>

          {isLastStep ? (
            <button onClick={() => setStage('survey')}
              className="text-sm font-bold text-mint-700 bg-mint-50 px-4 py-2 rounded-full border border-mint-200">
              Finalizar sesión
            </button>
          ) : (
            <button onClick={handleNext}
              className="flex items-center gap-1 text-sm font-bold text-navy">
              Siguiente <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Exit confirmation */}
      {showConfirmExit && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50 px-6 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-[320px] shadow-2xl border border-border">
            <h3 className="font-bold text-center text-lg mb-2">¿Salir de la sesión?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">El progreso no se guardará.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmExit(false)} className="btn-secondary flex-1 text-sm font-bold">Continuar sesión</button>
              <button onClick={() => navigate('/cuidadora/home')} className="flex-1 text-sm py-2.5 rounded-xl bg-red-50 text-rust font-bold hover:bg-red-100 transition-colors">Salir</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
