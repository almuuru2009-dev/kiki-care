import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Clock, TrendingDown, Brain, Heart, AlertTriangle } from 'lucide-react';

interface MAAInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function MAAInfoModal({ open, onClose }: MAAInfoModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] bg-background rounded-t-2xl overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Motor de Adherencia Adaptativa</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center" aria-label="Cerrar">
                  <X size={18} />
                </button>
              </div>

              <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-4" />

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                El MAA es un sistema predictivo que analiza patrones de comportamiento de cada familia para detectar señales tempranas de abandono terapéutico, <span className="font-medium text-foreground">antes de que ocurra</span>.
              </p>

              <div className="space-y-3 mb-4">
                <h3 className="text-sm font-semibold text-foreground">Variables que analiza:</h3>

                {[
                  { icon: Activity, color: 'text-mint-600 bg-mint-50', label: 'Frecuencia de sesiones', desc: 'Compara sesiones/semana actuales vs. línea base', weight: '40%' },
                  { icon: Clock, color: 'text-blue-brand bg-blue-50', label: 'Días sin actividad', desc: 'Tiempo transcurrido desde la última sesión registrada', weight: '30%' },
                  { icon: TrendingDown, color: 'text-gold bg-amber-50', label: 'Duración de sesiones', desc: 'Detecta acortamiento progresivo vs. duración habitual', weight: '20%' },
                  { icon: Brain, color: 'text-purple-600 bg-purple-50', label: 'Latencia de respuesta', desc: 'Tiempo que tarda la familia en responder notificaciones', weight: '10%' },
                  { icon: Heart, color: 'text-rust bg-red-50', label: 'Señales emocionales', desc: 'Ánimo del niño, nivel de dolor y cooperación reportados', weight: 'Complementaria' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.label}</p>
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.weight}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-semibold text-foreground">Niveles de riesgo:</h3>
                {[
                  { level: 'BAJO', range: '0 – 35', color: 'bg-mint-100 text-mint-700', desc: 'Adherencia estable. Sin intervención necesaria.' },
                  { level: 'MODERADO', range: '36 – 65', color: 'bg-amber-100 text-amber-700', desc: 'Cambio detectado. Monitoreo recomendado.' },
                  { level: 'ALTO', range: '66 – 100', color: 'bg-red-100 text-red-700', desc: 'Riesgo significativo. Acción inmediata sugerida.' },
                ].map(item => (
                  <div key={item.level} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.color}`}>{item.level}</span>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{item.range} puntos — {item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex gap-2">
                <AlertTriangle size={16} className="text-gold shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Las alertas son orientativas y no reemplazan el juicio clínico. El MAA es una herramienta de apoyo para la toma de decisiones terapéuticas.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
