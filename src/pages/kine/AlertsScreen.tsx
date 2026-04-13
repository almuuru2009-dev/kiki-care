import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, MessageCircle, Settings, CheckCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle, RiskBadge } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calculateRisk, type FamilyPattern } from '@/lib/maa';
import { MAAInfoModal } from './MAAInfoModal';

interface AlertData {
  id: string;
  linkId: string;
  childName: string;
  diagnosis: string | null;
  age: number | null;
  riskLevel: 'BAJO' | 'MODERADO' | 'ALTO';
  riskScore: number;
  triggerReason: string;
  suggestedAction: string;
  lastSessionDaysAgo: number;
  adherencePercent: number;
}

export default function AlertsScreen() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) loadAlerts();
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;

    const { data: links } = await supabase
      .from('therapist_caregiver_links')
      .select('id, child_id, caregiver_id')
      .eq('therapist_id', user.id)
      .eq('status', 'active');

    if (!links || links.length === 0) { setLoading(false); return; }

    const childIds = links.map(l => l.child_id).filter(Boolean) as string[];
    const [childrenRes, sessionsRes] = await Promise.all([
      childIds.length > 0 ? supabase.from('children').select('*').in('id', childIds) : { data: [] },
      childIds.length > 0 ? supabase.from('sessions').select('id, child_id, completed_at').in('child_id', childIds) : { data: [] },
    ]);

    const childrenMap = new Map((childrenRes.data || []).map(c => [c.id, c]));
    const allSessions = sessionsRes.data || [];
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

    const alertList: AlertData[] = links.map(link => {
      const child = link.child_id ? childrenMap.get(link.child_id) : null;
      const childSessions = allSessions.filter(s => s.child_id === link.child_id);
      const recentSessions = childSessions.filter(s => new Date(s.completed_at) >= twoWeeksAgo);
      const adherencePercent = Math.min(100, Math.round((recentSessions.length / 10) * 100));
      const lastSession = childSessions.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
      const lastSessionDaysAgo = lastSession ? Math.floor((now.getTime() - new Date(lastSession.completed_at).getTime()) / 86400000) : 30;

      const pattern: FamilyPattern = {
        patientId: link.id,
        baselineFrequency: 5,
        baselineHour: 10,
        recentFrequency: recentSessions.length / 2,
        lastSessionDaysAgo,
        avgDurationMinutes: 15,
        baselineDurationMinutes: 20,
        responseLatencyHours: lastSessionDaysAgo > 3 ? 48 : 6,
      };
      const maa = calculateRisk(pattern);

      return {
        id: link.id,
        linkId: link.id,
        childName: child?.name || 'Sin nombre',
        diagnosis: child?.diagnosis || null,
        age: child?.age || null,
        riskLevel: maa.riskLevel,
        riskScore: maa.riskScore,
        triggerReason: maa.triggerReason,
        suggestedAction: maa.suggestedAction,
        lastSessionDaysAgo,
        adherencePercent,
      };
    }).filter(a => a.riskLevel !== 'BAJO')
      .sort((a, b) => b.riskScore - a.riskScore);

    setAlerts(alertList);
    setLoading(false);
  };

  const activeAlerts = alerts.filter(a => !dismissed.has(a.id));
  const dismissedAlerts = alerts.filter(a => dismissed.has(a.id));

  return (
    <AppShell hideNav>
      <ScreenHeader title="Alertas MAA" backButton rightAction={
        <button onClick={() => setShowInfo(true)} aria-label="Info MAA"><Info size={20} className="text-muted-foreground" /></button>
      } />

      <div className="px-4 pb-6">
        <KikiCard className="bg-mint-50 border border-mint-200 mb-4 !p-3">
          <p className="text-xs text-mint-700 leading-relaxed">
            El Motor de Adherencia Adaptativa analiza el comportamiento de cada familia y detecta cambios antes de que el abandono ocurra.
          </p>
        </KikiCard>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-mint-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-mint-500" />
            </div>
            <h3 className="font-semibold">Todo en orden</h3>
            <p className="text-sm text-muted-foreground mt-1">Ninguna familia en riesgo esta semana</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert, i) => (
              <motion.div key={alert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <KikiCard className={`border-l-4 !p-3 ${alert.riskLevel === 'ALTO' ? 'border-l-rust' : 'border-l-gold'}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <AvatarCircle name={alert.childName} size="sm" color={alert.riskLevel === 'ALTO' ? '#C84B2F' : '#D4971A'} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{alert.childName}</p>
                        <RiskBadge level={alert.riskLevel} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {alert.age ? `${alert.age} años` : ''}{alert.diagnosis ? ` · ${alert.diagnosis}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{alert.riskScore}</p>
                      <p className="text-[9px] text-muted-foreground">puntos</p>
                    </div>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed mb-2">{alert.triggerReason}</p>

                  <div className="bg-muted/50 rounded-lg p-2 mb-2 space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Indicadores</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Adherencia</span>
                      <span className={`font-medium ${alert.adherencePercent < 40 ? 'text-rust' : 'text-gold'}`}>{alert.adherencePercent}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Última sesión</span>
                      <span className={`font-medium ${alert.lastSessionDaysAgo > 5 ? 'text-rust' : ''}`}>Hace {alert.lastSessionDaysAgo} días</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-2 mb-2">
                    <p className="text-[10px] font-semibold text-blue-brand mb-0.5">💡 Acción sugerida</p>
                    <p className="text-xs text-foreground">{alert.suggestedAction}</p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => navigate('/kine/messages')} className="btn-secondary flex-1 text-xs py-1.5">
                      <MessageCircle size={12} className="inline mr-1" /> Mensaje
                    </button>
                    <button onClick={() => navigate(`/kine/patients/${alert.linkId}`)} className="btn-secondary flex-1 text-xs py-1.5">
                      <Settings size={12} className="inline mr-1" /> Ver paciente
                    </button>
                    <button onClick={() => setDismissed(prev => new Set([...prev, alert.id]))} className="btn-ghost text-xs py-1.5 text-muted-foreground">
                      Descartar
                    </button>
                  </div>
                </KikiCard>
              </motion.div>
            ))}
          </div>
        )}

        {dismissedAlerts.length > 0 && (
          <div className="mt-6">
            <button className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <CheckCircle size={14} /> Descartadas ({dismissedAlerts.length})
            </button>
          </div>
        )}
      </div>

      <MAAInfoModal open={showInfo} onClose={() => setShowInfo(false)} />
    </AppShell>
  );
}
