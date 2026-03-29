import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, GripVertical, Check, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';

const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function EditPlanScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, exercises, exercisePlans } = useAppStore();

  const patient = patients.find(p => p.id === id);
  const existingPlan = exercisePlans.find(p => p.patientId === id);

  const [planName, setPlanName] = useState(existingPlan?.name || 'Nuevo plan');
  const [selectedDays, setSelectedDays] = useState(['Lun', 'Mar', 'Mié', 'Jue', 'Vie']);
  const [durationWeeks, setDurationWeeks] = useState('4');
  const [planExercises, setPlanExercises] = useState<string[]>(existingPlan?.exercises || ['ex-1', 'ex-2', 'ex-3']);
  const [searchEx, setSearchEx] = useState('');
  const [saved, setSaved] = useState(false);

  const toggleDay = (d: string) => setSelectedDays(prev => prev.includes(d) ? prev.filter(dd => dd !== d) : [...prev, d]);
  const removeExercise = (exId: string) => setPlanExercises(prev => prev.filter(e => e !== exId));
  const addExercise = (exId: string) => { setPlanExercises(prev => [...prev, exId]); setSearchEx(''); };

  const moveExercise = useCallback((index: number, direction: 'up' | 'down') => {
    setPlanExercises(prev => {
      const newList = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newList.length) return prev;
      [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
      return newList;
    });
  }, []);

  const availableExercises = exercises.filter(e => !planExercises.includes(e.id) && (e.name.toLowerCase().includes(searchEx.toLowerCase())));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => navigate(-1), 1200);
  };

  if (saved) {
    return (
      <div className="mobile-frame flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-mint-100 flex items-center justify-center mb-4">
          <Check size={40} className="text-mint-600" />
        </div>
        <h2 className="text-xl font-bold">Plan guardado</h2>
        <p className="text-sm text-muted-foreground mt-1">La cuidadora será notificada del cambio.</p>
      </div>
    );
  }

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Editar plan</h1>
          <p className="text-[11px] text-muted-foreground">{patient?.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-5">
        <div>
          <label className="text-xs font-medium block mb-1">Nombre del plan</label>
          <input className="input-kiki text-sm" value={planName} onChange={e => setPlanName(e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-medium block mb-1.5">Días de la semana</label>
          <div className="flex gap-2">
            {days.map(d => (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                className={`w-10 h-10 rounded-full text-xs font-medium transition-colors ${selectedDays.includes(d) ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                {d}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{selectedDays.length} veces por semana</p>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1">Duración (semanas)</label>
          <input type="number" className="input-kiki text-sm w-24" value={durationWeeks} onChange={e => setDurationWeeks(e.target.value)} min="1" max="52" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium">Ejercicios del plan</label>
            <span className="text-[10px] text-muted-foreground">{planExercises.length} ejercicios</span>
          </div>

          <div className="space-y-2 mb-3">
            {planExercises.map((exId, index) => {
              const ex = exercises.find(e => e.id === exId);
              if (!ex) return null;
              return (
                <div key={exId} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveExercise(index, 'up')} disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5" aria-label="Mover arriba">
                      <ChevronUp size={12} />
                    </button>
                    <button onClick={() => moveExercise(index, 'down')} disabled={index === planExercises.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5" aria-label="Mover abajo">
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: ex.thumbnailColor + '30' }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ex.thumbnailColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ex.duration}min · {ex.sets}×{ex.reps}</p>
                  </div>
                  <button onClick={() => removeExercise(exId)} className="text-muted-foreground hover:text-rust p-1" aria-label="Quitar">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="relative">
            <input className="input-kiki text-sm" placeholder="Buscar ejercicio para agregar…" value={searchEx} onChange={e => setSearchEx(e.target.value)} />
            {searchEx && availableExercises.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl mt-1 shadow-kiki z-10 max-h-40 overflow-y-auto">
                {availableExercises.slice(0, 5).map(ex => (
                  <button key={ex.id} onClick={() => addExercise(ex.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b border-border last:border-0">
                    <p className="font-medium text-xs">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ex.targetArea} · {ex.duration}min</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => navigate('/kine/exercises')} className="btn-ghost text-xs mt-2 w-full text-mint-600">
            <Plus size={12} className="inline mr-1" /> Buscar en biblioteca
          </button>
        </div>
      </div>

      <div className="sticky bottom-0 p-4 bg-background border-t border-border space-y-2">
        <button onClick={handleSave} className="btn-primary w-full text-sm">
          <Save size={14} className="inline mr-1" /> Guardar y notificar a la cuidadora
        </button>
        <button onClick={() => navigate(-1)} className="btn-ghost w-full text-xs">Cancelar</button>
      </div>
    </div>
  );
}
