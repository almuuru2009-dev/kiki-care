import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Info, Upload, X } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const bodyAreas = ['Miembros inferiores', 'Miembros superiores', 'Tronco y columna', 'Control cefálico', 'Global integrado'];
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
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: '', 
    simple_name: '',
    target_area: [] as string[], 
    objective: [] as string[], 
    gmfcs: [] as string[], 
    age_range: [] as string[],
    indications: '', 
    contraindications: '',
    evidence_level: '', 
    instructions: '', 
    duration: '', 
    reps: '', 
    sets: 3,
    difficulty: '',
    signs_going_well: '', 
    when_to_stop: '',
  });

  const toggleArr = (field: keyof typeof form, val: string) => {
    const arr = form[field] as string[];
    setForm(prev => ({ ...prev, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] }));
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
    if (form.objective.length === 0) return 'Seleccioná al menos un objetivo funcional';
    if (form.gmfcs.length === 0) return 'Seleccioná al menos un nivel GMFCS';
    if (!form.instructions.trim()) return 'Las instrucciones son obligatorias';
    return null;
  };

  const handleSave = async (share = false) => {
    const err = validate();
    if (err) { toast.error(err); return; }
    if (!user) return;

    setSaving(true);
    try {
      let videoUrl: string | null = null;

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
        simple_name: form.simple_name || null,
        description: form.instructions, // Keep description in sync with instructions for older code compatibility
        target_area: form.target_area.join(', '),
        objective: form.objective.join(', '),
        gmfcs: form.gmfcs.join(', '),
        age_range: form.age_range.join(', '),
        indications: form.indications || null,
        contraindications: form.contraindications || null,
        evidence_level: form.evidence_level || null,
        instructions: form.instructions,
        duration: parseInt(form.duration) || 5,
        sets: form.sets,
        reps: form.reps || '10 repeticiones',
        difficulty: form.difficulty || null,
        signs_going_well: form.signs_going_well || null,
        when_to_stop: form.when_to_stop || null,
        video_url: videoUrl,
        is_community: share,
      });

      if (error) throw error;
      toast.success(share ? 'Ejercicio guardado y compartido' : 'Ejercicio guardado');
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
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-1">1. IDENTIFICACIÓN</h2>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Nombre clínico del ejercicio *</label>
            <input className="input-kiki text-sm" placeholder="Ej: Flexión de rodilla" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Nombre para el cuidador</label>
            <p className="text-[10px] text-muted-foreground mb-1">Si lo dejás vacío, verá el nombre clínico</p>
            <input className="input-kiki text-sm" placeholder="Ej: Doblar la pierna" value={form.simple_name} onChange={e => setForm(p => ({ ...p, simple_name: e.target.value }))} />
          </div>
        </section>

        {/* 2. Classification */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-1">2. CLASIFICACIÓN CLÍNICA</h2>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Área corporal *</label>
            <PillSelector options={bodyAreas} selected={form.target_area} onToggle={v => toggleArr('target_area', v)} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Objetivo funcional *</label>
            <PillSelector options={objectives} selected={form.objective} onToggle={v => toggleArr('objective', v)} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Nivel GMFCS sugerido *</label>
            <PillSelector options={gmfcsLevels} selected={form.gmfcs} onToggle={v => toggleArr('gmfcs', v)} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Rango etario</label>
            <PillSelector options={ageRanges} selected={form.age_range} onToggle={v => toggleArr('age_range', v)} />
          </div>
        </section>

        {/* 3. Clinical context */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-1">3. CONTEXTO CLÍNICO</h2>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Indicaciones clínicas <span className="text-muted-foreground">(opcional)</span></label>
            <textarea className="input-kiki text-sm min-h-[60px] resize-none" value={form.indications} onChange={e => setForm(p => ({ ...p, indications: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Contraindicaciones <span className="text-muted-foreground">(opcional)</span></label>
            <textarea className="input-kiki text-sm min-h-[60px] resize-none" value={form.contraindications} onChange={e => setForm(p => ({ ...p, contraindications: e.target.value }))} />
          </div>
        </section>

        {/* 4. Evidence */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-1">4. NIVEL DE EVIDENCIA</h2>
          <div className="space-y-2">
            {evidenceLevels.map(ev => (
              <button key={ev.id} type="button" onClick={() => setForm(p => ({ ...p, evidence_level: ev.id }))}
                className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${form.evidence_level === ev.id ? 'border-mint bg-mint-50' : 'border-border bg-card'}`}>
                <div className="flex items-center gap-2"><span className="text-lg">{ev.icon}</span><span className="text-sm font-medium">{ev.label}</span></div>
                <p className="text-xs text-muted-foreground mt-0.5 ml-7">{ev.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 5. Instructions */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-1">5. INSTRUCCIONES PARA EL CUIDADOR *</h2>
          <textarea className="input-kiki text-sm min-h-[100px] resize-none" placeholder="Instrucciones paso a paso en lenguaje simple…" value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium text-foreground block mb-1">Duración por rep</label>
              <input className="input-kiki text-sm" placeholder="Ej: 30 seg" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} />
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
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Nivel de dificultad</label>
            <div className="space-y-2">
              {difficultyLevels.map(d => (
                <button key={d.id} type="button" onClick={() => setForm(p => ({ ...p, difficulty: d.id }))}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${form.difficulty === d.id ? `${d.color} border-current` : 'border-border bg-card'}`}>
                  <p className="text-sm font-medium">{d.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Observation */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-1">6. OBSERVACIÓN</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-mint-700 block mb-1 uppercase">Señales de que va bien</label>
              <textarea className="input-kiki text-sm min-h-[80px] resize-none" value={form.signs_going_well} onChange={e => setForm(p => ({ ...p, signs_going_well: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-rust block mb-1 uppercase">Cuándo parar o ajustar</label>
              <textarea className="input-kiki text-sm min-h-[80px] resize-none" value={form.when_to_stop} onChange={e => setForm(p => ({ ...p, when_to_stop: e.target.value }))} />
            </div>
          </div>
        </section>

        {/* 7. Video */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-1">7. VIDEO DE REFERENCIA</h2>
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
