import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Save } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

export default function EditExerciseScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    target_area: '',
    duration: '',
    sets: '',
    reps: '',
    video_url: '',
  });

  useEffect(() => {
    if (user && id) loadExercise();
  }, [user, id]);

  const loadExercise = async () => {
    const { data } = await supabase.from('exercises').select('*').eq('id', id).single();
    if (data) {
      setForm({
        name: data.name || '',
        description: data.description || '',
        target_area: data.target_area || '',
        duration: data.duration?.toString() || '',
        sets: data.sets?.toString() || '',
        reps: data.reps || '',
        video_url: data.video_url || '',
      });
    }
    setLoading(false);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE) { toast.error('El video no puede superar 200 MB'); return; }
    if (!file.type.startsWith('video/')) { toast.error('Solo archivos de video'); return; }
    setVideoFile(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!user || !id) return;
    setSaving(true);

    try {
      let videoUrl = form.video_url;

      if (videoFile) {
        const ext = videoFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('exercise-videos').upload(path, videoFile, { cacheControl: '3600', upsert: false });
        if (uploadErr) { toast.error('Error subiendo video'); setSaving(false); return; }
        const { data: urlData } = supabase.storage.from('exercise-videos').getPublicUrl(path);
        videoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('exercises').update({
        name: form.name,
        description: form.description || null,
        target_area: form.target_area || null,
        duration: parseInt(form.duration) || 5,
        sets: parseInt(form.sets) || 3,
        reps: form.reps || '10 repeticiones',
        video_url: videoUrl || null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      if (error) throw error;
      toast.success('Ejercicio actualizado');
      navigate(-1);
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="mobile-frame flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Editar ejercicio</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-4">
        <div>
          <label className="text-xs font-medium block mb-1">Nombre *</label>
          <input className="input-kiki text-sm" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Descripción</label>
          <textarea className="input-kiki text-sm min-h-[80px] resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Área corporal</label>
          <input className="input-kiki text-sm" value={form.target_area} onChange={e => setForm(p => ({ ...p, target_area: e.target.value }))} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium block mb-1">Duración (min)</label>
            <input className="input-kiki text-sm" type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium block mb-1">Series</label>
            <input className="input-kiki text-sm" type="number" value={form.sets} onChange={e => setForm(p => ({ ...p, sets: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Repeticiones</label>
          <input className="input-kiki text-sm" value={form.reps} onChange={e => setForm(p => ({ ...p, reps: e.target.value }))} />
        </div>

        {/* Video */}
        <div>
          <label className="text-xs font-medium block mb-1">Video</label>
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
          {form.video_url && !videoFile && (
            <div className="mb-2">
              <video src={form.video_url} controls className="w-full rounded-lg max-h-40" />
            </div>
          )}
          {videoFile ? (
            <div className="border-2 border-mint rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">📹</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{videoFile.name}</p>
                <p className="text-[10px] text-muted-foreground">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button onClick={() => setVideoFile(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs w-full">
              <Upload size={12} className="inline mr-1" /> {form.video_url ? 'Cambiar video' : 'Subir video'}
            </button>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 p-4 bg-background border-t border-border space-y-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full text-sm">
          <Save size={14} className="inline mr-1" /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button onClick={() => navigate(-1)} className="btn-ghost w-full text-xs">Cancelar</button>
      </div>
    </div>
  );
}
