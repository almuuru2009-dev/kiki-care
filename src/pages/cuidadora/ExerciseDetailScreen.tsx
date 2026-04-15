import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Target, Repeat } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ExerciseDetail {
  id: string;
  name: string;
  description: string | null;
  target_area: string | null;
  duration: number | null;
  sets: number | null;
  reps: string | null;
  video_url: string | null;
  thumbnail_color: string | null;
}

export default function ExerciseDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (id) loadExercise();
  }, [id]);

  const loadExercise = async () => {
    const { data } = await supabase.from('exercises').select('*').eq('id', id).single();
    if (data) setExercise(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="mobile-frame flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="mobile-frame flex flex-col min-h-screen bg-background items-center justify-center px-6">
        <p className="text-lg font-semibold mb-2">Ejercicio no encontrado</p>
        <button onClick={() => navigate(-1)} className="btn-primary text-sm px-6">Volver</button>
      </div>
    );
  }

  const color = exercise.thumbnail_color || '#7EEDC4';

  // Parse description sections
  const descriptionParts = (exercise.description || '').split('\n\n').filter(Boolean);

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      {/* Header with color */}
      <div className="relative" style={{ background: `linear-gradient(135deg, ${color}40, ${color}15)` }}>
        <div className="px-4 pt-4 pb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card/80 flex items-center justify-center mb-4" aria-label="Volver">
            <ArrowLeft size={20} />
          </button>
          {exercise.target_area && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-card/80 text-foreground">
              {exercise.target_area}
            </span>
          )}
          <h1 className="text-xl font-bold text-foreground mt-2">{exercise.name}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4">
        {/* Quick stats */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-muted/50 p-3 flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">{exercise.duration || 5} min</p>
              <p className="text-[10px] text-muted-foreground">Duración</p>
            </div>
          </div>
          <div className="flex-1 rounded-xl bg-muted/50 p-3 flex items-center gap-2">
            <Repeat size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">{exercise.sets || 3} series</p>
              <p className="text-[10px] text-muted-foreground">{exercise.reps || '10 reps'}</p>
            </div>
          </div>
        </div>

        {/* Video */}
        {exercise.video_url && (
          <KikiCard>
            {showVideo ? (
              <video src={exercise.video_url} controls autoPlay className="w-full rounded-lg" />
            ) : (
              <button onClick={() => setShowVideo(true)}
                className="w-full h-44 rounded-lg flex items-center justify-center relative"
                style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)` }}>
                <div className="w-16 h-16 rounded-full bg-card shadow-lg flex items-center justify-center">
                  <Play size={28} className="text-foreground ml-1" />
                </div>
                <span className="absolute bottom-2 right-2 text-[10px] bg-card/80 px-2 py-0.5 rounded-full">Ver video</span>
              </button>
            )}
          </KikiCard>
        )}

        {/* Description / Instructions */}
        {descriptionParts.length > 0 && (
          <KikiCard>
            <h3 className="text-sm font-semibold mb-2">Instrucciones</h3>
            <div className="space-y-3">
              {descriptionParts.map((part, i) => {
                // Check if it's a labeled section
                const colonIdx = part.indexOf(':');
                if (colonIdx > 0 && colonIdx < 40) {
                  const label = part.slice(0, colonIdx).trim();
                  const content = part.slice(colonIdx + 1).trim();
                  return (
                    <div key={i}>
                      <p className="text-[11px] font-semibold text-mint-600 mb-0.5">{label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
                    </div>
                  );
                }
                return <p key={i} className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{part}</p>;
              })}
            </div>
          </KikiCard>
        )}
      </div>
    </div>
  );
}
