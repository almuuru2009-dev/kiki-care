import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Search, X, Star, BookOpen, Users, Bookmark, Check, ChevronRight } from 'lucide-react';
import { KikiCard } from '@/components/kiki/KikiComponents';

const tabs = ['Mis ejercicios', 'Comunidad', 'Protocolos', 'Guardados'];

const evidenceBadgeColors: Record<string, string> = {
  'Guía clínica': 'bg-mint-100 text-mint-700',
  'Práctica común': 'bg-blue-50 text-blue-brand',
  'Adaptación': 'bg-amber-100 text-amber-700',
};

const communityExercises = [
  { id: 'com-1', clinicalName: 'Elongación asistida de psoas en colchoneta', simpleName: 'Estiramiento de cadera acostado', gmfcs: 'II–IV', category: 'Elongación', area: 'MMII', ageRange: '2–18 años', evidence: 'Guía clínica', adherence: 85, icon: '🦿', validated: true, rating: 4.9, reviews: 18, author: 'Lic. Ana R.', city: 'CABA' },
  { id: 'com-2', clinicalName: 'Fortalecimiento de glúteos en decúbito lateral', simpleName: 'Ejercicios de cadera de lado', gmfcs: 'II–III', category: 'Fortalecimiento', area: 'MMII', ageRange: '3–12 años', evidence: 'Adaptación', adherence: 72, icon: '💪', validated: false, rating: 4.1, reviews: 7, author: 'Anónimo', city: 'Córdoba' },
  { id: 'com-3', clinicalName: 'Activación de estabilizadores de tronco en sedestación', simpleName: 'Ejercicios de equilibrio sentado', gmfcs: 'II–III', category: 'Control postural', area: 'Tronco', ageRange: '3–12 años', evidence: 'Guía clínica', adherence: 84, icon: '🧘', validated: true, rating: 4.7, reviews: 23, author: 'Lic. Martín G.', city: 'Rosario' },
  { id: 'com-4', clinicalName: 'Facilitación del patrón de marcha en bipedestación asistida', simpleName: 'Práctica de pasos con apoyo', gmfcs: 'I–III', category: 'Marcha', area: 'Global', ageRange: '2–10 años', evidence: 'Práctica común', adherence: 41, icon: '🚶', validated: false, rating: 3.8, reviews: 5, author: 'Lic. Sofía L.', city: 'Mendoza' },
];

const sampleProtocols = [
  { id: 'proto-1', name: 'Tronco y transferencias', subtitle: 'GMFCS III · 2–4 años', exercises: 5, duration: '~25 min', frequency: '3 veces/semana', adherence: 72, icon: '🏋️' },
  { id: 'proto-2', name: 'Función de mano bilateral', subtitle: 'GMFCS I–II · 3–8 años', exercises: 4, duration: '~20 min', frequency: '5 veces/semana', adherence: 88, icon: '✋' },
];

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

function CommunityCard({ item, onClick }: { item: typeof communityExercises[0]; onClick: () => void }) {
  return (
    <KikiCard onClick={onClick} className="relative">
      <span className={`absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${evidenceBadgeColors[item.evidence] || 'bg-muted text-muted-foreground'}`}>
        {item.evidence}
      </span>
      <div className="text-2xl mb-2">{item.icon}</div>
      <p className="text-sm font-semibold text-foreground leading-tight">{item.clinicalName}</p>
      {item.simpleName && <p className="text-xs text-muted-foreground mt-0.5 italic">{item.simpleName}</p>}
      <div className="flex flex-wrap gap-1 mt-2">
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">GMFCS {item.gmfcs}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{item.category}</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${item.validated ? 'bg-mint-100 text-mint-700' : 'bg-muted text-muted-foreground'}`}>
          {item.validated ? '✓ Validado' : 'Sin validar'}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <Star size={10} className="text-gold fill-gold" />
        <span className="text-[10px] font-medium">{item.rating}</span>
        <span className="text-[10px] text-muted-foreground">({item.reviews})</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{item.author}</span>
      </div>
      <div className="mt-2">
        <AdherenceBars percent={item.adherence} />
      </div>
    </KikiCard>
  );
}

function ExerciseDetailPanel({ item, onClose }: { item: typeof communityExercises[0] | null; onClose: () => void }) {
  if (!item) return null;
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black/40 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed top-0 right-0 bottom-0 w-full max-w-[450px] bg-background z-50 overflow-y-auto shadow-2xl"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
      >
        <div className="sticky top-0 bg-gradient-to-b from-mint-100 to-background p-4 pb-6">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card/80 flex items-center justify-center mb-4" aria-label="Cerrar">
            <X size={18} />
          </button>
          <p className="text-2xl mb-2">{item.icon}</p>
          <h2 className="font-display text-xl text-foreground">{item.clinicalName}</h2>
          {item.simpleName && <p className="text-sm text-muted-foreground italic mt-1">{item.simpleName}</p>}
          <div className="flex flex-wrap gap-1 mt-3">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-card text-muted-foreground">GMFCS {item.gmfcs}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-card text-muted-foreground">{item.category}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-card text-muted-foreground">{item.area}</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <KikiCard className="bg-muted/50">
            <div className="w-full h-32 rounded-lg bg-navy-100 flex items-center justify-center">
              <span className="text-muted-foreground text-sm">▶ Video · Vista lateral · 45 seg</span>
            </div>
          </KikiCard>

          <div>
            <h3 className="text-sm font-semibold mb-2">Evidencia clínica</h3>
            <KikiCard>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${evidenceBadgeColors[item.evidence]}`}>{item.evidence}</span>
              <p className="text-xs text-muted-foreground mt-2">Referencia disponible en la versión completa del ejercicio.</p>
            </KikiCard>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Instrucciones para el cuidador</h3>
            <KikiCard>
              <p className="text-sm text-foreground leading-relaxed">Instrucciones paso a paso del ejercicio, escritas en lenguaje simple para que el cuidador pueda ejecutarlo correctamente en casa.</p>
              <div className="flex gap-2 mt-3">
                <span className="text-[10px] px-2 py-1 rounded-full bg-muted">⏱ 30s por rep</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-muted">🔄 3 repeticiones</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-muted">⏸ 15s descanso</span>
              </div>
            </KikiCard>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Qué observar durante el ejercicio</h3>
            <div className="grid grid-cols-2 gap-2">
              <KikiCard className="border-l-4 border-l-mint">
                <p className="text-[10px] font-semibold text-mint-700 mb-1">Va bien si…</p>
                <p className="text-xs text-muted-foreground">El niño tolera la posición sin tensión excesiva</p>
              </KikiCard>
              <KikiCard className="border-l-4 border-l-rust">
                <p className="text-[10px] font-semibold text-rust mb-1">Pará o ajustá si…</p>
                <p className="text-xs text-muted-foreground">Hay dolor, rigidez repentina o llanto persistente</p>
              </KikiCard>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Adherencia en casa · datos de la red</h3>
            <KikiCard className="bg-muted/50">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div><p className="text-lg font-bold">{item.adherence}%</p><p className="text-[10px] text-muted-foreground">adherencia media</p></div>
                <div><p className="text-lg font-bold">34</p><p className="text-[10px] text-muted-foreground">familias activas</p></div>
                <div><p className="text-lg font-bold">Noche</p><p className="text-[10px] text-muted-foreground">horario frecuente</p></div>
                <div><p className="text-lg font-bold">Día 4</p><p className="text-[10px] text-muted-foreground">caída típica</p></div>
              </div>
            </KikiCard>
          </div>
        </div>

        <div className="sticky bottom-0 p-4 bg-background border-t border-border space-y-2">
          <button className="btn-primary w-full text-sm">Agregar al plan de un paciente</button>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1 text-xs py-2"><Bookmark size={12} className="inline mr-1" /> Guardar</button>
            <button className="btn-ghost flex-1 text-xs py-2">Agregar a protocolo</button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ExerciseLibraryScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<typeof communityExercises[0] | null>(null);

  const filteredCommunity = communityExercises.filter(e =>
    !search || e.clinicalName.toLowerCase().includes(search.toLowerCase()) || e.simpleName.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="px-4 pt-4 flex items-center gap-3">
        <h1 className="text-lg font-semibold flex-1">Biblioteca</h1>
        <button onClick={() => navigate('/kine/exercises/create')} className="btn-primary text-xs py-2 px-3">
          <Plus size={12} className="inline mr-1" /> Crear ejercicio
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 overflow-x-auto pb-1">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 font-medium transition-colors ${activeTab === i ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-kiki pl-9 text-sm" placeholder="Buscá por nombre, área o técnica…" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6">
        {/* Mis ejercicios */}
        {activeTab === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-3xl mb-3">📝</p>
            <h3 className="font-semibold">Todavía no creaste ejercicios propios</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Creá tu primer ejercicio y guardalo en tu biblioteca personal</p>
            <button onClick={() => navigate('/kine/exercises/create')} className="btn-primary text-sm">Crear mi primer ejercicio</button>
          </div>
        )}

        {/* Comunidad */}
        {activeTab === 1 && (
          <div className="space-y-4">
            <KikiCard className="bg-gradient-to-r from-mint-50 to-blue-50">
              <h3 className="text-base font-semibold">Comunidad KikiCare</h3>
              <p className="text-xs text-muted-foreground mt-1">Ejercicios compartidos por terapeutas de toda Argentina</p>
              <div className="flex gap-4 mt-3">
                <div className="text-center"><p className="font-bold">89</p><p className="text-[9px] text-muted-foreground">ejercicios</p></div>
                <div className="text-center"><p className="font-bold">34</p><p className="text-[9px] text-muted-foreground">terapeutas</p></div>
                <div className="text-center"><p className="font-bold">12</p><p className="text-[9px] text-muted-foreground">protocolos</p></div>
              </div>
            </KikiCard>
            <div className="grid grid-cols-2 gap-2">
              {filteredCommunity.map(item => (
                <CommunityCard key={item.id} item={item} onClick={() => setSelectedExercise(item)} />
              ))}
            </div>
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
            {sampleProtocols.map(proto => (
              <KikiCard key={proto.id}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{proto.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{proto.name}</p>
                    <p className="text-xs text-muted-foreground">{proto.subtitle}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-muted-foreground">
                      <span>{proto.exercises} ejercicios</span>
                      <span>·</span>
                      <span>{proto.duration}</span>
                      <span>·</span>
                      <span>{proto.frequency}</span>
                      <span>·</span>
                      <span className="font-medium">{proto.adherence}%</span>
                    </div>
                    <button className="btn-primary text-xs py-1.5 px-3 mt-2">Usar en paciente</button>
                  </div>
                </div>
              </KikiCard>
            ))}
          </div>
        )}

        {/* Guardados */}
        {activeTab === 3 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Bookmark size={32} className="text-muted-foreground mb-3" />
            <h3 className="font-semibold">Sin ejercicios guardados</h3>
            <p className="text-sm text-muted-foreground mt-1">Guardá ejercicios de la comunidad para acceder rápido</p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedExercise && (
        <ExerciseDetailPanel item={selectedExercise} onClose={() => setSelectedExercise(null)} />
      )}
    </div>
  );
}
