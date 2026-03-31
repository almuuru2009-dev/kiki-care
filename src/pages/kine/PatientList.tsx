import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, SlidersHorizontal, X, Check, Mail, Archive, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PatientCard } from '@/components/kiki/PatientCard';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';

const adherenceFilters = ['Alta (>75%)', 'Media (50-75%)', 'Baja (<50%)'];
const riskFilters = ['Sin actividad', 'Inactivo', 'Patrón modificado'];
const activityFilters = ['Hoy', 'Hace 3 días', '+7 días inactivo'];
const gmfcsFilters = [
  { label: 'I', value: 1 },
  { label: 'II', value: 2 },
  { label: 'III', value: 3 },
  { label: 'IV', value: 4 },
  { label: 'V', value: 5 },
];

export default function PatientList() {
  const navigate = useNavigate();
  const { patients, conversations, archivePatient, deletePatient, addPatient } = useAppStore();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeAdherence, setActiveAdherence] = useState<string[]>([]);
  const [activeRisk, setActiveRisk] = useState<string[]>([]);
  const [activeActivity, setActiveActivity] = useState<string[]>([]);
  const [activeGmfcs, setActiveGmfcs] = useState<number[]>([]);
  const [pendingMessages, setPendingMessages] = useState(false);

  // Add patient modal
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  // Action modal for patient
  const [actionPatientId, setActionPatientId] = useState<string | null>(null);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const toggleGmfcs = (val: number) => {
    setActiveGmfcs(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const hasActiveFilters = activeAdherence.length > 0 || activeRisk.length > 0 || activeActivity.length > 0 || activeGmfcs.length > 0 || pendingMessages;

  const filtered = patients.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.diagnosis.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeAdherence.length > 0) {
      const match = activeAdherence.some(f => {
        if (f.includes('>75')) return p.adherence > 75;
        if (f.includes('50-75')) return p.adherence >= 50 && p.adherence <= 75;
        if (f.includes('<50')) return p.adherence < 50;
        return true;
      });
      if (!match) return false;
    }
    if (activeRisk.length > 0) {
      const match = activeRisk.some(f => {
        if (f === 'Sin actividad') return p.lastSessionDaysAgo >= 5;
        if (f === 'Inactivo') return p.lastSessionDaysAgo >= 3;
        if (f === 'Patrón modificado') return p.adherence < 65 && p.adherence > 30;
        return true;
      });
      if (!match) return false;
    }
    if (activeActivity.length > 0) {
      const match = activeActivity.some(f => {
        if (f === 'Hoy') return p.lastSessionDaysAgo === 0;
        if (f === 'Hace 3 días') return p.lastSessionDaysAgo <= 3;
        if (f === '+7 días inactivo') return p.lastSessionDaysAgo >= 7;
        return true;
      });
      if (!match) return false;
    }
    if (activeGmfcs.length > 0 && !activeGmfcs.includes(p.gmfcs)) return false;
    if (pendingMessages) {
      const conv = conversations.find(c => c.patientId === p.id);
      if (!conv || conv.unreadCount === 0) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setActiveAdherence([]);
    setActiveRisk([]);
    setActiveActivity([]);
    setActiveGmfcs([]);
    setPendingMessages(false);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Ingresá un email válido');
      return;
    }
    setInviteSending(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debés iniciar sesión');
        setInviteSending(false);
        return;
      }

      // Check if link already exists
      const { data: existing } = await supabase
        .from('therapist_caregiver_links')
        .select('id, status')
        .eq('therapist_id', user.id)
        .eq('caregiver_email', inviteEmail.toLowerCase())
        .in('status', ['pending', 'active']);

      if (existing && existing.length > 0) {
        const status = existing[0].status;
        toast.error(status === 'active' ? 'Ya tenés un vínculo activo con este email' : 'Ya hay una invitación pendiente para este email');
        setInviteSending(false);
        return;
      }

      // Create invitation
      const { error } = await supabase
        .from('therapist_caregiver_links')
        .insert({
          therapist_id: user.id,
          caregiver_email: inviteEmail.toLowerCase(),
          status: 'pending',
        });

      if (error) {
        toast.error('Error al enviar la invitación');
        console.error(error);
      } else {
        setInviteSent(true);
        toast.success(`Invitación enviada a ${inviteEmail}`);
        setTimeout(() => {
          setShowAddPatient(false);
          setInviteEmail('');
          setInviteSent(false);
        }, 2000);
      }
    } catch (err) {
      toast.error('Error inesperado');
    }
    setInviteSending(false);
  };

  const handleArchive = (id: string) => {
    archivePatient(id);
    setActionPatientId(null);
    toast.success('Paciente archivado');
  };

  const handleDelete = (id: string) => {
    deletePatient(id);
    setActionPatientId(null);
    toast.success('Paciente desvinculado');
  };

  const actionPatient = actionPatientId ? patients.find(p => p.id === actionPatientId) : null;

  return (
    <AppShell>
      <ScreenHeader title="Mis Pacientes" />

      <div className="px-4 pb-6">
        {/* Search + Filter button */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-kiki pl-10" placeholder="Buscar paciente..." />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 rounded-[10px] border-[1.5px] flex items-center gap-1.5 text-sm font-medium transition-colors ${hasActiveFilters ? 'border-mint bg-mint-50 text-mint-700' : 'border-border bg-card text-foreground'}`}
          >
            <SlidersHorizontal size={16} />
            Filtros
            {hasActiveFilters && <span className="w-5 h-5 rounded-full bg-mint text-navy text-[10px] font-bold flex items-center justify-center">{activeAdherence.length + activeRisk.length + activeActivity.length + activeGmfcs.length + (pendingMessages ? 1 : 0)}</span>}
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 overflow-hidden"
            >
              <div className="card-kiki p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</p>
                  {hasActiveFilters && <button onClick={clearFilters} className="text-[10px] text-mint-600 font-medium">Limpiar todo</button>}
                </div>

                <div>
                  <p className="text-xs font-medium mb-1.5">Estado de adherencia</p>
                  <div className="flex flex-wrap gap-1.5">
                    {adherenceFilters.map(f => (
                      <button key={f} onClick={() => toggleFilter(activeAdherence, f, setActiveAdherence)}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${activeAdherence.includes(f) ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                        {activeAdherence.includes(f) && <Check size={8} className="inline mr-0.5" />}{f}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-1.5">Riesgo de abandono</p>
                  <div className="flex flex-wrap gap-1.5">
                    {riskFilters.map(f => (
                      <button key={f} onClick={() => toggleFilter(activeRisk, f, setActiveRisk)}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${activeRisk.includes(f) ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                        {activeRisk.includes(f) && <Check size={8} className="inline mr-0.5" />}{f}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-1.5">Última actividad</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activityFilters.map(f => (
                      <button key={f} onClick={() => toggleFilter(activeActivity, f, setActiveActivity)}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${activeActivity.includes(f) ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                        {activeActivity.includes(f) && <Check size={8} className="inline mr-0.5" />}{f}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-1.5">Mensajes pendientes</p>
                  <button onClick={() => setPendingMessages(!pendingMessages)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${pendingMessages ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                    {pendingMessages && <Check size={8} className="inline mr-0.5" />}Con mensajes sin leer
                  </button>
                </div>

                <div>
                  <p className="text-xs font-medium mb-1.5">Nivel GMFCS</p>
                  <div className="flex gap-1.5">
                    {gmfcsFilters.map(f => (
                      <button key={f.value} onClick={() => toggleGmfcs(f.value)}
                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${activeGmfcs.includes(f.value) ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground mb-2">{filtered.length} paciente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
        )}

        {/* List */}
        <div className="space-y-3">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="relative">
                <PatientCard patient={p} onClick={() => navigate(`/kine/patients/${p.id}`)} />
                <button
                  onClick={(e) => { e.stopPropagation(); setActionPatientId(p.id); }}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:bg-muted z-10"
                  aria-label="Opciones"
                >
                  <span className="text-xs font-bold">⋯</span>
                </button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No se encontraron pacientes con estos filtros</p>
              <button onClick={clearFilters} className="btn-ghost text-sm text-mint-600 mt-2">Limpiar filtros</button>
            </div>
          )}
        </div>
      </div>

      {/* FAB - Add Patient */}
      <button
        onClick={() => setShowAddPatient(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-mint flex items-center justify-center shadow-kiki-lg active:scale-95 transition-transform z-10"
        style={{ maxWidth: '390px', right: 'calc(50% - 195px + 16px)' }}
        aria-label="Agregar paciente"
      >
        <Plus size={24} className="text-navy" />
      </button>

      {/* Add Patient Modal */}
      {showAddPatient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={() => !inviteSending && setShowAddPatient(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-[340px] shadow-kiki-lg" onClick={e => e.stopPropagation()}
          >
            {inviteSent ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">✉️</p>
                <h3 className="font-bold text-lg">Invitación enviada</h3>
                <p className="text-sm text-muted-foreground mt-1">El cuidador recibirá un email para vincularse con vos.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-1">Agregar paciente</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Ingresá el email del cuidador/a del niño. Recibirá una invitación para vincularse con vos.
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      className="input-kiki pl-10 text-sm"
                      placeholder="email@ejemplo.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Si el cuidador no tiene cuenta, podrá registrarse al recibir el email. Luego aceptará el vínculo desde su app.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={handleSendInvite} className="btn-primary flex-1 text-sm" disabled={inviteSending || !inviteEmail.trim()}>
                      {inviteSending ? 'Enviando...' : 'Enviar invitación'}
                    </button>
                    <button onClick={() => { setShowAddPatient(false); setInviteEmail(''); }} className="btn-ghost flex-1 text-sm">Cancelar</button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Patient Action Modal */}
      {actionPatient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setActionPatientId(null)}>
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }}
            className="bg-card rounded-t-2xl p-5 w-full max-w-[390px] shadow-kiki-lg" onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
            <h3 className="font-bold text-base mb-1">{actionPatient.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">{actionPatient.diagnosis}</p>
            <div className="space-y-2">
              <button onClick={() => handleArchive(actionPatient.id)} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium">
                <Archive size={18} /> Archivar paciente
              </button>
              <button onClick={() => handleDelete(actionPatient.id)} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-red-50 text-rust text-sm font-medium">
                <Trash2 size={18} /> Desvincular paciente
              </button>
              <button onClick={() => setActionPatientId(null)} className="w-full py-3 text-sm text-muted-foreground font-medium">
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
