import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Check, Save, ChevronUp, ChevronDown, Search, Heart } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface ExerciseOption {
  id: string;
  name: string;
  duration: number | null;
  sets: number | null;
  reps: string | null;
  target_area: string | null;
}

interface PlanItem {
  id?: string; // existing plan row id
  exerciseId: string;
  exerciseName: string;
  duration: number | null;
  sets: number | null;
  reps: string | null;
  targetArea: string | null;
  dayOfWeek: number[];
}

export default function EditPlanScreen() {
  const { id: linkId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState('');
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [availableExercises, setAvailableExercises] = useState<ExerciseOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  // Bottom sheet state
  const [showSheet, setShowSheet] = useState(false);
  const [sheetSearch, setSheetSearch] = useState('');
  const [sheetTab, setSheetTab] = useState<0 | 1 | 2>(0);
  const [savedExercises, setSavedExercises] = useState<ExerciseOption[]>([]);
  const [communityExercises, setCommunityExercises] = useState<ExerciseOption[]>([]);
  const [selectedSheetExId, setSelectedSheetExId] = useState<string | null>(null);
  const [sheetExDetail, setSheetExDetail] = useState<any | null>(null);

  useEffect(() => {
    if (user && linkId) loadPlan();
  }, [user, linkId]);

  const loadPlan = async () => {
    if (!user || !linkId) return;

    // Get link to find child_id
    const { data: link } = await supabase.from('therapist_caregiver_links').select('child_id').eq('id', linkId).single();
    if (!link?.child_id) { setLoading(false); return; }
    setChildId(link.child_id);

    // Get child name
    const { data: child } = await supabase.from('children').select('name').eq('id', link.child_id).single();
    setChildName(child?.name || '');

    // Get existing treatment plans
    const { data: plans } = await supabase.from('treatment_plans')
      .select('id, exercise_id, day_of_week, active')
      .eq('child_id', link.child_id)
      .eq('therapist_id', user.id)
      .eq('active', true);

    // Get all user exercises
    const { data: exercises } = await supabase.from('exercises')
      .select('id, name, duration, sets, reps, target_area')
      .eq('created_by', user.id);

    setSavedExercises(savedExList);

    // Get community exercises
    const { data: commEx } = await supabase.from('community_exercises')
      .select('id, clinical_name, area, author_name');
    const commExList: ExerciseOption[] = (commEx || []).map(e => ({
      id: e.id,
      name: e.clinical_name,
      duration: 5,
      sets: 3,
      reps: '10 repeticiones',
      target_area: e.area,
    }));
    setCommunityExercises(commExList);

    const exList = exercises || [];
    setAvailableExercises(exList);

    // Map existing plans
    if (plans && plans.length > 0) {
      const exMap = new Map(exList.map(e => [e.id, e]));
      const items: PlanItem[] = plans.map(p => {
        const ex = exMap.get(p.exercise_id);
        return {
          id: p.id,
          exerciseId: p.exercise_id,
          exerciseName: ex?.name || 'Ejercicio',
          duration: ex?.duration || null,
          sets: ex?.sets || null,
          reps: ex?.reps || null,
          targetArea: ex?.target_area || null,
          dayOfWeek: p.day_of_week || [1, 2, 3, 4, 5],
        };
      });
      setPlanItems(items);
    }

    setLoading(false);
  };

  const addExercise = (ex: ExerciseOption) => {
    if (planItems.some(p => p.exerciseId === ex.id)) {
      toast('Este ejercicio ya está en el plan');
      return;
    }
    setPlanItems(prev => [...prev, {
      exerciseId: ex.id,
      exerciseName: ex.name,
      duration: ex.duration,
      sets: ex.sets,
      reps: ex.reps,
      targetArea: ex.target_area,
      dayOfWeek: [1, 2, 3, 4, 5],
    }]);
    setShowSheet(false);
    setSelectedSheetExId(null);
    toast.success(`"${ex.name}" agregado al plan`);
  };

  const loadSheetExDetail = async (id: string) => {
    setSelectedSheetExId(id);
    setSheetExDetail(null);
    let { data } = await supabase.from('exercises').select('*').eq('id', id).single();
    if (!data) {
      const { data: commData } = await supabase.from('community_exercises').select('*').eq('id', id).single();
      if (commData) {
        data = { ...commData, name: commData.clinical_name, target_area: commData.area, description: commData.instructions || commData.description };
      }
    }
    setSheetExDetail(data);
  };

  const removeExercise = (exId: string) => setPlanItems(prev => prev.filter(p => p.exerciseId !== exId));

  const moveExercise = useCallback((index: number, direction: 'up' | 'down') => {
    setPlanItems(prev => {
      const newList = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newList.length) return prev;
      [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
      return newList;
    });
  }, []);

  const toggleDay = (exIndex: number, day: number) => {
    setPlanItems(prev => prev.map((item, i) => {
      if (i !== exIndex) return item;
      const days = item.dayOfWeek.includes(day)
        ? item.dayOfWeek.filter(d => d !== day)
        : [...item.dayOfWeek, day].sort();
      return { ...item, dayOfWeek: days };
    }));
  };

  const handleSave = async () => {
    if (!user || !childId) return;
    setSaving(true);

    try {
      // Deactivate all existing plans for this child
      await supabase.from('treatment_plans')
        .update({ active: false })
        .eq('child_id', childId)
        .eq('therapist_id', user.id);

      // Insert new plan items
      if (planItems.length > 0) {
        const rows = planItems.map(item => ({
          child_id: childId,
          therapist_id: user.id,
          exercise_id: item.exerciseId,
          day_of_week: item.dayOfWeek,
          active: true,
        }));
        const { error } = await supabase.from('treatment_plans').insert(rows);
        if (error) throw error;
      }

      setSaved(true);
      toast.success('Plan guardado');
      setTimeout(() => navigate(-1), 1200);
    } catch (e: any) {
      toast.error('Error al guardar el plan');
      setSaving(false);
    }
  };

  const sheetExercises = (
    sheetTab === 0 ? availableExercises
    : sheetTab === 1 ? savedExercises
    : communityExercises
  ).filter(e =>
    !planItems.some(p => p.exerciseId === e.id) &&
    e.name.toLowerCase().includes(sheetSearch.toLowerCase())
  );

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
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Editar plan</h1>
          <p className="text-[11px] text-muted-foreground">{childName}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-4">
        {/* Current exercises */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium">Ejercicios del plan</label>
            <span className="text-[10px] text-muted-foreground">{planItems.length} ejercicios</span>
          </div>

          {planItems.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Buscá ejercicios abajo para agregarlos al plan
            </div>
          ) : (
            <div className="space-y-2">
              {planItems.map((item, index) => (
                <div key={item.exerciseId} className="p-2.5 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => moveExercise(index, 'up')} disabled={index === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5">
                        <ChevronUp size={12} />
                      </button>
                      <button onClick={() => moveExercise(index, 'down')} disabled={index === planItems.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5">
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-mint-50 flex items-center justify-center shrink-0">
                      <span className="text-xs">🏋️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.exerciseName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.duration ? `${item.duration}min` : ''}{item.sets ? ` · ${item.sets}×${item.reps || '10'}` : ''}
                      </p>
                    </div>
                    <button onClick={() => removeExercise(item.exerciseId)} className="text-muted-foreground hover:text-rust p-1">
                      <X size={14} />
                    </button>
                  </div>
                  {/* Day selector */}
                  <div className="flex gap-1 mt-2 ml-8">
                    {dayNames.map((name, dayIdx) => (
                      <button key={dayIdx} onClick={() => toggleDay(index, dayIdx)}
                        className={`w-7 h-7 rounded-full text-[10px] font-medium transition-colors ${item.dayOfWeek.includes(dayIdx) ? 'bg-mint text-navy' : 'bg-muted/80 text-muted-foreground'}`}>
                        {name[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add exercise — opens bottom sheet */}
        <button onClick={() => { setShowSheet(true); setSheetSearch(''); setSheetTab(0); }}
          className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
          <Plus size={14} /> Agregar ejercicio
        </button>
      </div>

      <div className="sticky bottom-0 p-4 bg-background border-t border-border space-y-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full text-sm">
          <Save size={14} className="inline mr-1" /> {saving ? 'Guardando...' : 'Guardar plan'}
        </button>
        <button onClick={() => navigate(-1)} className="btn-ghost w-full text-xs">Cancelar</button>
      </div>

      {/* Bottom Sheet — Exercise Library */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 z-40" onClick={() => setShowSheet(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl"
              style={{ height: '75vh' }}>
              {/* Sheet header */}
              <div className="flex items-center px-4 pt-4 pb-3 border-b border-border">
                <h3 className="font-semibold flex-1">Agregar ejercicio</h3>
                <button onClick={() => setShowSheet(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
              {/* Exercise list or Detail */}
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                {!selectedSheetExId ? (
                  <>
                    {/* Tabs */}
                    <div className="flex gap-1 pt-3 pb-2">
                      {['Propios', 'Guardados', 'Comunidad'].map((tab, i) => (
                        <button key={tab} onClick={() => setSheetTab(i as 0 | 1 | 2)}
                          className={`text-[10px] px-3 py-1.5 rounded-full font-bold transition-colors ${sheetTab === i ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                          {tab}
                        </button>
                      ))}
                    </div>
                    {/* Search */}
                    <div className="pb-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input className="input-kiki text-sm pl-9" placeholder="Buscar ejercicio…"
                          value={sheetSearch} onChange={e => setSheetSearch(e.target.value)} />
                      </div>
                    </div>
                    {sheetExercises.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No se encontraron ejercicios.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sheetExercises.map(ex => (
                          <button key={ex.id} onClick={() => loadSheetExDetail(ex.id)}
                            className="w-full text-left p-3 rounded-xl border border-border bg-card hover:border-mint-300 hover:bg-mint-50/30 transition-colors flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-mint-50 flex items-center justify-center text-lg shrink-0">🏋️</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{ex.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {ex.target_area || 'General'}{ex.duration ? ` · ${ex.duration}min` : ''}
                              </p>
                            </div>
                            <Plus size={16} className="text-mint-600 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-2 space-y-4">
                    <button onClick={() => setSelectedSheetExId(null)} className="text-xs font-bold text-mint-700 flex items-center gap-1">
                      <ArrowLeft size={14} /> Volver al listado
                    </button>
                    
                    {!sheetExDetail ? (
                      <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" /></div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                          <h4 className="text-base font-bold text-navy">{sheetExDetail.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{sheetExDetail.target_area || 'General'}</p>
                          <div className="mt-3 space-y-2">
                            <p className="text-[11px] font-bold text-muted-foreground uppercase">Instrucciones</p>
                            <p className="text-xs leading-relaxed">{sheetExDetail.description || sheetExDetail.instructions || 'Sin instrucciones adicionales.'}</p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => addExercise({
                            id: sheetExDetail.id,
                            name: sheetExDetail.name || sheetExDetail.clinical_name,
                            duration: sheetExDetail.duration || 5,
                            sets: sheetExDetail.sets || 3,
                            reps: sheetExDetail.reps || '10 repeticiones',
                            target_area: sheetExDetail.target_area || sheetExDetail.area
                          })}
                          className="btn-primary w-full py-4 text-sm font-bold shadow-mint-lg"
                        >
                          Agregar a este plan
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
