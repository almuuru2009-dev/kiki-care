import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Info, Upload, X } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const bodyAreas = ['Miembros inferiores', 'Miembros superiores', 'Tronco y columna', 'Control cefálico', 'Global / integrado'];
const objectives = ['Tono muscular', 'Control postural', 'Equilibrio', 'Elongación', 'Fortalecimiento', 'Función de mano', 'Transferencias', 'Marcha'];
const gmfcsLevels = ['I', 'II', 'III', 'IV', 'V', 'Todos'];
const ageRanges = ['0–2 años', '2–5 años', '5–10 años', '10–18 años'];
const evidenceLevels = [
  { id: 'guide', label: 'Guía clínica', desc: 'Respaldado por protocolo o guía oficial', icon: '📋' },
  { id: 'common', label: 'Práctica común', desc: 'Ampliamente usado, sin fuente específica', icon: '👥' },
  { id: 'custom', label: 'Adaptación', desc: 'Variante personalizada de mi práctica', icon: '✏️' },
];
const difficultyLevels = [
  { id: 'suave', label: 'Suave', desc: 'Poca resistencia. El niño tolera bien la posición.', color: 'bg-mint-100 border-mint-300 text-mint-700' },
  { id: 'moderado', label: 'Moderado', desc: 'Resistencia notable. Puede requerir pausas.', color: 'bg-amber-100 border-amber-300 text-amber-700' },
  { id: 'intensivo', label: 'Intensivo', desc: 'Alta resistencia. Requiere técnica precisa.', color: 'bg-red-100 border-red-300 text-rust' },
];

function PillSelector({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (o: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onToggle(o)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${selected.includes(o) ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
          {selected.includes(o) && <Check size={10} className="inline mr-1" />}{o}
        </button>
      ))}
    </div>
  );
}

const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

export default function CreateExerciseScreen() {
  // SCHEMA_FIX_APPLIED_V2
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState({
    name: '',
    description: '',
    target_area: [] as string[],
    duration: '',
    reps: '',
    sets: 3,
  });

  const toggleArea = (val: string) => {
    const arr = form.target_area;
    setForm(prev => ({ ...prev, target_area: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] }));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error('El video no puede superar los 200 MB');
      return;
    }
    if (!file.type.startsWith('video/')) {
      toast.error('Solo se permiten archivos de video (MP4, MOV)');
      return;
    }
    setVideoFile(file);
    toast.success(`Video seleccionado: ${file.name}`);
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'El nombre clínico es obligatorio';
    if (form.target_area.length === 0) return 'Seleccioná al menos un área corporal';
    if (!form.description.trim()) return 'Las instrucciones son obligatorias';
    return null;
  };

  const handleSave = async (share = false) => {
    const err = validate();
    if (err) { toast.error(err); return; }
    if (!user) return;

    setSaving(true);
    try {
      let videoUrl: string | null = null;

      // Upload video if present
      if (videoFile) {
        const ext = videoFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('exercise-videos')
          .upload(path, videoFile, { cacheControl: '3600', upsert: false });
        if (uploadErr) {
          toast.error('Error subiendo video: ' + uploadErr.message);
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('exercise-videos').getPublicUrl(path);
        videoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('exercises').insert({
        created_by: user.id,
        name: form.name,
        description: form.description,
        target_area: form.target_area.join(', '),
        duration: parseInt(form.duration) || 5,
        sets: form.sets, 
        reps: form.reps || '10 repeticiones',
        video_url: videoUrl,
        is_community: share,
      });

      if (error) throw error;
      toast.success(share ? 'Ejercicio guardado y compartido a la comunidad' : 'Ejercicio guardado en tu biblioteca');
      navigate(-1);
    } catch (e: any) {
      toast.error('Error guardando: ' + e.message);
    }
    setSaving(false);
  };

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold">Crear ejercicio</h1>
          <p className="text-[11px] text-muted-foreground">El ejercicio se guarda en tu biblioteca personal.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-5">
        {/* 1. Identification */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">1. Identificación</h2>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Nombre clínico del ejercicio *</label>
            <input className="input-kiki text-sm" placeholder="Ej: Flexión de rodilla" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
        </section>

        {/* 2. Classification */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">2. Clasificación</h2>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Área corporal *</label>
            <PillSelector options={bodyAreas} selected={form.target_area} onToggle={v => toggleArea(v)} />
          </div>
        </section>

        {/* 3. Caregiver instructions */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">3. Instrucciones para el cuidador *</h2>
          <textarea className="input-kiki text-sm min-h-[100px] resize-none" placeholder="Instrucciones paso a paso en lenguaje simple…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium text-foreground block mb-1">Duración (seg)</label>
              <input className="input-kiki text-sm" placeholder="Ej: 30" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-foreground block mb-1">Repeticiones</label>
              <input className="input-kiki text-sm" placeholder="Ej: 10" value={form.reps} onChange={e => setForm(p => ({ ...p, reps: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Series</label>
            <input type="number" className="input-kiki text-sm" value={form.sets} onChange={e => setForm(p => ({ ...p, sets: parseInt(e.target.value) || 0 }))} />
          </div>
        </section>

        {/* 4. Video */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">4. Video de referencia <span className="text-muted-foreground">(recomendado)</span></h2>
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
          {videoFile ? (
            <div className="border-2 border-mint rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-mint-50 flex items-center justify-center">📹</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{videoFile.name}</p>
                <p className="text-[10px] text-muted-foreground">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button onClick={() => setVideoFile(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-mint transition-colors"
              onClick={() => fileInputRef.current?.click()}>
              <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Subir video</p>
              <p className="text-[10px] text-muted-foreground">MP4 o MOV · máximo 200 MB</p>
              <button type="button" className="btn-secondary text-xs mt-3">Seleccionar archivo</button>
            </div>
          )}
        </section>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 p-4 bg-background border-t border-border space-y-2">
        <button onClick={() => handleSave(false)} className="btn-primary w-full text-sm" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar en mis ejercicios'}
        </button>
        <div className="flex gap-2">
          <button onClick={() => handleSave(true)} className="btn-secondary flex-1 text-xs py-2" disabled={saving}>Guardar y compartir</button>
          <button onClick={() => navigate(-1)} className="btn-ghost flex-1 text-xs py-2">Descartar</button>
        </div>
      </div>
    </div>
  );
}
