import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';
import kikiMascot from '@/assets/kiki-mascot.png';

const categoryLabels: Record<string, string> = {
  streak: '🔥 Rachas',
  consistency: '📅 Constancia',
  effort: '💪 Esfuerzo',
  milestone: '🏆 Logros',
  special: '✨ Especiales',
};

const categoryColors: Record<string, string> = {
  streak: 'from-orange-400 to-amber-500',
  consistency: 'from-blue-400 to-cyan-500',
  effort: 'from-pink-400 to-rose-500',
  milestone: 'from-amber-400 to-yellow-500',
  special: 'from-purple-400 to-violet-500',
};

export default function MedalsScreen() {
  const { medals } = useAppStore();
  const [selectedMedal, setSelectedMedal] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const earnedCount = medals.filter(m => m.earned).length;
  const totalCount = medals.length;

  const categories = ['all', ...new Set(medals.map(m => m.category))];
  const filteredMedals = filter === 'all' ? medals : medals.filter(m => m.category === filter);
  const earned = filteredMedals.filter(m => m.earned);
  const inProgress = filteredMedals.filter(m => !m.earned);

  const selected = medals.find(m => m.id === selectedMedal);

  return (
    <AppShell>
      <ScreenHeader title="Medallas de Kiki" />
      <div className="px-4 pb-6 space-y-4">
        {/* Hero with Kiki */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-mint-200 via-mint-100 to-mint-50 p-5"
        >
          <motion.img
            src={kikiMascot}
            alt="Kiki"
            className="absolute -right-2 -bottom-2 w-28 h-28 object-contain"
            animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={20} className="text-navy" />
              <span className="text-2xl font-bold text-navy">{earnedCount}/{totalCount}</span>
            </div>
            <p className="text-sm font-medium text-navy/80">medallas ganadas</p>
            <div className="w-full h-2.5 rounded-full bg-navy/10 mt-3">
              <motion.div
                className="h-2.5 rounded-full bg-navy/40"
                initial={{ width: 0 }}
                animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-navy/60 mt-1.5">
              ¡Kiki está orgulloso de Valentín! 🎉
            </p>
          </div>
        </motion.div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === cat
                  ? 'bg-navy text-mint'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {cat === 'all' ? '🎖 Todas' : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* Earned medals */}
        {earned.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Ganadas ✨</h3>
            <div className="grid grid-cols-3 gap-3">
              {earned.map((medal, i) => (
                <motion.div
                  key={medal.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedMedal(medal.id)}
                  className="cursor-pointer"
                >
                  <div className={`rounded-2xl p-3 text-center bg-gradient-to-br ${categoryColors[medal.category]} shadow-md`}>
                    <motion.div
                      className="text-3xl mb-1"
                      whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      {medal.icon}
                    </motion.div>
                    <p className="text-[10px] font-bold text-white leading-tight">{medal.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* In progress */}
        {inProgress.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">En progreso 🔒</h3>
            <div className="space-y-2">
              {inProgress.map((medal, i) => (
                <motion.div
                  key={medal.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <KikiCard className="!p-3" onClick={() => setSelectedMedal(medal.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center relative">
                        <span className="text-2xl opacity-40">{medal.icon}</span>
                        <Lock size={12} className="absolute -bottom-0.5 -right-0.5 text-muted-foreground bg-card rounded-full p-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{medal.title}</p>
                        <p className="text-[11px] text-muted-foreground">{medal.requirement}</p>
                        <div className="w-full h-1.5 rounded-full bg-muted mt-1.5">
                          <motion.div
                            className="h-1.5 rounded-full bg-mint"
                            initial={{ width: 0 }}
                            animate={{ width: `${medal.progress || 0}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{medal.progress}%</span>
                    </div>
                  </KikiCard>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Kiki tip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-start gap-3 bg-mint-50 border border-mint-200 rounded-xl p-3"
        >
          <img src={kikiMascot} alt="Kiki" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-xs font-semibold text-navy">💡 Consejo de Kiki</p>
            <p className="text-[11px] text-navy/70 mt-0.5">
              ¡Completá 3 días más seguidos para desbloquear "Racha de Fuego"! Valentín puede lograrlo 🔥
            </p>
          </div>
        </motion.div>
      </div>

      {/* Medal detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 px-6"
            onClick={() => setSelectedMedal(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-2xl p-6 w-full max-w-[320px] shadow-kiki-lg text-center"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                className="text-5xl mb-3"
                animate={selected.earned ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.6 }}
              >
                {selected.icon}
              </motion.div>
              <h3 className="text-lg font-bold">{selected.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
              {selected.earned ? (
                <div className="mt-3">
                  <span className="text-xs px-3 py-1 rounded-full bg-mint-100 text-mint-700 font-medium">
                    ✓ Ganada el {selected.earnedDate}
                  </span>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <img src={kikiMascot} alt="Kiki" className="w-8 h-8 object-contain" />
                    <p className="text-xs text-muted-foreground">¡Kiki celebra con vos!</p>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">{selected.requirement}</p>
                  <div className="w-full h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-mint" style={{ width: `${selected.progress || 0}%` }} />
                  </div>
                  <p className="text-xs font-medium text-mint-600 mt-1">{selected.progress}% completado</p>
                </div>
              )}
              <button onClick={() => setSelectedMedal(null)} className="btn-secondary w-full mt-4 text-sm">
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
