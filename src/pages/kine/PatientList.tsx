import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PatientCard } from '@/components/kiki/PatientCard';
import { useAppStore } from '@/stores/useAppStore';

export default function PatientList() {
  const navigate = useNavigate();
  const { patients } = useAppStore();
  const [search, setSearch] = useState('');

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <ScreenHeader title="Mis Pacientes" />

      <div className="px-4 pb-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-kiki pl-10"
            placeholder="Buscar paciente..."
          />
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <PatientCard patient={p} onClick={() => navigate(`/kine/patients/${p.id}`)} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-mint flex items-center justify-center shadow-kiki-lg active:scale-95 transition-transform z-10"
        style={{ maxWidth: '390px', right: 'calc(50% - 195px + 16px)' }}
        aria-label="Agregar paciente"
      >
        <Plus size={24} className="text-navy" />
      </button>
    </AppShell>
  );
}
