import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Star, Bookmark, Heart, Upload, Check, Info } from 'lucide-react';
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
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedExercise, setSelectedExercise] = useState<CommunityExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [evidenceFilter, setEvidenceFilter] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load community exercises
    const { data: ce } = await supabase.from('community_exercises').select('*').order('rating', { ascending: false });
    setCommunityExercises(ce || []);

    // Load my exercises
    const { data: me } = await supabase.from('exercises').select('*').eq('created_by', user.id).eq('is_community', false);
    setMyExercises(me || []);

    // Load favorites
    const { data: favs } = await supabase.from('saved_exercises').select('exercise_id').eq('user_id', user.id);
    setFavoriteIds(new Set((favs || []).map(f => f.exercise_id)));

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

  const filteredCommunity = communityExercises.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      const match = e.clinical_name.toLowerCase().includes(q) || (e.simple_name || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (evidenceFilter && e.evidence !== evidenceFilter) return false;
    return true;
  });

  const favoriteExercises = communityExercises.filter(e => favoriteIds.has(e.id));

  return (
    <AppShell>
      <div className="px-4 pt-4 flex items-center gap-3">
        <h1 className="text-lg font-semibold flex-1">Biblioteca de ejercicios</h1>
        <button onClick={() => navigate('/kine/exercises/create')} className="btn-primary text-xs py-2 px-3">
          <Plus size={12} className="inline mr-1" /> Crear
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 overflow-x-auto pb-1">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 font-medium transition-colors ${activeTab === i ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
            {tab === 'Favoritos' && <Heart size={10} className="inline mr-1" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab description */}
      <p className="text-[10px] text-muted-foreground px-4 pt-1">{tabDescriptions[tabs[activeTab]]}</p>

      {/* Search */}
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
              myExercises.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-3xl mb-3">📝</p>
                  <h3 className="font-semibold">Todavía no creaste ejercicios propios</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">Creá tu primer ejercicio y guardalo en tu biblioteca personal</p>
                  <button onClick={() => navigate('/kine/exercises/create')} className="btn-primary text-sm">Crear mi primer ejercicio</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {myExercises.map(ex => (
                    <KikiCard key={ex.id}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-mint-50 flex items-center justify-center text-xl">🏋️</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ex.name}</p>
                          <p className="text-[10px] text-muted-foreground">{ex.target_area || 'General'} · {ex.duration || 5} min · {ex.sets || 3} series</p>
                        </div>
                        {ex.video_url && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-mint-100 text-mint-700">📹 Video</span>}
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
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ejercicios compartidos por terapeutas de toda Argentina. Podés guardarlos en favoritos o asignarlos a un paciente.</p>
                  <div className="flex gap-4 mt-2">
                    <div className="text-center"><p className="font-bold text-sm">{communityExercises.length}</p><p className="text-[9px] text-muted-foreground">ejercicios</p></div>
                    <div className="text-center"><p className="font-bold text-sm">8</p><p className="text-[9px] text-muted-foreground">terapeutas</p></div>
                  </div>
                </KikiCard>
                {/* Evidence filter */}
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
                <div className="flex flex-col items-center py-8 text-center">
                  <p className="text-3xl mb-3">📋</p>
                  <h3 className="font-semibold">Sin protocolos aún</h3>
                  <p className="text-sm text-muted-foreground mt-1">Agrupá ejercicios en protocolos para asignarlos rápido</p>
                </div>
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

      {/* Detail panel */}
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
              <div className="text-xs text-muted-foreground">
                <p>Autor: {selectedExercise.author_name} {selectedExercise.author_city ? `· ${selectedExercise.author_city}` : ''}</p>
              </div>
            </div>
            <div className="sticky bottom-0 p-4 bg-background border-t border-border space-y-2">
              <button className="btn-primary w-full text-sm">Agregar al plan de un paciente</button>
              <button onClick={() => toggleFavorite(selectedExercise.id)} className="btn-secondary w-full text-xs py-2">
                <Heart size={12} className={`inline mr-1 ${favoriteIds.has(selectedExercise.id) ? 'fill-red-500 text-red-500' : ''}`} />
                {favoriteIds.has(selectedExercise.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </AppShell>
  );
}
