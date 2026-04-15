import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, GripVertical, Check, Search } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const frequencyOptions = ['Diaria', '5 veces por semana', '3 veces por semana', 'A definir al importar'];

interface ExerciseOption {
  id: string;
  name: string;
  duration: number | null;
  sets: number | null;
  reps: string | null;
  target_area: string | null;
}

export default function CreateProtocolScreen() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<ExerciseOption[]>([]);
  const [availableExercises, setAvailableExercises] = useState<ExerciseOption[]>([]);
  const [searchEx, setSearchEx] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadExercises();
  }, [user]);

  const loadExercises = async () => {
    if (!user) return;
    const { data } = await supabase.from('exercises').select('id, name, duration, sets, reps, target_area').eq('created_by', user.id);
    setAvailableExercises(data || []);
    setLoading(false);
  };

  const filteredExercises = availableExercises.filter(e =>
    !selectedExercises.some(s => s.id === e.id) &&
    (e.name.toLowerCase().includes(searchEx.toLowerCase()) || (e.target_area || '').toLowerCase().includes(searchEx.toLowerCase()))
  );

  const addExercise = (ex: ExerciseOption) => {
    setSelectedExercises(prev => [...prev, ex]);
    setSearchEx('');
  };

  const removeExercise = (id: string) => {
    setSelectedExercises(prev => prev.filter(e => e.id !== id));
  };

  const handleSave = async (share = false) => {
    if (!name.trim()) { toast.error('El nombre del protocolo es obligatorio'); return; }
    if (selectedExercises.length === 0) { toast.error('Agregá al menos un ejercicio'); return; }
    if (!user) return;

    setSaving(true);
    try {
      const { data: proto, error: protoError } = await supabase.from('protocols').insert({
        created_by: user.id,
        name,
        description: description || null,
        frequency: frequency || null,
        is_community: share,
      }).select('id').single();

      if (protoError) throw protoError;

      const rows = selectedExercises.map((ex, i) => ({
        protocol_id: proto.id,
        exercise_id: ex.id,
        sort_order: i,
      }));

      const { error: peError } = await supabase.from('protocol_exercises').insert(rows);
      if (peError) throw peError;

      toast.success(share ? 'Protocolo guardado y compartido' : 'Protocolo guardado');
      navigate(-1);
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message);
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
        <div>
          <h1 className="text-lg font-semibold">Crear protocolo</h1>
          <p className="text-[11px] text-muted-foreground">Agrupá ejercicios para reutilizar en múltiples pacientes.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-5">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Datos del protocolo</h2>
          <div>
            <label className="text-xs font-medium block mb-1">Nombre del protocolo *</label>
            <input className="input-kiki text-sm" placeholder="Ej: Tronco y transferencias · GMFCS III" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Descripción <span className="text-muted-foreground">(opcional)</span></label>
            <textarea className="input-kiki text-sm min-h-[60px] resize-none" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5">Frecuencia sugerida</label>
            <div className="flex flex-wrap gap-2">
              {frequencyOptions.map(f => (
                <button key={f} type="button" onClick={() => setFrequency(f)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${frequency === f ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                  {frequency === f && <Check size={10} className="inline mr-1" />}{f}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Ejercicios del protocolo</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="input-kiki text-sm pl-9" placeholder="Buscar ejercicio para agregar…" value={searchEx} onChange={e => setSearchEx(e.target.value)} />
            {searchEx && filteredExercises.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl mt-1 shadow-kiki z-10 max-h-40 overflow-y-auto">
                {filteredExercises.slice(0, 5).map(ex => (
                  <button key={ex.id} onClick={() => addExercise(ex)} className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b border-border last:border-0">
                    <p className="font-medium">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ex.target_area || 'General'} · {ex.duration || 5}min · {ex.sets || 3} series</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedExercises.length > 0 ? (
            <div className="space-y-2 border border-border rounded-xl p-2">
              {selectedExercises.map((ex) => (
                <div key={ex.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <GripVertical size={14} className="text-muted-foreground shrink-0" />
                  <div className="w-8 h-8 rounded-lg bg-mint-50 flex items-center justify-center text-xs">🏋️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ex.duration || 5}min · {ex.sets || 3} series</p>
                  </div>
                  <button onClick={() => removeExercise(ex.id)} className="text-muted-foreground hover:text-rust" aria-label="Quitar">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">Buscá ejercicios arriba para agregarlos al protocolo</p>
            </div>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 p-4 bg-background border-t border-border space-y-2">
        <button onClick={() => handleSave(false)} className="btn-primary w-full text-sm" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar protocolo'}
        </button>
        <div className="flex gap-2">
          <button onClick={() => handleSave(true)} className="btn-secondary flex-1 text-xs py-2" disabled={saving}>Guardar y compartir</button>
          <button onClick={() => navigate(-1)} className="btn-ghost flex-1 text-xs py-2">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
