import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Upload, X, Save } from 'lucide-react';
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
    clinicalName: '', caregiverName: '',
    bodyAreas: [] as string[], objectives: [] as string[], gmfcs: [] as string[], ageRanges: [] as string[],
    indications: '', contraindications: '', clinicalObjective: '',
    evidenceLevel: '', reference: '',
    instructions: '', durationPerRep: '', reps: '', difficulty: '',
    goodSigns: '', stopSigns: '', caregiverPrecautions: '', variants: '',
    video_url: '',
  });

  useEffect(() => {
    if (user && id) loadExercise();
  }, [user, id]);

  const loadExercise = async () => {
    const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();
    if (error) {
      toast.error('Error cargando ejercicio');
      navigate(-1);
      return;
    }
    if (data) {
      setForm({
        clinicalName: data.name || '',
        caregiverName: data.simple_name || '',
        bodyAreas: (data.target_area || '').split(', ').filter(Boolean),
        objectives: (data.category || '').split(', ').filter(Boolean),
        gmfcs: (data.gmfcs || '').split(', ').filter(Boolean),
        ageRanges: (data.age_range || '').split(', ').filter(Boolean),
        indications: data.indications || '',
        contraindications: data.contraindications || '',
        clinicalObjective: data.clinical_objective || '',
        evidenceLevel: data.evidence || '',
        reference: '',
        instructions: data.instructions || data.description || '',
        durationPerRep: data.duration?.toString() || '',
        reps: data.reps || '',
        difficulty: data.difficulty || '',
        goodSigns: data.good_signs || '',
        stopSigns: data.stop_signs || '',
        caregiverPrecautions: data.caregiver_precautions || '',
        variants: data.variants || '',
        video_url: data.video_url || '',
      });
    }
    setLoading(false);
  };

  const toggleArr = (field: keyof typeof form, val: string) => {
    const arr = form[field] as string[];
    if (!Array.isArray(arr)) return;
    setForm(prev => ({ ...prev, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] }));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE) { toast.error('El video no puede superar 200 MB'); return; }
    if (!file.type.startsWith('video/')) { toast.error('Solo archivos de video'); return; }
    setVideoFile(file);
  };

  const validate = (): string | null => {
    if (!form.clinicalName.trim()) return 'El nombre clínico es obligatorio';
    if (form.bodyAreas.length === 0) return 'Seleccioná al menos un área corporal';
    if (form.instructions.trim()) return null;
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
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
        name: form.clinicalName,
        simple_name: form.caregiverName || null,
        description: form.instructions || null,
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
        reps: form.reps || '10 repeticiones',
        difficulty: form.difficulty || null,
        good_signs: form.goodSigns || null,
        stop_signs: form.stopSigns || null,
        caregiver_precautions: form.caregiverPrecautions || null,
        variants: form.variants || null,
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

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-6">
        {/* 1. Identification */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">1. Identificación</h2>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Nombre clínico *</label>
            <input className="input-kiki text-sm" value={form.clinicalName} onChange={e => setForm(p => ({ ...p, clinicalName: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Nombre para el cuidador</label>
            <input className="input-kiki text-sm" value={form.caregiverName} onChange={e => setForm(p => ({ ...p, caregiverName: e.target.value }))} />
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
            <label className="text-xs font-medium text-foreground block mb-1.5">Objetivo funcional</label>
            <PillSelector options={objectives} selected={form.objectives} onToggle={v => toggleArr('objectives', v)} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Nivel GMFCS sugerido</label>
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
            <label className="text-xs font-medium text-foreground block mb-1">Indicaciones clínicas</label>
            <textarea className="input-kiki text-sm min-h-[60px] resize-none" value={form.indications} onChange={e => setForm(p => ({ ...p, indications: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Contraindicaciones</label>
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

        {/* 5. Instructions */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">5. Instrucciones para el cuidador *</h2>
          <textarea className="input-kiki text-sm min-h-[100px] resize-none" value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium text-foreground block mb-1">Duración por rep</label>
              <input className="input-kiki text-sm" value={form.durationPerRep} onChange={e => setForm(p => ({ ...p, durationPerRep: e.target.value }))} />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-foreground block mb-1">Repeticiones</label>
              <input className="input-kiki text-sm" value={form.reps} onChange={e => setForm(p => ({ ...p, reps: e.target.value }))} />
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
          <h2 className="text-sm font-semibold text-foreground">7. Video de referencia</h2>
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
          
          {videoFile ? (
            <div className="border-2 border-mint rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">📹</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{videoFile.name}</p>
                <p className="text-[10px] text-muted-foreground">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button onClick={() => setVideoFile(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><X size={14} /></button>
            </div>
          ) : form.video_url ? (
            <div className="relative border border-border rounded-xl overflow-hidden bg-muted/20">
              <video src={form.video_url} className="w-full max-h-40 object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs px-3">Cambiar</button>
                <button onClick={() => setForm(p => ({ ...p, video_url: '' }))} className="btn-ghost text-xs px-3 text-white">Eliminar</button>
              </div>
              {/* Visible delete button for mobile/always */}
              <button 
                onClick={() => setForm(p => ({ ...p, video_url: '' }))}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-rust text-white flex items-center justify-center shadow-lg"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs w-full py-4 border-dashed border-2">
              <Upload size={14} className="inline mr-1" /> Seleccionar video
            </button>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 p-4 bg-background border-t border-border space-y-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-sm shadow-mint-lg">
          <Save size={16} className="inline mr-1" /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button onClick={() => navigate(-1)} className="btn-ghost w-full text-xs">Cancelar</button>
      </div>
    </div>
  );
}
