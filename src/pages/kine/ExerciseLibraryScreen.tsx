import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Star, Heart, Edit, Trash2, Users, Play } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const tabs = ['Mis ejercicios', 'Comunidad', 'Protocolos', 'Favoritos'];

const tabDescriptions: Record<string, string> = {
  'Mis ejercicios': 'Ejercicios que creaste para tu práctica clínica.',
  'Comunidad': 'Ejercicios compartidos por terapeutas de toda Argentina.',
  'Protocolos': 'Agrupaciones de ejercicios para aplicar a pacientes.',
  'Favoritos': 'Ejercicios de la comunidad que guardaste para acceder rápido.',
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
  // Assign to patient
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null); // exercise_id
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [assigningTo, setAssigningTo] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

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
    if (!confirm('¿Eliminar este ejercicio? Se quitará de todos los planes.')) return;
    await supabase.from('treatment_plans').delete().eq('exercise_id', exId);
    await supabase.from('protocol_exercises').delete().eq('exercise_id', exId);
    await supabase.from('exercises').delete().eq('id', exId);
    setMyExercises(prev => prev.filter(e => e.id !== exId));
    setSelectedMyEx(null);
    toast.success('Ejercicio eliminado');
  };

  const handleShareExercise = async (exId: string) => {
    await supabase.from('exercises').update({ is_community: true }).eq('id', exId);
    setMyExercises(prev => prev.map(e => e.id === exId ? { ...e, is_community: true } : e));
    toast.success('Ejercicio compartido a la comunidad');
  };

  const handleAssignExercise = async (exerciseId: string, childId: string) => {
    if (!user) return;
    setAssigningTo(childId);
    const { error } = await supabase.from('treatment_plans').insert({
      child_id: childId,
      therapist_id: user.id,
      exercise_id: exerciseId,
      day_of_week: [1, 2, 3, 4, 5],
      active: true,
    });
    if (error) {
      toast.error('Error al asignar');
    } else {
      toast.success('Ejercicio asignado al paciente');
    }
    setAssigningTo(null);
    setShowAssignModal(null);
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
            {/* Mis ejercicios */}
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
                    <KikiCard key={ex.id} onClick={() => setSelectedMyEx(ex)} className="cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-mint-50 flex items-center justify-center text-xl">🏋️</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ex.name}</p>
                          <p className="text-[10px] text-muted-foreground">{ex.target_area || 'General'} · {ex.duration || 5} min · {ex.sets || 3} series</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {ex.video_url && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-mint-100 text-mint-700">📹</span>}
                          {ex.is_community && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-brand">🌐</span>}
                        </div>
                      </div>
                    </KikiCard>
                  ))}
                </div>
              )
            )}

            {/* Comunidad */}
            {activeTab === 1 && (
              <div className="space-y-3">
                <KikiCard className="bg-gradient-to-r from-mint-50 to-blue-50">
                  <h3 className="text-sm font-semibold">Comunidad KikiCare</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ejercicios compartidos por terapeutas de toda Argentina.</p>
                  <div className="flex gap-4 mt-2">
                    <div className="text-center"><p className="font-bold text-sm">{communityCount}</p><p className="text-[9px] text-muted-foreground">ejercicios</p></div>
                    <div className="text-center"><p className="font-bold text-sm">{authorCount}</p><p className="text-[9px] text-muted-foreground">terapeutas</p></div>
                  </div>
                </KikiCard>
                <div className="flex gap-1.5">
                  {['Guía clínica', 'Práctica común', 'Adaptación'].map(ev => (
                    <button key={ev} onClick={() => setEvidenceFilter(evidenceFilter === ev ? null : ev)}
                      className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${evidenceFilter === ev ? evidenceBadgeColors[ev] : 'bg-muted text-muted-foreground'}`}>
                      {ev}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filteredCommunity.map(item => (
                    <CommunityCard key={item.id} item={item} isFav={favoriteIds.has(item.id)}
                      onToggleFav={() => toggleFavorite(item.id)} onClick={() => setSelectedExercise(item)} />
                  ))}
                </div>
                {filteredCommunity.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No se encontraron ejercicios</p>
                )}
              </div>
            )}

            {/* Protocolos */}
            {activeTab === 2 && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button onClick={() => navigate('/kine/protocols/create')} className="btn-secondary text-xs py-1.5 px-3">
                    <Plus size={12} className="inline mr-1" /> Nuevo protocolo
                  </button>
                </div>
                {protocols.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <p className="text-3xl mb-3">📋</p>
                    <h3 className="font-semibold">Sin protocolos aún</h3>
                    <p className="text-sm text-muted-foreground mt-1">Agrupá ejercicios en protocolos para asignarlos rápido</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {protocols.map(proto => (
                      <KikiCard key={proto.id} className="relative">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl">📋</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{proto.name}</p>
                            <p className="text-[10px] text-muted-foreground">{proto.exerciseCount} ejercicios · {proto.frequency || 'Sin frecuencia'}</p>
                            {proto.description && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{proto.description}</p>}
                          </div>
                          <button onClick={() => handleDeleteProtocol(proto.id)} className="text-muted-foreground hover:text-rust p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </KikiCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favoritos */}
            {activeTab === 3 && (
              favoriteExercises.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Heart size={32} className="text-muted-foreground mb-3" />
                  <h3 className="font-semibold">Sin favoritos</h3>
                  <p className="text-sm text-muted-foreground mt-1">Guardá ejercicios de la comunidad tocando el ❤️</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {favoriteExercises.map(item => (
                    <CommunityCard key={item.id} item={item} isFav={true}
                      onToggleFav={() => toggleFavorite(item.id)} onClick={() => setSelectedExercise(item)} />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* My exercise detail panel */}
      {selectedMyEx && (
        <AnimatePresence>
          <motion.div className="fixed inset-0 bg-black/40 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMyEx(null)} />
          <motion.div className="fixed top-0 right-0 bottom-0 w-full max-w-[450px] bg-background z-50 overflow-y-auto shadow-2xl"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}>
            <div className="sticky top-0 bg-gradient-to-b from-mint-100 to-background p-4 pb-6">
              <button onClick={() => setSelectedMyEx(null)} className="w-8 h-8 rounded-full bg-card/80 flex items-center justify-center mb-4" aria-label="Cerrar">
                <X size={18} />
              </button>
              <h2 className="font-display text-xl text-foreground">{selectedMyEx.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">{selectedMyEx.target_area || 'General'} · {selectedMyEx.duration || 5} min · {selectedMyEx.sets || 3} series</p>
            </div>
            <div className="p-4 space-y-4">
              {selectedMyEx.description && (
                <KikiCard>
                  <h3 className="text-sm font-semibold mb-1">Descripción</h3>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedMyEx.description}</p>
                </KikiCard>
              )}
              {selectedMyEx.video_url && (
                <KikiCard>
                  <h3 className="text-sm font-semibold mb-2">Video</h3>
                  <video src={selectedMyEx.video_url} controls className="w-full rounded-lg" />
                </KikiCard>
              )}
            </div>
            <div className="sticky bottom-0 p-4 bg-background border-t border-border space-y-2">
              <button onClick={() => { setShowAssignModal(selectedMyEx.id); }} className="btn-primary w-full text-sm">
                Asignar a paciente
              </button>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/kine/exercises/edit/${selectedMyEx.id}`)} className="btn-secondary flex-1 text-xs py-2">
                  <Edit size={12} className="inline mr-1" /> Editar
                </button>
                {!selectedMyEx.is_community && (
                  <button onClick={() => handleShareExercise(selectedMyEx.id)} className="btn-secondary flex-1 text-xs py-2">
                    <Users size={12} className="inline mr-1" /> Compartir
                  </button>
                )}
                <button onClick={() => handleDeleteExercise(selectedMyEx.id)} className="flex-1 text-xs py-2 rounded-[10px] bg-rust/10 text-rust font-medium">
                  <Trash2 size={12} className="inline mr-1" /> Eliminar
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Community exercise detail panel */}
      {selectedExercise && (
        <AnimatePresence>
          <motion.div className="fixed inset-0 bg-black/40 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedExercise(null)} />
          <motion.div className="fixed top-0 right-0 bottom-0 w-full max-w-[450px] bg-background z-50 overflow-y-auto shadow-2xl"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}>
            <div className="sticky top-0 bg-gradient-to-b from-mint-100 to-background p-4 pb-6">
              <button onClick={() => setSelectedExercise(null)} className="w-8 h-8 rounded-full bg-card/80 flex items-center justify-center mb-4" aria-label="Cerrar">
                <X size={18} />
              </button>
              <p className="text-2xl mb-2">{selectedExercise.icon || '🏋️'}</p>
              <h2 className="font-display text-xl text-foreground">{selectedExercise.clinical_name}</h2>
              {selectedExercise.simple_name && <p className="text-sm text-muted-foreground italic mt-1">{selectedExercise.simple_name}</p>}
            </div>
            <div className="p-4 space-y-4">
              {selectedExercise.description && (
                <KikiCard>
                  <h3 className="text-sm font-semibold mb-1">Descripción</h3>
                  <p className="text-xs text-muted-foreground">{selectedExercise.description}</p>
                </KikiCard>
              )}
              {selectedExercise.instructions && (
                <KikiCard>
                  <h3 className="text-sm font-semibold mb-1">Instrucciones</h3>
                  <p className="text-xs text-muted-foreground">{selectedExercise.instructions}</p>
                </KikiCard>
              )}
              {selectedExercise.video_url && (
                <KikiCard>
                  <h3 className="text-sm font-semibold mb-2">Video</h3>
                  <video src={selectedExercise.video_url} controls className="w-full rounded-lg" />
                </KikiCard>
              )}
              <div className="text-xs text-muted-foreground">
                <p>Autor: {selectedExercise.author_name} {selectedExercise.author_city ? `· ${selectedExercise.author_city}` : ''}</p>
              </div>
            </div>
            <div className="sticky bottom-0 p-4 bg-background border-t border-border space-y-2">
              <button onClick={() => setShowAssignModal(selectedExercise.id)} className="btn-primary w-full text-sm">Agregar al plan de un paciente</button>
              <button onClick={() => toggleFavorite(selectedExercise.id)} className="btn-secondary w-full text-xs py-2">
                <Heart size={12} className={`inline mr-1 ${favoriteIds.has(selectedExercise.id) ? 'fill-red-500 text-red-500' : ''}`} />
                {favoriteIds.has(selectedExercise.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Assign to patient modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-[60] px-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-xl p-6 w-full max-w-[320px] shadow-kiki-lg">
            <h3 className="font-semibold text-center mb-4">Asignar a paciente</h3>
            {patients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mb-4">No tenés pacientes vinculados.</p>
            ) : (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {patients.map(p => (
                  <button key={p.childId} onClick={() => handleAssignExercise(showAssignModal, p.childId)}
                    disabled={assigningTo === p.childId}
                    className="w-full text-left px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50">
                    {p.childName}
                    {assigningTo === p.childId && <span className="text-xs text-muted-foreground ml-2">Asignando...</span>}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowAssignModal(null)} className="btn-ghost w-full text-sm">Cancelar</button>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
