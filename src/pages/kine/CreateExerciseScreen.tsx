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
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState({
    clinicalName: '', caregiverName: '',
    bodyAreas: [] as string[], objectives: [] as string[], gmfcs: [] as string[], ageRanges: [] as string[],
    indications: '', contraindications: '', clinicalObjective: '',
    evidenceLevel: '', reference: '',
    instructions: '', durationPerRep: '', reps: '', difficulty: '',
    goodSigns: '', stopSigns: '', caregiverPrecautions: '', variants: '',
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
    if (!form.clinicalName.trim()) return 'El nombre clínico es obligatorio';
    if (form.bodyAreas.length === 0) return 'Seleccioná al menos un área corporal';
    if (form.objectives.length === 0) return 'Seleccioná al menos un objetivo funcional';
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
        name: form.clinicalName,
        simple_name: form.caregiverName || null,
        description: form.instructions, // Use instructions as the main description
        target_area: form.bodyAreas.join(', '),
        category: form.objectives.join(', '),
        gmfcs: form.gmfcs.join(', '),
        age_range: form.ageRanges.join(', '),
        indications: form.indications || null,
        contraindications: form.contraindications || null,
        clinical_objective: form.clinicalObjective || null,
        evidence: form.evidenceLevel || null,
        instructions: form.instructions || null,
        duration: parseInt(form.durationPerRep) || 5,
        sets: 3, // Default sets
        reps: form.reps || '10 repeticiones',
        difficulty: form.difficulty || null,
        good_signs: form.goodSigns || null,
        stop_signs: form.stopSigns || null,
        caregiver_precautions: form.caregiverPrecautions || null,
        variants: form.variants || null,
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
            <input className="input-kiki text-sm" placeholder="Este nombre lo ves vos en el dashboard" value={form.clinicalName} onChange={e => setForm(p => ({ ...p, clinicalName: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Nombre para el cuidador <span className="text-muted-foreground">(recomendado)</span></label>
            <input className="input-kiki text-sm" placeholder="Si lo dejás vacío, verá el nombre clínico" value={form.caregiverName} onChange={e => setForm(p => ({ ...p, caregiverName: e.target.value }))} />
          </div>
        </section>

        {/* 2. Classification */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">2. Clasificación clínica</h2>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Área corporal *</label>
            <PillSelector options={bodyAreas} selected={form.bodyAreas} onToggle={v => toggleArr('bodyAreas', v)} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Objetivo funcional *</label>
            <PillSelector options={objectives} selected={form.objectives} onToggle={v => toggleArr('objectives', v)} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Nivel GMFCS sugerido *</label>
            <PillSelector options={gmfcsLevels} selected={form.gmfcs} onToggle={v => toggleArr('gmfcs', v)} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Rango etario</label>
            <PillSelector options={ageRanges} selected={form.ageRanges} onToggle={v => toggleArr('ageRanges', v)} />
          </div>
        </section>

        {/* 3. Clinical context */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">3. Contexto clínico</h2>
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
          <h2 className="text-sm font-semibold text-foreground">4. Nivel de evidencia</h2>
          <div className="space-y-2">
            {evidenceLevels.map(ev => (
              <button key={ev.id} type="button" onClick={() => setForm(p => ({ ...p, evidenceLevel: ev.id }))}
                className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${form.evidenceLevel === ev.id ? 'border-mint bg-mint-50' : 'border-border bg-card'}`}>
                <div className="flex items-center gap-2"><span className="text-lg">{ev.icon}</span><span className="text-sm font-medium">{ev.label}</span></div>
                <p className="text-xs text-muted-foreground mt-0.5 ml-7">{ev.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 5. Caregiver instructions */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">5. Instrucciones para el cuidador *</h2>
          <textarea className="input-kiki text-sm min-h-[100px] resize-none" placeholder="Instrucciones paso a paso en lenguaje simple…" value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium text-foreground block mb-1">Duración por rep</label>
              <input className="input-kiki text-sm" placeholder="Ej: 30 seg" value={form.durationPerRep} onChange={e => setForm(p => ({ ...p, durationPerRep: e.target.value }))} />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-foreground block mb-1">Repeticiones</label>
              <input className="input-kiki text-sm" placeholder="Ej: 3" value={form.reps} onChange={e => setForm(p => ({ ...p, reps: e.target.value }))} />
            </div>
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
          <h2 className="text-sm font-semibold text-foreground">6. Observación</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-mint-700 block mb-1">Señales de que va bien</label>
              <textarea className="input-kiki text-sm min-h-[80px] resize-none" value={form.goodSigns} onChange={e => setForm(p => ({ ...p, goodSigns: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-rust block mb-1">Cuándo parar o ajustar</label>
              <textarea className="input-kiki text-sm min-h-[80px] resize-none" value={form.stopSigns} onChange={e => setForm(p => ({ ...p, stopSigns: e.target.value }))} />
            </div>
          </div>
        </section>

        {/* 7. Video */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">7. Video de referencia <span className="text-muted-foreground">(recomendado)</span></h2>
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
