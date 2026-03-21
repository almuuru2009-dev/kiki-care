import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/stores/useAppStore';
import kikiMascot from '@/assets/kiki-mascot.png';

const faces = ['😓', '😕', '😐', '🙂', '😄'];
const childMoods = ['😢', '😐', '🙂', '😄', '🤩'];

export default function SessionPlayer() {
  const navigate = useNavigate();
  const { exercises, completeTodaySession, addMoodEntry } = useAppStore();
  const todayExercises = exercises.slice(0, 3);

  const [currentEx, setCurrentEx] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [childMood, setChildMood] = useState<number | null>(null);
  const [painReported, setPainReported] = useState(false);
  const [note, setNote] = useState('');
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  const exercise = todayExercises[currentEx];
  const totalSets = exercise?.sets || 3;

  const handleNextSet = () => {
    if (currentSet + 1 < totalSets) {
      setCurrentSet(currentSet + 1);
    } else if (currentEx + 1 < todayExercises.length) {
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

  const handleSubmit = () => {
    if (difficulty !== null) {
      completeTodaySession(difficulty + 1, note, childMood !== null ? childMood + 1 : 3, painReported);
      if (childMood !== null) {
        addMoodEntry({
          patientId: 'pat-1',
          date: new Date().toISOString().split('T')[0],
          childMood: childMood + 1,
          caregiverEnergy: difficulty + 1 > 3 ? 4 : difficulty + 1 > 1 ? 3 : 2,
          painLevel: painReported ? 2 : 0,
          cooperationLevel: childMood + 1,
        });
      }
      navigate('/cuidadora/home');
    }
  };

  if (done) {
    return (
      <div className="mobile-frame flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Success animation with Kiki */}
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative w-28 h-28 mb-4"
          >
            <div className="absolute inset-0 rounded-full bg-mint flex items-center justify-center">
              <motion.svg className="w-12 h-12 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </motion.svg>
            </div>
            <motion.img
              src={kikiMascot}
              alt="Kiki celebra"
              className="absolute -right-4 -top-4 w-14 h-14 object-contain"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: [0, -10, 10, 0] }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-xl font-bold mb-1">¡Sesión completada!</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-sm text-muted-foreground mb-6">3 ejercicios · ~22 minutos</motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full space-y-5">
            {/* Difficulty */}
            <div>
              <p className="text-sm font-medium text-center mb-2">¿Cómo fue la sesión?</p>
              <div className="flex justify-center gap-4">
                {faces.map((face, i) => (
                  <button key={i} onClick={() => setDifficulty(i)}
                    className={`text-3xl transition-transform ${difficulty === i ? 'scale-125' : 'opacity-50 hover:opacity-75'}`}
                    aria-label={`Dificultad ${i + 1}`}>
                    {face}
                  </button>
                ))}
              </div>
            </div>

            {/* Child mood - NEW */}
            <div>
              <p className="text-sm font-medium text-center mb-2">¿Cómo estuvo el ánimo de Valentín?</p>
              <div className="flex justify-center gap-4">
                {childMoods.map((mood, i) => (
                  <button key={i} onClick={() => setChildMood(i)}
                    className={`text-3xl transition-transform ${childMood === i ? 'scale-125' : 'opacity-50 hover:opacity-75'}`}
                    aria-label={`Ánimo ${i + 1}`}>
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Pain report - NEW */}
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
              <span className="text-sm">¿Reportó dolor durante la sesión?</span>
              <button
                onClick={() => setPainReported(!painReported)}
                className={`w-10 h-6 rounded-full relative transition-colors ${painReported ? 'bg-rust' : 'bg-muted'}`}
                aria-label="Toggle pain report"
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${painReported ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              className="input-kiki h-16 resize-none"
              placeholder="¿Algo que quieras contarle a Valeria? (opcional)"
            />

            <button onClick={handleSubmit} disabled={difficulty === null}
              className="btn-primary w-full disabled:opacity-40">
              Enviar registro
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-base font-semibold">Sesión de hoy</h2>
        <button onClick={() => setShowConfirmExit(true)} className="text-sm text-muted-foreground">Salir</button>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-4 mb-4">
        {todayExercises.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < currentEx ? 'bg-mint' : i === currentEx ? 'bg-mint-300' : 'bg-muted'}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mb-4">Ejercicio {currentEx + 1} de {todayExercises.length}</p>

      {/* Exercise card */}
      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          <motion.div key={currentEx}
            initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="card-kiki overflow-hidden"
          >
            <div className="h-40 rounded-t-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${exercise.thumbnailColor}40, ${exercise.thumbnailColor}20)` }}>
              <div className="w-16 h-16 rounded-full" style={{ backgroundColor: exercise.thumbnailColor + '60' }} />
            </div>

            <div className="p-4">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-brand">{exercise.targetArea}</span>
              <h3 className="text-lg font-semibold mt-2">{exercise.name}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{exercise.videoDescription}</p>
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

      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={handlePrevExercise} disabled={currentEx === 0}
          className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-30">
          <ChevronLeft size={18} /> Anterior
        </button>
        <button onClick={() => setPlaying(!playing)}
          className="w-16 h-16 rounded-full bg-mint flex items-center justify-center active:scale-95 transition-transform animate-pulse-glow">
          {playing ? <Pause size={28} className="text-navy" /> : <Play size={28} className="text-navy ml-1" />}
        </button>
        <button onClick={handleNextSet} className="flex items-center gap-1 text-sm font-medium text-mint-600">
          Siguiente <ChevronRight size={18} />
        </button>
      </div>

      {/* Confirm exit dialog */}
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
