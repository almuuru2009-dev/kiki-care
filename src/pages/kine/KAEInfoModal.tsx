import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Clock, TrendingDown, Brain, Heart, AlertTriangle } from 'lucide-react';

interface MAAInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function KAEInfoModal({ open, onClose }: MAAInfoModalProps) {
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
            className="fixed inset-x-0 bottom-0 top-12 z-50 mx-auto max-w-[390px] bg-background rounded-t-2xl overflow-hidden flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center justify-between p-4 pb-2 shrink-0">
              <h2 className="text-lg font-bold text-foreground">Kiki Adherence Engine (KAE)</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-2 shrink-0" />

            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                KAE analiza el comportamiento real de cada familia para detectar cambios en la adherencia al tratamiento antes de que se conviertan en abandono.
              </p>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex gap-2">
                <AlertTriangle size={16} className="text-gold shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed italic">
                  KAE es una herramienta de soporte a la decisión clínica. No reemplaza el criterio del kinesiólogo.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
