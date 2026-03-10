import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, MessageCircle, Settings, CheckCircle, ChevronDown } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle, RiskBadge } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';
import { useState } from 'react';

export default function AlertsScreen() {
  const navigate = useNavigate();
  const { maaAlerts, dismissAlert } = useAppStore();
  const [showResolved, setShowResolved] = useState(false);

  const activeAlerts = maaAlerts.filter(a => a.isActive);
  const resolvedAlerts = maaAlerts.filter(a => !a.isActive);

  return (
    <AppShell>
      <ScreenHeader title="Alertas MAA" rightAction={<Info size={20} className="text-muted-foreground" />} />

      <div className="px-4 pb-6">
        {/* Info banner */}
        <KikiCard className="bg-mint-50 border border-mint-200 mb-4">
          <p className="text-xs text-mint-700 leading-relaxed">
            El Motor de Adherencia Adaptativa analiza el comportamiento de cada familia y detecta cambios antes de que el abandono ocurra.
          </p>
        </KikiCard>

        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-mint-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-mint-500" />
            </div>
            <h3 className="font-semibold">Todo en orden</h3>
            <p className="text-sm text-muted-foreground mt-1">Ninguna familia en riesgo esta semana</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.sort((a, b) => b.riskScore - a.riskScore).map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <KikiCard className={`border-l-4 ${alert.riskLevel === 'ALTO' ? 'border-l-rust' : 'border-l-gold'}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <AvatarCircle name={alert.patientName} size="sm" color={alert.riskLevel === 'ALTO' ? '#C84B2F' : '#D4971A'} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{alert.patientName}</p>
                        <RiskBadge level={alert.riskLevel} />
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.patientAge} años · {alert.alertType}</p>
                    </div>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed mb-2">{alert.triggerReason}</p>

                  <p className="text-xs text-muted-foreground mb-3">
                    Detectado hace {Math.abs(new Date().getDate() - new Date(alert.detectedAt).getDate())} días
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/kine/messages/conv-1`)}
                      className="btn-secondary flex-1 text-xs py-2"
                    >
                      <MessageCircle size={12} className="inline mr-1" /> Mensaje
                    </button>
                    <button
                      onClick={() => navigate(`/kine/patients/${alert.patientId}`)}
                      className="btn-secondary flex-1 text-xs py-2"
                    >
                      <Settings size={12} className="inline mr-1" /> Ajustar plan
                    </button>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="btn-ghost text-xs py-2 text-muted-foreground"
                    >
                      Descartar
                    </button>
                  </div>
                </KikiCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Resolved */}
        {resolvedAlerts.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="flex items-center gap-2 text-sm text-muted-foreground font-medium"
            >
              <ChevronDown size={16} className={`transition-transform ${showResolved ? 'rotate-180' : ''}`} />
              Alertas resueltas ({resolvedAlerts.length})
            </button>
            {showResolved && (
              <div className="mt-3 space-y-2">
                {resolvedAlerts.map(a => (
                  <KikiCard key={a.id} className="opacity-60">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-mint-500" />
                      <p className="text-sm">{a.patientName} — {a.alertType}</p>
                    </div>
                  </KikiCard>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
