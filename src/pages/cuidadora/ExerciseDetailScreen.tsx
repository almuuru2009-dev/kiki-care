import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Repeat, ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle2, Video } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseDetail {
  id: string;
  name: string;
  clinical_name?: string;
  simple_name?: string;
  description: string | null;
  instructions?: string | null;
  target_area: string | null;
  area?: string | null;
  category?: string | null;
  gmfcs?: string | null;
  age_range?: string | null;
  evidence?: string | null;
  duration: number | null;
  sets: number | null;
  reps: string | null;
  video_url: string | null;
  thumbnail_color: string | null;
  difficulty_level?: string; // New or parsed
}

export default function ExerciseDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (id) loadExercise();
  }, [id]);

  const loadExercise = async () => {
    setLoading(true);
    try {
      // Try fetching from exercises first (private/assigned)
      let { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();
      
      if (error || !data) {
        // Try community_exercises
        const { data: commData, error: commError } = await supabase.from('community_exercises').select('*').eq('id', id).single();
        if (commData) {
          data = {
            ...commData,
            name: commData.simple_name || commData.clinical_name,
            target_area: commData.area,
          };
        }
      }

      if (data) setExercise(data);
    } catch (err) {
      console.error('Error loading exercise:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6">
        <p className="text-lg font-semibold mb-2">Ejercicio no encontrado</p>
        <button onClick={() => navigate(-1)} className="btn-primary text-sm px-6">Volver</button>
      </div>
    );
  }

  const color = exercise.thumbnail_color || '#7EEDC4';
  const name = exercise.name || exercise.clinical_name || 'Ejercicio';
  const clinicalName = exercise.clinical_name || exercise.name;
  const caregiverName = exercise.simple_name || exercise.name;
  const area = exercise.target_area || exercise.area || 'General';
  const objective = exercise.category || 'Rehabilitación';
  const instructions = exercise.instructions || exercise.description || 'Seguir las indicaciones del profesional.';

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-[420px] mx-auto pb-10">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-foreground truncate">{name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pt-2">
        {/* Essential Info Card */}
        <KikiCard className="!p-5 border-mint/20 bg-mint-50/10">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-mint-600 uppercase tracking-wider">{area}</span>
                <h2 className="text-xl font-bold text-navy leading-tight">{name}</h2>
              </div>
              <div className="bg-mint text-navy text-[10px] font-bold px-2 py-1 rounded-full">
                {objective}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-card p-2.5 rounded-xl border border-border">
                <Repeat size={16} className="text-mint-600" />
                <div>
                  <p className="text-xs font-bold">{exercise.sets || 3} × {exercise.reps || '10'}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Series / Reps</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-card p-2.5 rounded-xl border border-border">
                <Clock size={16} className="text-mint-600" />
                <div>
                  <p className="text-xs font-bold">{exercise.duration || 5} min</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Duración</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Info size={10} /> Instrucciones para el cuidador
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {instructions}
              </p>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Dificultad:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-3 h-1.5 rounded-full ${i <= (Number(exercise.gmfcs?.[0]) || 2) ? 'bg-mint' : 'bg-muted'}`} />
                ))}
              </div>
            </div>
          </div>
        </KikiCard>

        {/* Ampliar Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-mint-600 bg-mint-50/50 rounded-xl border border-mint-100 transition-all hover:bg-mint-50"
        >
          {isExpanded ? (
            <><ChevronUp size={18} /> Contraer información</>
          ) : (
            <><ChevronDown size={18} /> Ampliar información completa</>
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-4"
            >
              {/* Clinical Classification */}
              <KikiCard className="!p-5 space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Clasificación Clínica</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Nombre Clínico</p>
                    <p className="text-sm font-medium">{clinicalName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Nombre Cuidador</p>
                    <p className="text-sm font-medium">{caregiverName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Nivel GMFCS</p>
                    <p className="text-sm font-medium">{exercise.gmfcs || 'I–V'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Rango Etario</p>
                    <p className="text-sm font-medium">{exercise.age_range || 'Todas las edades'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Nivel de Evidencia</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-brand font-bold border border-blue-100">
                    {exercise.evidence || 'Práctica común'}
                  </span>
                </div>
              </KikiCard>

              {/* Clinical Context */}
              <KikiCard className="!p-5 space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Contexto y Seguridad</h3>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-mint-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} className="text-mint-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Señales de que va bien</p>
                      <p className="text-xs text-foreground leading-relaxed">Movimiento fluido, sin compensaciones excesivas, niño tranquilo y colaborativo.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} className="text-rust" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Cuándo parar o ajustar</p>
                      <p className="text-xs text-foreground leading-relaxed">Presencia de dolor, espasticidad severa repentina, fatiga extrema o llanto persistente.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Contraindicaciones</p>
                  <p className="text-xs text-foreground">Fracturas recientes, procesos inflamatorios agudos o dolor no controlado.</p>
                </div>
              </KikiCard>

              {/* Video Reference */}
              {exercise.video_url && (
                <KikiCard className="!p-0 overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                      <Video size={14} /> Video de Referencia
                    </h3>
                  </div>
                  <div className="aspect-video bg-black">
                    {showVideo ? (
                      <video src={exercise.video_url} controls autoPlay className="w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center relative bg-muted/20">
                        <button 
                          onClick={() => setShowVideo(true)}
                          className="w-16 h-16 rounded-full bg-mint shadow-lg flex items-center justify-center text-navy transition-transform hover:scale-110"
                        >
                          <Play size={28} fill="currentColor" className="ml-1" />
                        </button>
                      </div>
                    )}
                  </div>
                </KikiCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
