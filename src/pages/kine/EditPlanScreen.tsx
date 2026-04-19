import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Check, Save, ChevronUp, ChevronDown, Search, Heart, CheckCircle2 } from 'lucide-react';
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

    // Get all user exercises (Propios)
    const { data: exercises } = await supabase.from('exercises')
      .select('id, name, duration, sets, reps, target_area, created_by')
      .eq('created_by', user.id);
    const exList = exercises || [];
    setAvailableExercises(exList);

    // Get saved exercises
    const { data: savedEx } = await supabase.from('saved_exercises')
      .select('exercise_id')
      .eq('user_id', user.id);
    const savedIds = (savedEx || []).map(s => s.exercise_id);
    
    let savedExList: ExerciseOption[] = [];
    if (savedIds.length > 0) {
      // First try community_exercises
      const { data: sCommEx } = await supabase.from('community_exercises')
        .select('id, clinical_name, area')
        .in('id', savedIds);
      
      const commItems = (sCommEx || []).map(e => ({
        id: e.id,
        name: e.clinical_name,
        duration: 5,
        sets: 3,
        reps: '10 repeticiones',
        target_area: e.area,
      }));

      // Then try exercises (if they saved a private one, though less common)
      const { data: sPrivEx } = await supabase.from('exercises')
        .select('id, name, duration, sets, reps, target_area')
        .in('id', savedIds.filter(id => !commItems.some(c => c.id === id)));
      
      const privItems = (sPrivEx || []).map(e => ({
        id: e.id,
        name: e.name,
        duration: e.duration || 5,
        sets: e.sets || 3,
        reps: e.reps || '10 repeticiones',
        target_area: e.target_area,
      }));

      savedExList = [...commItems, ...privItems];
    }
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
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 z-40" 
              onClick={() => setShowSheet(false)} 
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
              style={{ height: '75vh' }}
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 mb-2 shrink-0" />
              
              {/* Sheet header */}
              <div className="flex items-center px-6 py-2 shrink-0">
                <h3 className="text-xl font-bold text-navy flex-1">
                  {selectedSheetExId ? 'Detalle del ejercicio' : 'Agregar ejercicio'}
                </h3>
                <button 
                  onClick={() => setShowSheet(false)} 
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Sheet Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-24">
                {!selectedSheetExId ? (
                  <div className="space-y-4 pt-2">
                    {/* Tabs */}
                    <div className="flex p-1 bg-muted rounded-2xl">
                      {['Propios', 'Guardados', 'Comunidad'].map((tab, i) => (
                        <button 
                          key={tab} 
                          onClick={() => setSheetTab(i as 0 | 1 | 2)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${sheetTab === i ? 'bg-background text-mint-700 shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="relative group">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-mint-500 transition-colors" />
                      <input 
                        className="input-kiki pl-12 h-12 bg-muted/50 border-transparent focus:bg-background" 
                        placeholder="Buscar ejercicio por nombre o área…"
                        value={sheetSearch} 
                        onChange={e => setSheetSearch(e.target.value)} 
                      />
                    </div>

                    {/* Exercise List */}
                    {sheetExercises.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                          <Search size={32} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No se encontraron ejercicios en esta categoría.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-4">
                        {sheetExercises.map(ex => (
                          <motion.button 
                            layoutId={ex.id}
                            key={ex.id} 
                            onClick={() => loadSheetExDetail(ex.id)}
                            className="w-full text-left p-4 rounded-2xl border border-border bg-card hover:border-mint-200 hover:bg-mint-50/20 transition-all flex items-center gap-4 group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-mint-50 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                              🏋️
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-navy truncate">{ex.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {ex.target_area || 'General'} · {ex.duration || 5} min
                              </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-mint-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus size={18} className="text-mint-700" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 space-y-6">
                    <button 
                      onClick={() => setSelectedSheetExId(null)} 
                      className="text-sm font-bold text-mint-700 flex items-center gap-2 hover:translate-x-1 transition-transform"
                    >
                      <ArrowLeft size={16} /> Volver al listado
                    </button>
                    
                    {!sheetExDetail ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="w-10 h-10 border-3 border-mint border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground animate-pulse">Cargando detalles...</p>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-2xl font-bold text-navy leading-tight">{sheetExDetail.name || sheetExDetail.clinical_name}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                                  {sheetExDetail.target_area || sheetExDetail.area || 'General'}
                                </span>
                                {sheetExDetail.gmfcs && (
                                  <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-100">
                                    GMFCS {sheetExDetail.gmfcs}
                                  </span>
                                )}
                              </div>
                            </div>
                            {sheetExDetail.created_by === user?.id && (
                              <button 
                                onClick={() => navigate(`/kine/exercises/edit/${sheetExDetail.id}`)}
                                className="px-4 py-2 rounded-xl border-2 border-mint text-mint-700 text-xs font-bold hover:bg-mint-50 transition-colors shrink-0"
                              >
                                Editar
                              </button>
                            )}
                          </div>

                          <KikiCard className="!p-5 bg-muted/20 border-transparent space-y-3">
                            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-mint-600" /> Instrucciones del terapeuta
                            </h5>
                            <p className="text-sm leading-relaxed text-navy/80 italic">
                              "{sheetExDetail.description || sheetExDetail.instructions || 'Sin instrucciones adicionales.'}"
                            </p>
                          </KikiCard>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-card p-3 rounded-2xl border border-border text-center">
                              <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Duración</p>
                              <p className="text-sm font-bold text-navy">{sheetExDetail.duration || 5} min</p>
                            </div>
                            <div className="bg-card p-3 rounded-2xl border border-border text-center">
                              <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Series</p>
                              <p className="text-sm font-bold text-navy">{sheetExDetail.sets || 3}</p>
                            </div>
                            <div className="bg-card p-3 rounded-2xl border border-border text-center">
                              <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Reps</p>
                              <p className="text-sm font-bold text-navy truncate px-1">{sheetExDetail.reps || '10'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="sticky bottom-0 bg-background pt-4 pb-2">
                          <button 
                            onClick={() => addExercise({
                              id: sheetExDetail.id,
                              name: sheetExDetail.name || sheetExDetail.clinical_name,
                              duration: sheetExDetail.duration || 5,
                              sets: sheetExDetail.sets || 3,
                              reps: sheetExDetail.reps || '10 repeticiones',
                              target_area: sheetExDetail.target_area || sheetExDetail.area
                            })}
                            className="btn-primary w-full py-4 text-sm font-bold shadow-mint-lg flex items-center justify-center gap-2"
                          >
                            <Plus size={18} /> Agregar a este plan
                          </button>
                        </div>
                      </motion.div>
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
