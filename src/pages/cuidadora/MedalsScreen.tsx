import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, CheckCircle2, Clock } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MEDAL_DEFS, buildMedalContext, statusOf, type MedalContext, type MedalDef } from '@/lib/medals';

export default function MedalsScreen() {
  const { user } = useAuthContext();
  const [ctx, setCtx] = useState<MedalContext | null>(null);
  const [earnedTypes, setEarnedTypes] = useState<Set<string>>(new Set());
  const [earnedAt, setEarnedAt] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MedalDef | null>(null);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    if (!user) return;
    const [ctxRes, medalsRes] = await Promise.all([
      buildMedalContext(user.id),
      supabase.from('medals').select('medal_type, earned_at').eq('user_id', user.id),
    ]);
    setCtx(ctxRes);
    const types = new Set((medalsRes.data || []).map(m => m.medal_type));
    const dates = new Map((medalsRes.data || []).map(m => [m.medal_type, m.earned_at]));
    setEarnedTypes(types);
    setEarnedAt(dates);
    setLoading(false);
  };

  const ganadas = ctx ? MEDAL_DEFS.filter(d => statusOf(d, ctx, earnedTypes) === 'ganada') : [];
  const enProgreso = ctx ? MEDAL_DEFS.filter(d => statusOf(d, ctx, earnedTypes) === 'progreso') : [];
  const bloqueadas = ctx ? MEDAL_DEFS.filter(d => statusOf(d, ctx, earnedTypes) === 'bloqueada') : [];

  const renderProgress = (def: MedalDef) => {
    if (!ctx) return null;
    const ev = def.evaluate(ctx);
    return { pct: Math.round(ev.progress * 100), label: ev.label };
  };

  return (
    <AppShell>
      <ScreenHeader title="Medallas" />
      <div className="px-4 pb-6 space-y-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-gradient-to-br from-mint-200 via-mint-100 to-mint-50 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={20} className="text-navy" />
                <span className="text-2xl font-bold text-navy">{ganadas.length}/{MEDAL_DEFS.length}</span>
              </div>
              <p className="text-sm font-medium text-navy/80">medallas ganadas</p>
              <div className="w-full h-2.5 rounded-full bg-navy/10 mt-3">
                <motion.div className="h-2.5 rounded-full bg-navy/40" initial={{ width: 0 }}
                  animate={{ width: `${(ganadas.length / MEDAL_DEFS.length) * 100}%` }} transition={{ duration: 0.8 }} />
              </div>
            </motion.div>

            {/* Ganadas */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-mint-600" />
                <h3 className="text-sm font-semibold">Ganadas ({ganadas.length})</h3>
              </div>
              {ganadas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aún no ganaste medallas. ¡Completá tu primera sesión!</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {ganadas.map(def => (
                    <button key={def.type} onClick={() => setSelected(def)}
                      className="rounded-xl p-3 text-center bg-gradient-to-br from-mint-200 to-mint-50 active:scale-95 transition-transform">
                      <div className="text-3xl mb-1">{def.icon}</div>
                      <p className="text-[10px] font-bold leading-tight">{def.title}</p>
                      <p className="text-[9px] text-mint-700 mt-0.5">+{def.points} pts</p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* En progreso */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-amber-600" />
                <h3 className="text-sm font-semibold">En progreso ({enProgreso.length})</h3>
              </div>
              <div className="space-y-2">
                {enProgreso.map(def => {
                  const p = renderProgress(def)!;
                  return (
                    <button key={def.type} onClick={() => setSelected(def)} className="w-full text-left">
                      <KikiCard className="!p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                            <span className="text-2xl">{def.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{def.title}</p>
                            <p className="text-[11px] text-muted-foreground">{def.criteria}</p>
                            <div className="w-full h-1.5 rounded-full bg-muted mt-1.5">
                              <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: `${p.pct}%` }} />
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-amber-700">{p.label}</span>
                            <p className="text-[9px] text-muted-foreground">+{def.points} pts</p>
                          </div>
                        </div>
                      </KikiCard>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Bloqueadas */}
            {bloqueadas.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={16} className="text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Bloqueadas ({bloqueadas.length})</h3>
                </div>
                <div className="space-y-2">
                  {bloqueadas.map(def => {
                    const required = def.requires ? MEDAL_DEFS.find(d => d.type === def.requires) : null;
                    return (
                      <button key={def.type} onClick={() => setSelected(def)} className="w-full text-left">
                        <KikiCard className="!p-3 opacity-70">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center relative">
                              <span className="text-2xl opacity-40">{def.icon}</span>
                              <Lock size={12} className="absolute -bottom-0.5 -right-0.5 text-muted-foreground bg-card rounded-full p-0.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{def.title}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {required ? `Requiere: ${required.title}` : def.criteria}
                              </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground">+{def.points} pts</span>
                          </div>
                        </KikiCard>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {selected && ctx && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center px-6" onClick={() => setSelected(null)}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-[320px] shadow-kiki-lg text-center" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">{selected.icon}</div>
            <h3 className="text-lg font-bold">{selected.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
            <p className="text-xs text-muted-foreground mt-2">{selected.criteria}</p>

            {(() => {
              const status = statusOf(selected, ctx, earnedTypes);
              if (status === 'ganada') {
                const dt = earnedAt.get(selected.type);
                return (
                  <div className="mt-3 bg-mint-50 rounded-xl p-3">
                    <p className="text-sm font-semibold text-mint-700">¡Lograda! +{selected.points} pts</p>
                    {dt && <p className="text-xs text-mint-700 mt-1">El {new Date(dt).toLocaleDateString('es-AR')}</p>}
                  </div>
                );
              }
              if (status === 'progreso') {
                const ev = selected.evaluate(ctx);
                return (
                  <div className="mt-3 bg-amber-50 rounded-xl p-3">
                    <p className="text-sm font-semibold text-amber-700">{ev.label}</p>
                    <div className="w-full h-2 rounded-full bg-muted mt-2">
                      <div className="h-2 rounded-full bg-amber-400" style={{ width: `${Math.round(ev.progress * 100)}%` }} />
                    </div>
                    <p className="text-xs text-amber-700 mt-2">+{selected.points} pts al lograrla</p>
                  </div>
                );
              }
              const required = selected.requires ? MEDAL_DEFS.find(d => d.type === selected.requires) : null;
              return (
                <div className="mt-3 bg-muted rounded-xl p-3">
                  <p className="text-sm font-semibold">Bloqueada</p>
                  {required && <p className="text-xs text-muted-foreground mt-1">Primero ganá: {required.title}</p>}
                </div>
              );
            })()}

            <button onClick={() => setSelected(null)} className="btn-primary w-full text-sm mt-4">Cerrar</button>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
