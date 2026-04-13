import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Check, Mail, Archive, Unlink, ArchiveRestore, AlertTriangle, Users, Filter, FileText, ChevronDown } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle, RiskBadge } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { calculateRisk, type FamilyPattern } from '@/lib/maa';

interface PatientInfo {
  linkId: string;
  childId: string | null;
  childName: string;
  caregiverName: string;
  caregiverEmail: string;
  diagnosis: string | null;
  gmfcs: number | null;
  age: number | null;
  status: string;
  adherencePercent: number;
  riskLevel: 'BAJO' | 'MODERADO' | 'ALTO';
  lastSessionDaysAgo: number;
}

type AdherenceFilter = 'all' | 'alta' | 'media' | 'baja';
type RiskFilter = 'all' | 'ALTO' | 'MODERADO';

export default function PatientList() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [gmfcsFilter, setGmfcsFilter] = useState<number | null>(null);
  const [adherenceFilter, setAdherenceFilter] = useState<AdherenceFilter>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');

  // Add patient modal
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  // Action modals
  const [actionPatient, setActionPatient] = useState<PatientInfo | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'archive' | 'unlink'; patient: PatientInfo } | null>(null);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadPatients();
  }, [user]);

  const loadPatients = async () => {
    if (!user) return;
    const { data: links } = await supabase
      .from('therapist_caregiver_links').select('*')
      .eq('therapist_id', user.id).in('status', ['active', 'pending', 'archived']);
    if (!links) { setLoading(false); return; }

    const childIds = links.map(l => l.child_id).filter(Boolean) as string[];
    const caregiverIds = links.map(l => l.caregiver_id).filter(Boolean) as string[];

    const [childrenRes, profilesRes, sessionsRes] = await Promise.all([
      childIds.length > 0 ? supabase.from('children').select('*').in('id', childIds) : { data: [] },
      caregiverIds.length > 0 ? supabase.from('profiles').select('id, name').in('id', caregiverIds) : { data: [] },
      childIds.length > 0 ? supabase.from('sessions').select('id, child_id, completed_at').in('child_id', childIds) : { data: [] },
    ]);

    const childrenMap = new Map((childrenRes.data || []).map(c => [c.id, c]));
    const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const allSessions = sessionsRes.data || [];
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

    const mapped: PatientInfo[] = links.map(link => {
      const child = link.child_id ? childrenMap.get(link.child_id) : null;
      const caregiver = link.caregiver_id ? profileMap.get(link.caregiver_id) : null;
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
      const maaResult = calculateRisk(pattern);

      return {
        linkId: link.id, childId: link.child_id,
        childName: child?.name || 'Pendiente',
        caregiverName: caregiver?.name || link.caregiver_email,
        caregiverEmail: link.caregiver_email,
        diagnosis: child?.diagnosis || null,
        gmfcs: child?.gmfcs || null,
        age: child?.age || null,
        status: link.status,
        adherencePercent,
        riskLevel: maaResult.riskLevel,
        lastSessionDaysAgo,
      };
    });
    setPatients(mapped);
    setLoading(false);
  };

  const activePatients = patients.filter(p => p.status === 'active' || p.status === 'pending');
  const archivedPatients = patients.filter(p => p.status === 'archived');
  const displayPatients = showArchived ? archivedPatients : activePatients;

  const filtered = displayPatients.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.childName.toLowerCase().includes(q) && !p.caregiverName.toLowerCase().includes(q)) return false;
    }
    if (gmfcsFilter !== null && p.gmfcs !== gmfcsFilter) return false;
    if (adherenceFilter === 'alta' && p.adherencePercent < 70) return false;
    if (adherenceFilter === 'media' && (p.adherencePercent < 40 || p.adherencePercent >= 70)) return false;
    if (adherenceFilter === 'baja' && p.adherencePercent >= 40) return false;
    if (riskFilter !== 'all' && p.riskLevel !== riskFilter) return false;
    return true;
  });

  const activeFilterCount = [gmfcsFilter !== null, adherenceFilter !== 'all', riskFilter !== 'all'].filter(Boolean).length;

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) { toast.error('Ingresá un email válido'); return; }
    setInviteSending(true);
    try {
      const { data: existing } = await supabase.from('therapist_caregiver_links')
        .select('id, status').eq('therapist_id', user!.id).eq('caregiver_email', inviteEmail.toLowerCase())
        .in('status', ['pending', 'active']);
      if (existing && existing.length > 0) {
        toast.error(existing[0].status === 'active' ? 'Ya tenés un vínculo activo' : 'Ya hay una invitación pendiente');
        setInviteSending(false); return;
      }
      const { error } = await supabase.from('therapist_caregiver_links').insert({
        therapist_id: user!.id, caregiver_email: inviteEmail.toLowerCase(), status: 'pending',
      });
      if (error) toast.error('Error al enviar la invitación');
      else {
        setInviteSent(true);
        toast.success(`Invitación enviada a ${inviteEmail}`);
        await loadPatients();
        setTimeout(() => { setShowAddPatient(false); setInviteEmail(''); setInviteSent(false); }, 2000);
      }
    } catch { toast.error('Error inesperado'); }
    setInviteSending(false);
  };

  const handleArchive = async (linkId: string) => {
    await supabase.from('therapist_caregiver_links').update({ status: 'archived', responded_at: new Date().toISOString() }).eq('id', linkId);
    setConfirmAction(null); setActionPatient(null);
    toast.success('Paciente archivado'); await loadPatients();
  };

  const handleUnlink = async (linkId: string) => {
    await supabase.from('therapist_caregiver_links').update({ status: 'rejected', responded_at: new Date().toISOString() }).eq('id', linkId);
    setConfirmAction(null); setActionPatient(null);
    toast.success('Paciente desvinculado'); await loadPatients();
  };

  const handleRestore = async (linkId: string) => {
    await supabase.from('therapist_caregiver_links').update({ status: 'active', responded_at: new Date().toISOString() }).eq('id', linkId);
    toast.success('Paciente restaurado'); await loadPatients();
  };

  return (
    <AppShell>
      <ScreenHeader title="Mis Pacientes" />
      <div className="px-4 pb-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button onClick={() => setShowArchived(false)}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${!showArchived ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
            Activos ({activePatients.length})
          </button>
          <button onClick={() => setShowArchived(true)}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${showArchived ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
            Archivados ({archivedPatients.length})
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-kiki pl-10" placeholder="Buscar paciente..." />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center relative ${activeFilterCount > 0 ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
            <Filter size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rust text-white text-[9px] flex items-center justify-center font-bold">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-3 space-y-2.5 overflow-hidden">
              {/* GMFCS */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">GMFCS</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[null, 1, 2, 3, 4, 5].map(level => (
                    <button key={level ?? 'all'} onClick={() => setGmfcsFilter(level)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${gmfcsFilter === level ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                      {level === null ? 'Todos' : level}
                    </button>
                  ))}
                </div>
              </div>
              {/* Adherence */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Adherencia</p>
                <div className="flex gap-1.5 flex-wrap">
                  {([['all', 'Todas'], ['alta', '≥70%'], ['media', '40-69%'], ['baja', '<40%']] as [AdherenceFilter, string][]).map(([val, label]) => (
                    <button key={val} onClick={() => setAdherenceFilter(val)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${adherenceFilter === val ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Risk */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Riesgo</p>
                <div className="flex gap-1.5 flex-wrap">
                  {([['all', 'Todos'], ['ALTO', 'Alto'], ['MODERADO', 'Moderado']] as [RiskFilter, string][]).map(([val, label]) => (
                    <button key={val} onClick={() => setRiskFilter(val)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${riskFilter === val ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={() => { setGmfcsFilter(null); setAdherenceFilter('all'); setRiskFilter('all'); }}
                  className="text-xs text-rust font-medium">Limpiar filtros</button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p, i) => (
              <motion.div key={p.linkId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="relative">
                  <KikiCard className="!p-3 border-l-4 border-l-mint" onClick={() => p.status === 'active' && p.childId ? navigate(`/kine/patients/${p.linkId}`) : undefined}>
                    <div className="flex items-center gap-3">
                      <AvatarCircle name={p.childName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{p.childName}</p>
                          <RiskBadge level={p.riskLevel} />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {p.diagnosis || 'Sin diagnóstico'}
                          {p.gmfcs ? ` · GMFCS ${p.gmfcs}` : ''}
                          {p.age ? ` · ${p.age}a` : ''}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Cuidador: {p.caregiverName}</p>
                        {p.status === 'pending' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pendiente</span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${p.adherencePercent >= 70 ? 'text-mint-600' : p.adherencePercent >= 40 ? 'text-gold' : 'text-rust'}`}>
                          {p.adherencePercent}%
                        </p>
                        <p className="text-[9px] text-muted-foreground">adherencia</p>
                      </div>
                    </div>
                  </KikiCard>
                  <button onClick={(e) => { e.stopPropagation(); showArchived ? handleRestore(p.linkId) : setActionPatient(p); }}
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:bg-muted z-10">
                    {showArchived ? <ArchiveRestore size={12} /> : <span className="text-[10px] font-bold">⋯</span>}
                  </button>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  {showArchived ? 'No hay pacientes archivados' : activeFilterCount > 0 ? 'Sin resultados con estos filtros' : 'No tenés pacientes aún'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB - Add Patient */}
      <button
        onClick={() => setShowAddPatient(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-mint text-navy shadow-lg flex items-center justify-center z-30 active:scale-95 transition-transform"
        aria-label="Agregar paciente"
      >
        <Plus size={24} />
      </button>

      {/* Add Patient Modal */}
      {showAddPatient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={() => !inviteSending && setShowAddPatient(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-[340px] shadow-kiki-lg" onClick={e => e.stopPropagation()}>
            {inviteSent ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">✉️</p>
                <h3 className="font-bold text-lg">Invitación enviada</h3>
                <p className="text-sm text-muted-foreground mt-1">El cuidador recibirá la vinculación al iniciar sesión.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-1">Agregar paciente</h3>
                <p className="text-xs text-muted-foreground mb-4">Ingresá el email del cuidador/a.</p>
                <div className="space-y-3">
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" className="input-kiki pl-10 text-sm" placeholder="email@ejemplo.com"
                      value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} autoFocus />
                  </div>
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

      {/* Action Modal */}
      {actionPatient && !confirmAction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setActionPatient(null)}>
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }}
            className="bg-card rounded-t-2xl p-5 w-full max-w-[500px] shadow-kiki-lg" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
            <h3 className="font-bold text-base mb-1">{actionPatient.childName}</h3>
            <p className="text-xs text-muted-foreground mb-4">{actionPatient.caregiverEmail}</p>
            <div className="space-y-2">
              <button onClick={() => setConfirmAction({ type: 'archive', patient: actionPatient })}
                className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium">
                <Archive size={18} /> Archivar paciente
              </button>
              <button onClick={() => setConfirmAction({ type: 'unlink', patient: actionPatient })}
                className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-red-50 text-rust text-sm font-medium">
                <Unlink size={18} /> Desvincular paciente
              </button>
              <button onClick={() => setActionPatient(null)} className="w-full py-3 text-sm text-muted-foreground font-medium">Cancelar</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6" onClick={() => setConfirmAction(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-[340px] shadow-kiki-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${confirmAction.type === 'archive' ? 'bg-amber-100' : 'bg-red-100'}`}>
                <AlertTriangle size={24} className={confirmAction.type === 'archive' ? 'text-amber-600' : 'text-rust'} />
              </div>
              <div>
                <h3 className="font-bold text-base">¿Estás seguro?</h3>
                <p className="text-xs text-muted-foreground">
                  {confirmAction.type === 'archive'
                    ? `${confirmAction.patient.childName} será archivado.`
                    : `${confirmAction.patient.childName} será desvinculado.`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => confirmAction.type === 'archive' ? handleArchive(confirmAction.patient.linkId) : handleUnlink(confirmAction.patient.linkId)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white ${confirmAction.type === 'archive' ? 'bg-amber-500' : 'bg-rust'}`}>
                {confirmAction.type === 'archive' ? 'Sí, archivar' : 'Sí, desvincular'}
              </button>
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-muted text-muted-foreground">Cancelar</button>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
