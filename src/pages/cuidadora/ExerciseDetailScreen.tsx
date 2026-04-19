import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Play, Clock, Repeat, ChevronDown, ChevronUp, 
  Info, AlertTriangle, CheckCircle2, Video, Heart, ShieldAlert,
  Target, GraduationCap, Layers, Sparkles
} from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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
  difficulty?: string;
  good_signs?: string | null;
  stop_signs?: string | null;
  indications?: string | null;
  contraindications?: string | null;
  caregiver_precautions?: string | null;
  variants?: string | null;
  clinical_objective?: string | null;
}

export default function ExerciseDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (id) loadExercise();
  }, [id]);

  useEffect(() => {
    if (user && id) checkSavedStatus();
  }, [user, id]);

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
            name: commData.clinical_name,
            simple_name: commData.simple_name,
            target_area: commData.area,
            good_signs: commData.good_signs || null, // Assuming these columns might exist in comm too or default to null
            stop_signs: commData.stop_signs || null,
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

  const checkSavedStatus = async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from('saved_exercises')
      .select('id')
      .eq('user_id', user.id)
      .eq('exercise_id', id)
      .maybeSingle();
    setIsSaved(!!data);
  };

  const toggleSave = async () => {
    if (!user || !id) return;
    if (isSaved) {
      await supabase.from('saved_exercises').delete().eq('user_id', user.id).eq('exercise_id', id);
      setIsSaved(false);
      toast.info('Quitado de tus favoritos');
    } else {
      await supabase.from('saved_exercises').insert({ user_id: user.id, exercise_id: id });
      setIsSaved(true);
      toast.success('¡Agregado a tus favoritos! ❤️');
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

  const name = exercise.name || exercise.clinical_name || 'Ejercicio';
  const clinicalName = exercise.clinical_name || exercise.name;
  const caregiverName = exercise.simple_name || exercise.name;
  const area = exercise.target_area || exercise.area || 'General';
  const objective = exercise.category || exercise.clinical_objective || 'Rehabilitación';
  const instructions = exercise.instructions || exercise.description || 'Seguir las indicaciones del profesional.';

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-[420px] mx-auto pb-10">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0" aria-label="Volver">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-foreground truncate">{caregiverName}</h1>
        </div>
        <button 
          onClick={toggleSave}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isSaved ? 'bg-red-50 text-red-500' : 'bg-muted text-muted-foreground'}`}
        >
          <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pt-2">
        {/* Essential Info Card */}
        <KikiCard className="!p-5 border-mint/20 bg-mint-50/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-mint/5 -mr-12 -mt-12 rounded-full blur-2xl" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-mint-600 uppercase tracking-wider">{area}</span>
                <h2 className="text-xl font-bold text-navy leading-tight">{caregiverName}</h2>
              </div>
              <div className="bg-mint/20 text-mint-700 text-[10px] font-bold px-2 py-1 rounded-full border border-mint/20">
                {objective.split(',')[0]}
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
                  <p className="text-[9px] text-muted-foreground uppercase">Duración total</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <GraduationCap size={12} className="text-mint-600" /> Instrucciones para el cuidador
              </p>
              <div className="bg-white/60 p-3 rounded-xl border border-border/50">
                <p className="text-sm text-foreground leading-relaxed">
                  {instructions}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Dificultad sugerida:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3].map(i => {
                  const diff = exercise.difficulty?.toLowerCase();
                  const level = diff === 'intensivo' ? 3 : diff === 'moderado' ? 2 : 1;
                  return (
                    <div key={i} className={`w-4 h-2 rounded-full ${i <= level ? 'bg-mint' : 'bg-muted'}`} />
                  );
                })}
              </div>
            </div>
          </div>
        </KikiCard>

        {/* Ampliar Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-mint-700 bg-mint-50/80 rounded-xl border border-mint-100/50 shadow-sm transition-all hover:bg-mint-100/50 active:scale-[0.98]"
        >
          {isExpanded ? (
            <><ChevronUp size={18} /> Ver menos información</>
          ) : (
            <><ChevronDown size={18} /> Ver información completa</>
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Clinical Classification */}
              <KikiCard className="!p-5 space-y-4 border-blue-100 bg-blue-50/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/10 -mr-12 -mt-12 rounded-full blur-2xl" />
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                  <Layers size={14} className="text-blue-500" /> Clasificación Clínica
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Nombre Clínico</p>
                    <p className="text-sm font-semibold text-navy">{clinicalName}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Objetivo</p>
                    <p className="text-sm font-semibold text-navy">{objective}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Nivel GMFCS</p>
                    <p className="text-sm font-semibold text-navy">{exercise.gmfcs || 'I–V'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Rango Etario</p>
                    <p className="text-sm font-semibold text-navy">{exercise.age_range || 'Todas las edades'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Nivel de Evidencia</p>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                      {exercise.evidence || 'Práctica común'}
                    </span>
                  </div>
                </div>
              </KikiCard>

              {/* Observation Section */}
              <div className="grid grid-cols-2 gap-3">
                <KikiCard className="!p-4 bg-mint-50/30 border-mint-100 space-y-2">
                  <div className="flex items-center gap-2 text-mint-700">
                    <CheckCircle2 size={16} />
                    <h4 className="text-[10px] font-bold uppercase">Señales positivas</h4>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    {exercise.good_signs || "Movimiento fluido y ausencia de dolor."}
                  </p>
                </KikiCard>
                <KikiCard className="!p-4 bg-red-50/30 border-red-100 space-y-2">
                  <div className="flex items-center gap-2 text-rust">
                    <ShieldAlert size={16} />
                    <h4 className="text-[10px] font-bold uppercase">Cuándo parar</h4>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    {exercise.stop_signs || "Presencia de dolor o fatiga extrema."}
                  </p>
                </KikiCard>
              </div>

              {/* Clinical Context & Safety */}
              <KikiCard className="!p-5 space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-rust" /> Seguridad y Contexto
                </h3>
                
                <div className="space-y-3">
                  {exercise.indications && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-mint-50 flex items-center justify-center shrink-0">
                        <Target size={18} className="text-mint-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Indicaciones</p>
                        <p className="text-xs text-foreground leading-relaxed">{exercise.indications}</p>
                      </div>
                    </div>
                  )}

                  {exercise.contraindications && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <AlertTriangle size={18} className="text-rust" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Contraindicaciones</p>
                        <p className="text-xs text-foreground leading-relaxed">{exercise.contraindications}</p>
                      </div>
                    </div>
                  )}

                  {exercise.caregiver_precautions && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Sparkles size={18} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Precauciones</p>
                        <p className="text-xs text-foreground leading-relaxed">{exercise.caregiver_precautions}</p>
                      </div>
                    </div>
                  )}
                </div>

                {exercise.variants && (
                  <div className="pt-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Variantes Sugeridas</p>
                    <p className="text-xs text-foreground leading-relaxed italic">{exercise.variants}</p>
                  </div>
                )}
              </KikiCard>

              {/* Video Reference */}
              {exercise.video_url && (
                <KikiCard className="!p-0 overflow-hidden border-navy/10 shadow-kiki-sm">
                  <div className="p-4 border-b border-border bg-muted/5 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                      <Video size={14} className="text-navy" /> Video de Referencia
                    </h3>
                  </div>
                  <div className="aspect-video bg-navy/90">
                    {showVideo ? (
                      <video src={exercise.video_url} controls autoPlay className="w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <button 
                          onClick={() => setShowVideo(true)}
                          className="w-16 h-16 rounded-full bg-mint shadow-xl flex items-center justify-center text-navy transition-all hover:scale-110 active:scale-95 group"
                        >
                          <Play size={28} fill="currentColor" className="ml-1 transition-transform group-hover:translate-x-0.5" />
                        </button>
                        <p className="absolute bottom-4 left-4 text-[10px] font-bold text-white uppercase tracking-widest">Reproducir guía visual</p>
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
