import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X as LucideX, Star, Heart, Edit, Trash2, Users, Play, MoreVertical, UserPlus, BookmarkMinus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const tabs = ['Propios', 'Guardados', 'Comunidad'];

const tabDescriptions: Record<string, string> = {
  'Propios': 'Ejercicios que creaste para tu práctica clínica.',
  'Guardados': 'Ejercicios de la comunidad que guardaste para acceder rápido.',
  'Comunidad': 'Ejercicios compartidos por terapeutas de toda Argentina.',
};

const evidenceBadgeColors: Record<string, string> = {
  'Guía clínica': 'bg-mint-100 text-mint-700',
  'Práctica común': 'bg-blue-50 text-blue-brand',
  'Adaptación': 'bg-amber-100 text-amber-700',
};

interface CommunityExercise {
  id: string;
  clinical_name: string;
  simple_name: string | null;
  gmfcs: string | null;
  category: string | null;
  area: string | null;
  evidence: string | null;
  adherence: number | null;
  icon: string | null;
  validated: boolean | null;
  rating: number | null;
  reviews: number | null;
  author_name: string;
  author_city: string | null;
  instructions: string | null;
  description: string | null;
  video_url: string | null;
}

interface MyExercise {
  id: string;
  name: string;
  description: string | null;
  target_area: string | null;
  duration: number | null;
  sets: number | null;
  reps: string | null;
  video_url: string | null;
  is_community: boolean | null;
}

interface Protocol {
  id: string;
  name: string;
  description: string | null;
  frequency: string | null;
  is_community: boolean | null;
  exerciseCount: number;
}

interface PatientOption {
  linkId: string;
  childId: string;
  childName: string;
}

function AdherenceBars({ percent }: { percent: number }) {
  const color = percent >= 70 ? 'bg-mint' : percent >= 50 ? 'bg-gold' : 'bg-rust';
  return (
    <div className="flex items-center gap-1">
      <div className="flex-1 h-1.5 rounded-full bg-muted">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[10px] font-medium text-muted-foreground">{percent}%</span>
    </div>
  );
}

function CommunityCard({ item, isFav, onToggleFav, onClick }: { item: CommunityExercise; isFav: boolean; onToggleFav: () => void; onClick: () => void }) {
  return (
    <KikiCard onClick={onClick} className="relative">
      <button onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        className="absolute top-2 right-2 z-10" aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
        <Heart size={16} className={isFav ? 'text-red-500 fill-red-500' : 'text-muted-foreground'} />
      </button>
      {item.evidence && (
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${evidenceBadgeColors[item.evidence] || 'bg-muted text-muted-foreground'}`}>
          {item.evidence}
        </span>
      )}
      <div className="text-2xl mb-1 mt-1">{item.icon || '🏋️'}</div>
      <p className="text-xs font-semibold text-foreground leading-tight">{item.clinical_name}</p>
      {item.simple_name && <p className="text-[10px] text-muted-foreground mt-0.5 italic">{item.simple_name}</p>}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {item.gmfcs && <span className="text-[8px] px-1 py-0.5 rounded-full bg-muted text-muted-foreground">GMFCS {item.gmfcs}</span>}
        {item.category && <span className="text-[8px] px-1 py-0.5 rounded-full bg-muted text-muted-foreground">{item.category}</span>}
        <span className={`text-[8px] px-1 py-0.5 rounded-full ${item.validated ? 'bg-mint-100 text-mint-700' : 'bg-muted text-muted-foreground'}`}>
          {item.validated ? '✓ Validado' : 'Sin validar'}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-1.5">
        <Star size={9} className="text-gold fill-gold" />
        <span className="text-[10px] font-medium">{item.rating?.toFixed(1) || '—'}</span>
        <span className="text-[10px] text-muted-foreground">({item.reviews || 0})</span>
      </div>
      {item.adherence != null && (
        <div className="mt-1.5"><AdherenceBars percent={item.adherence} /></div>
      )}
    </KikiCard>
  );
}

export default function ExerciseLibraryScreen() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [communityExercises, setCommunityExercises] = useState<CommunityExercise[]>([]);
  const [myExercises, setMyExercises] = useState<MyExercise[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedExercise, setSelectedExercise] = useState<CommunityExercise | null>(null);
  const [selectedMyEx, setSelectedMyEx] = useState<MyExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [evidenceFilter, setEvidenceFilter] = useState<string | null>(null);
  // Context menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  // Assign modal (two steps)
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null); // exercise_id
  const [assignStep, setAssignStep] = useState<1 | 2>(1);
  const [assignPatient, setAssignPatient] = useState<PatientOption | null>(null);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [assigningTo, setAssigningTo] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split('T')[0]);
  const [existingExercisesOnDate, setExistingExercisesOnDate] = useState<any[]>([]);

  const openAssign = (exerciseId: string) => {
    setShowAssignModal(exerciseId);
    setAssignStep(1);
    setAssignPatient(null);
    setPatientSearch('');
    setOpenMenuId(null);
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  useEffect(() => {
    if (showAssignModal && assignPatient && assignDate) {
      loadExistingExercises();
    }
  }, [showAssignModal, assignPatient, assignDate]);

  const loadExistingExercises = async () => {
    if (!assignPatient || !assignDate) return;
    const dateObj = new Date(assignDate);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday
    
    const { data } = await supabase
      .from('treatment_plans')
      .select('exercise_id, exercises(name)')
      .eq('child_id', assignPatient.childId)
      .eq('active', true)
      .contains('day_of_week', [dayOfWeek]);
    
    setExistingExercisesOnDate(data || []);
  };

  const loadData = async () => {
    if (!user) return;

    const [ceRes, meRes, favRes, protoRes, linksRes] = await Promise.all([
      supabase.from('community_exercises').select('*').order('rating', { ascending: false }),
      supabase.from('exercises').select('*').eq('created_by', user.id),
      supabase.from('saved_exercises').select('exercise_id').eq('user_id', user.id),
      supabase.from('protocols').select('*').eq('created_by', user.id),
      supabase.from('therapist_caregiver_links').select('id, child_id').eq('therapist_id', user.id).eq('status', 'active'),
    ]);

    setCommunityExercises(ceRes.data || []);
    setMyExercises(meRes.data || []);
    setFavoriteIds(new Set((favRes.data || []).map(f => f.exercise_id)));

    // Load protocol exercise counts
    const protos = protoRes.data || [];
    if (protos.length > 0) {
      const { data: peCounts } = await supabase
        .from('protocol_exercises')
        .select('protocol_id')
        .in('protocol_id', protos.map(p => p.id));
      const countMap = new Map<string, number>();
      (peCounts || []).forEach(pe => countMap.set(pe.protocol_id, (countMap.get(pe.protocol_id) || 0) + 1));
      setProtocols(protos.map(p => ({ ...p, exerciseCount: countMap.get(p.id) || 0 })));
    } else {
      setProtocols([]);
    }

    // Load patients for assignment
    const links = linksRes.data || [];
    if (links.length > 0) {
      const childIds = links.map(l => l.child_id).filter(Boolean) as string[];
      if (childIds.length > 0) {
        const { data: children } = await supabase.from('children').select('id, name').in('id', childIds);
        const childMap = new Map((children || []).map(c => [c.id, c.name]));
        setPatients(links.filter(l => l.child_id).map(l => ({
          linkId: l.id,
          childId: l.child_id!,
          childName: childMap.get(l.child_id!) || 'Paciente',
        })));
      }
    }

    setLoading(false);
  };

  const toggleFavorite = async (exerciseId: string) => {
    if (!user) return;
    const isFav = favoriteIds.has(exerciseId);
    if (isFav) {
      await supabase.from('saved_exercises').delete().eq('user_id', user.id).eq('exercise_id', exerciseId);
      setFavoriteIds(prev => { const n = new Set(prev); n.delete(exerciseId); return n; });
      toast('Quitado de favoritos');
    } else {
      await supabase.from('saved_exercises').insert({ user_id: user.id, exercise_id: exerciseId });
      setFavoriteIds(prev => new Set(prev).add(exerciseId));
      toast('Agregado a favoritos ❤️');
    }
  };

  const handleDeleteExercise = async (exId: string) => {
    await supabase.from('treatment_plans').delete().eq('exercise_id', exId);
    await supabase.from('protocol_exercises').delete().eq('exercise_id', exId);
    await supabase.from('exercises').delete().eq('id', exId);
    setMyExercises(prev => prev.filter(e => e.id !== exId));
    setSelectedMyEx(null);
    setDeleteTarget(null);
    toast.success('Ejercicio eliminado');
  };

  const handleShareExercise = async (exId: string) => {
    await supabase.from('exercises').update({ is_community: true }).eq('id', exId);
    setMyExercises(prev => prev.map(e => e.id === exId ? { ...e, is_community: true } : e));
    toast.success('Ejercicio compartido a la comunidad');
  };

  const handleAssignExercise = async () => {
    if (!user || !showAssignModal || !assignPatient) return;
    setAssigningTo(assignPatient.childId);
    
    const dateObj = new Date(assignDate);
    const dayOfWeek = dateObj.getDay();

    const { error } = await supabase.from('treatment_plans').insert({
      child_id: assignPatient.childId,
      therapist_id: user.id,
      exercise_id: showAssignModal,
      day_of_week: [dayOfWeek],
      active: true,
    });
    
    if (error) {
      toast.error('Error al asignar: ' + error.message);
    } else {
      toast.success(`Ejercicio agregado al plan de ${assignPatient.childName}`);
      setShowAssignModal(null);
    }
    setAssigningTo(null);
  };

  const handleDeleteProtocol = async (protoId: string) => {
    if (!confirm('¿Eliminar este protocolo?')) return;
    await supabase.from('protocols').delete().eq('id', protoId);
    setProtocols(prev => prev.filter(p => p.id !== protoId));
    toast.success('Protocolo eliminado');
  };

  const filteredCommunity = communityExercises.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      const match = e.clinical_name.toLowerCase().includes(q) || (e.simple_name || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (evidenceFilter && e.evidence !== evidenceFilter) return false;
    return true;
  });

  const filteredMyExercises = myExercises.filter(e => {
    if (!search) return true;
    return e.name.toLowerCase().includes(search.toLowerCase()) || (e.target_area || '').toLowerCase().includes(search.toLowerCase());
  });

  const favoriteExercises = communityExercises.filter(e => favoriteIds.has(e.id));

  const communityCount = communityExercises.length;
  const authorCount = new Set(communityExercises.map(e => e.author_name)).size;

  return (
    <AppShell>
      <div className="px-4 pt-4 flex items-center gap-3">
        <h1 className="text-lg font-semibold flex-1">Biblioteca de ejercicios</h1>
        <button onClick={() => navigate('/kine/exercises/create')} className="btn-primary text-xs py-2 px-3">
          <Plus size={12} className="inline mr-1" /> Crear
        </button>
      </div>

      <div className="flex gap-1 px-4 pt-3 overflow-x-auto pb-1">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 font-medium transition-colors ${activeTab === i ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
            {tab === 'Favoritos' && <Heart size={10} className="inline mr-1" />}
            {tab}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground px-4 pt-1">{tabDescriptions[tabs[activeTab]]}</p>

      <div className="px-4 pt-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-kiki pl-9 text-sm" placeholder="Buscá por nombre, área o técnica…" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Propios */}
            {activeTab === 0 && (
              filteredMyExercises.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-3xl mb-3">📝</p>
                  <h3 className="font-semibold">Todavía no creaste ejercicios propios</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">Creá tu primer ejercicio y guardalo en tu biblioteca personal</p>
                  <button onClick={() => navigate('/kine/exercises/create')} className="btn-primary text-sm">Crear mi primer ejercicio</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMyExercises.map(ex => (
                    <KikiCard key={ex.id} className="cursor-pointer relative">
                      <div className="flex items-center gap-3" onClick={() => navigate(`/kine/exercise/${ex.id}`)}>
                        <div className="w-10 h-10 rounded-lg bg-mint-50 flex items-center justify-center text-xl">🏋️</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ex.name}</p>
                          <p className="text-[10px] text-muted-foreground">{ex.target_area || 'General'} · {ex.duration || 5} min · {ex.sets || 3} series</p>
                        </div>
                      </div>
                      {/* Three-dot menu for own exercises */}
                      <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === ex.id ? null : ex.id); }}
                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted" aria-label="Opciones">
                        <MoreVertical size={15} className="text-muted-foreground" />
                      </button>
                      {openMenuId === ex.id && (
                        <div className="absolute top-8 right-2 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[170px]">
                          <button onClick={() => { setOpenMenuId(null); navigate(`/kine/exercise/${ex.id}`); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                            <Play size={13} /> Ver detalle
                          </button>
                          <button onClick={() => { setOpenMenuId(null); navigate(`/kine/exercises/edit/${ex.id}`); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                            <Edit size={13} /> Editar
                          </button>
                          <button onClick={() => { setOpenMenuId(null); openAssign(ex.id); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                            <UserPlus size={13} /> Asignar a paciente
                          </button>
                          <div className="border-t border-border my-1" />
                          <button onClick={() => { setOpenMenuId(null); setDeleteTarget(ex.id); }}
                            className="w-full text-left px-4 py-2 text-sm text-rust hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={13} /> Eliminar
                          </button>
                        </div>
                      )}
                    </KikiCard>
                  ))}
                </div>
              )
            )}

            {/* Guardados */}
            {activeTab === 1 && (
              favoriteExercises.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Heart size={32} className="text-muted-foreground mb-3" />
                  <h3 className="font-semibold">Sin guardados</h3>
                  <p className="text-sm text-muted-foreground mt-1">Guardá ejercicios de la comunidad para tenerlos a mano.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {favoriteExercises.map(item => (
                    <div key={item.id} className="relative">
                      <CommunityCard item={item} isFav={true}
                        onToggleFav={() => toggleFavorite(item.id)} onClick={() => navigate(`/kine/exercise/${item.id}`)} />
                      <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === `f-${item.id}` ? null : `f-${item.id}`); }}
                        className="absolute bottom-2 right-2 p-1 rounded-full bg-muted/80 hover:bg-muted" aria-label="Opciones">
                        <MoreVertical size={12} className="text-muted-foreground" />
                      </button>
                      {openMenuId === `f-${item.id}` && (
                        <div className="absolute bottom-8 right-2 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[170px]">
                          <button onClick={() => { setOpenMenuId(null); navigate(`/kine/exercise/${item.id}`); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                            <Play size={13} /> Ver detalle
                          </button>
                          <button onClick={() => { setOpenMenuId(null); openAssign(item.id); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                            <UserPlus size={13} /> Asignar a paciente
                          </button>
                          <button onClick={() => { setOpenMenuId(null); toggleFavorite(item.id); }}
                            className="w-full text-left px-4 py-2 text-sm text-rust hover:bg-red-50 flex items-center gap-2">
                            <BookmarkMinus size={13} /> Quitar de guardados
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Comunidad */}
            {activeTab === 2 && (
              <div className="space-y-3">
                <KikiCard className="bg-gradient-to-r from-mint-50 to-blue-50">
                  <h3 className="text-sm font-semibold">Comunidad KikiCare</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ejercicios compartidos por terapeutas de toda Argentina.</p>
                </KikiCard>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {['Guía clínica', 'Práctica común', 'Adaptación'].map(ev => (
                    <button key={ev} onClick={() => setEvidenceFilter(evidenceFilter === ev ? null : ev)}
                      className={`text-[10px] px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${evidenceFilter === ev ? evidenceBadgeColors[ev] : 'bg-muted text-muted-foreground'}`}>
                      {ev}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filteredCommunity.map(item => (
                    <div key={item.id} className="relative">
                      <CommunityCard item={item} isFav={favoriteIds.has(item.id)}
                        onToggleFav={() => toggleFavorite(item.id)} onClick={() => navigate(`/kine/exercise/${item.id}`)} />
                      <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === `c-${item.id}` ? null : `c-${item.id}`); }}
                        className="absolute bottom-2 right-2 p-1 rounded-full bg-muted/80 hover:bg-muted" aria-label="Opciones">
                        <MoreVertical size={12} className="text-muted-foreground" />
                      </button>
                      {openMenuId === `c-${item.id}` && (
                        <div className="absolute bottom-8 right-2 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[170px]">
                          <button onClick={() => { setOpenMenuId(null); navigate(`/kine/exercise/${item.id}`); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                            <Play size={13} /> Ver detalle
                          </button>
                          <button onClick={() => { setOpenMenuId(null); toggleFavorite(item.id); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                            <Heart size={13} className={favoriteIds.has(item.id) ? 'fill-red-500 text-red-500' : ''} /> {favoriteIds.has(item.id) ? 'Quitar de favoritos' : 'Guardar en guardados'}
                          </button>
                          <button onClick={() => { setOpenMenuId(null); openAssign(item.id); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                            <UserPlus size={13} /> Asignar a paciente
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>



      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-[60] px-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-xl p-6 w-full max-w-[320px] shadow-kiki-lg">
            <h3 className="font-bold text-center text-base mb-2">¿Eliminar este ejercicio?</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">
              Esta acción no se puede deshacer. Si el ejercicio está asignado a pacientes activos, se eliminará de sus planes futuros.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={() => handleDeleteExercise(deleteTarget)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Assign to patient modal (two steps) */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-[60] px-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-xl p-5 w-full max-w-[340px] shadow-kiki-lg">

            {assignStep === 1 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold flex-1">Elegir paciente</h3>
                  <button onClick={() => setShowAssignModal(null)}><LucideX size={18} className="text-muted-foreground" /></button>
                </div>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input className="input-kiki text-sm pl-8" placeholder="Buscar paciente…" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                </div>
                {patients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No tenés pacientes vinculados.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {patients.filter(p => p.childName.toLowerCase().includes(patientSearch.toLowerCase())).map(p => (
                      <button key={p.childId} onClick={() => { setAssignPatient(p); setAssignStep(2); }}
                        className="w-full text-left px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-mint flex items-center justify-center text-navy font-bold text-xs shrink-0">
                          {p.childName[0]}
                        </div>
                        {p.childName}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {assignStep === 2 && assignPatient && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setAssignStep(1)} className="text-muted-foreground">
                    <ArrowLeft size={16} />
                  </button>
                  <h3 className="font-semibold flex-1 text-sm">Agregar al plan de {assignPatient.childName}</h3>
                </div>
                
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Fecha del plan</label>
                    <input type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)} 
                      className="input-kiki text-sm font-medium" />
                  </div>

                  <div className="p-3 rounded-xl bg-mint-50/50 border border-mint-100">
                    <p className="text-[10px] font-bold text-mint-700 uppercase mb-2">Ya planificados para esta fecha:</p>
                    {existingExercisesOnDate.length > 0 ? (
                      <div className="space-y-1">
                        {existingExercisesOnDate.map((ex, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-medium text-navy">
                            <CheckCircle2 size={12} className="text-mint-600" /> {ex.exercises?.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">No hay ejercicios asignados aún.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowAssignModal(null)} className="btn-ghost flex-1 text-sm">Cancelar</button>
                  <button onClick={handleAssignExercise} disabled={!!assigningTo}
                    className="btn-primary flex-1 text-sm disabled:opacity-50">
                    {assigningTo ? 'Agregando...' : 'Agregar al plan'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Overlay to close any open context menu */}
      {openMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
      )}
    </AppShell>
  );
}
