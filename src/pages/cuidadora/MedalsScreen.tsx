import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const medalDefs = [
  { id: 'first-session', icon: '⭐', title: 'Primera sesión', description: 'Completá tu primera sesión de ejercicios', requirement: 'Completar 1 sesión', threshold: 1 },
  { id: 'streak-3', icon: '🔥', title: 'Racha de 3', description: 'Completá 3 sesiones seguidas', requirement: '3 sesiones consecutivas', threshold: 3 },
  { id: 'streak-7', icon: '💪', title: 'Semana completa', description: 'Completá 7 sesiones seguidas', requirement: '7 sesiones consecutivas', threshold: 7 },
  { id: 'ten-sessions', icon: '🏅', title: '10 sesiones', description: 'Completá 10 sesiones en total', requirement: 'Completar 10 sesiones', threshold: 10 },
  { id: 'twenty-sessions', icon: '🏆', title: 'Campeón', description: 'Completá 20 sesiones en total', requirement: 'Completar 20 sesiones', threshold: 20 },
];

interface EarnedMedal {
  medal_type: string;
  earned_at: string;
  points_awarded: number;
}

export default function MedalsScreen() {
  const { user } = useAuthContext();
  const [sessionCount, setSessionCount] = useState(0);
  const [earnedMedals, setEarnedMedals] = useState<EarnedMedal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedal, setSelectedMedal] = useState<typeof medalDefs[0] & { earned: boolean; earnedAt?: string; points?: number } | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [sessRes, medalsRes] = await Promise.all([
      supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('caregiver_id', user.id),
      supabase.from('medals').select('medal_type, earned_at, points_awarded').eq('user_id', user.id),
    ]);
    setSessionCount(sessRes.count || 0);
    setEarnedMedals((medalsRes.data || []) as EarnedMedal[]);
    setLoading(false);
  };

  const earnedTypes = new Set(earnedMedals.map(m => m.medal_type));

  const medals = medalDefs.map(m => {
    const earnedRecord = earnedMedals.find(e => e.medal_type === m.id);
    return {
      ...m,
      earned: earnedTypes.has(m.id),
      earnedAt: earnedRecord?.earned_at,
      points: earnedRecord?.points_awarded,
      progress: Math.min(100, Math.round((sessionCount / m.threshold) * 100)),
    };
  });

  const earnedCount = medals.filter(m => m.earned).length;
  const earned = medals.filter(m => m.earned);
  const inProgress = medals.filter(m => !m.earned);

  return (
    <AppShell>
      <ScreenHeader title="Medallas" />
      <div className="px-4 pb-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden bg-gradient-to-br from-mint-200 via-mint-100 to-mint-50 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={20} className="text-navy" />
                <span className="text-2xl font-bold text-navy">{earnedCount}/{medals.length}</span>
              </div>
              <p className="text-sm font-medium text-navy/80">medallas ganadas</p>
              <div className="w-full h-2.5 rounded-full bg-navy/10 mt-3">
                <motion.div className="h-2.5 rounded-full bg-navy/40" initial={{ width: 0 }}
                  animate={{ width: `${(earnedCount / medals.length) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
              </div>
              {sessionCount === 0 && (
                <p className="text-xs text-navy/60 mt-2">Completá tu primera sesión para empezar a ganar medallas</p>
              )}
            </motion.div>

            {/* Earned */}
            {earned.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Ganadas ✨</h3>
                <div className="grid grid-cols-3 gap-3">
                  {earned.map((medal, i) => (
                    <motion.div key={medal.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                      <div className="rounded-2xl p-3 text-center bg-gradient-to-br from-mint-300 to-mint-100 shadow-md cursor-pointer active:scale-95 transition-transform"
                        onClick={() => setSelectedMedal(medal)}>
                        <div className="text-3xl mb-1">{medal.icon}</div>
                        <p className="text-[10px] font-bold text-navy leading-tight">{medal.title}</p>
                        {medal.points && <p className="text-[9px] text-navy/60 mt-0.5">+{medal.points} pts</p>}
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
                    <motion.div key={medal.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <KikiCard className="!p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center relative">
                            <span className="text-2xl opacity-40">{medal.icon}</span>
                            <Lock size={12} className="absolute -bottom-0.5 -right-0.5 text-muted-foreground bg-card rounded-full p-0.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{medal.title}</p>
                            <p className="text-[11px] text-muted-foreground">{medal.requirement}</p>
                            <div className="w-full h-1.5 rounded-full bg-muted mt-1.5">
                              <motion.div className="h-1.5 rounded-full bg-mint" initial={{ width: 0 }}
                                animate={{ width: `${medal.progress}%` }} transition={{ duration: 0.6, delay: i * 0.1 }} />
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
          </>
        )}
      </div>

      {/* Medal detail popup */}
      {selectedMedal && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center px-6" onClick={() => setSelectedMedal(null)}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-[320px] shadow-kiki-lg text-center" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">{selectedMedal.icon}</div>
            <h3 className="text-lg font-bold">{selectedMedal.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{selectedMedal.description}</p>
            {selectedMedal.earned && selectedMedal.earnedAt && (
              <p className="text-xs text-mint-600 mt-2 font-medium">
                Obtenida el {new Date(selectedMedal.earnedAt).toLocaleDateString('es-AR')}
              </p>
            )}
            {selectedMedal.points && (
              <p className="text-xs text-muted-foreground mt-1">+{selectedMedal.points} puntos</p>
            )}
            <button onClick={() => setSelectedMedal(null)} className="btn-primary w-full text-sm mt-4">Cerrar</button>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
