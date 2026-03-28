import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, GripVertical, Check } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';

const frequencyOptions = ['Diaria', '5 veces por semana', '3 veces por semana', 'A definir al importar'];

export default function CreateProtocolScreen() {
  const navigate = useNavigate();
  const { exercises } = useAppStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [searchEx, setSearchEx] = useState('');

  const filteredExercises = exercises.filter(e =>
    !selectedExercises.includes(e.id) &&
    (e.name.toLowerCase().includes(searchEx.toLowerCase()) || e.targetArea.toLowerCase().includes(searchEx.toLowerCase()))
  );

  const addExercise = (id: string) => {
    setSelectedExercises(prev => [...prev, id]);
    setSearchEx('');
  };

  const removeExercise = (id: string) => {
    setSelectedExercises(prev => prev.filter(eid => eid !== id));
  };

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
            <label className="text-xs font-medium block mb-1">Nombre del protocolo</label>
            <input className="input-kiki text-sm" placeholder="Ej: Tronco y transferencias · GMFCS III" value={name} onChange={e => setName(e.target.value)} />
            <p className="text-[10px] text-muted-foreground mt-0.5">No es visible para el cuidador.</p>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Descripción <span className="text-muted-foreground">(opcional)</span></label>
            <textarea className="input-kiki text-sm min-h-[60px] resize-none" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5">Frecuencia sugerida</label>
            <div className="flex flex-wrap gap-2">
              {frequencyOptions.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${frequency === f ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}
                >
                  {frequency === f && <Check size={10} className="inline mr-1" />}{f}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Ajustable por paciente al importar.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Ejercicios del protocolo</h2>
          <div className="relative">
            <input
              className="input-kiki text-sm"
              placeholder="Buscar ejercicio para agregar…"
              value={searchEx}
              onChange={e => setSearchEx(e.target.value)}
            />
            {searchEx && filteredExercises.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl mt-1 shadow-kiki z-10 max-h-40 overflow-y-auto">
                {filteredExercises.slice(0, 5).map(ex => (
                  <button key={ex.id} onClick={() => addExercise(ex.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b border-border last:border-0">
                    <p className="font-medium">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ex.duration}min · {ex.sets} series · GMFCS {ex.gmfcsLevels.join(',')}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedExercises.length > 0 && (
            <div className="space-y-2 border border-border rounded-xl p-2">
              {selectedExercises.map(exId => {
                const ex = exercises.find(e => e.id === exId);
                if (!ex) return null;
                return (
                  <div key={exId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <GripVertical size={14} className="text-muted-foreground shrink-0" />
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: ex.thumbnailColor + '30' }}>
                      🏃
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ex.name}</p>
                      <p className="text-[10px] text-muted-foreground">{ex.duration}min · {ex.sets} series</p>
                    </div>
                    <button onClick={() => removeExercise(exId)} className="text-muted-foreground hover:text-rust" aria-label="Quitar">
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
              <p className="text-[10px] text-muted-foreground text-center">Podés reordenar arrastrando los ejercicios.</p>
            </div>
          )}

          {selectedExercises.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">Buscá ejercicios arriba para agregarlos al protocolo</p>
            </div>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 p-4 bg-background border-t border-border space-y-2">
        <button onClick={() => navigate(-1)} className="btn-primary w-full text-sm">Guardar protocolo</button>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="btn-secondary flex-1 text-xs py-2">Guardar y compartir</button>
          <button onClick={() => navigate(-1)} className="btn-ghost flex-1 text-xs py-2">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
