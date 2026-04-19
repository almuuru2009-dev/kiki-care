import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Mail, Archive, Unlink, ArchiveRestore, AlertTriangle, Users, Filter, Copy, ExternalLink, Hash } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle, RiskBadge } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { calculateRisk, type FamilyPattern } from '@/lib/kae';

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
  riskScore: number;
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
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Action modals
  const [actionPatient, setActionPatient] = useState<PatientInfo | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'archive' | 'unlink'; patient: PatientInfo } | null>(null);
  

  useEffect(() => {
    if (user) loadPatients();
  }, [user]);

  const loadPatients = async () => {
    if (!user) return;
    try {
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

      const mapped: PatientInfo[] = (links || []).map(link => {
        const child = link.child_id ? childrenMap.get(link.child_id) : null;
        const caregiver = link.caregiver_id ? profileMap.get(link.caregiver_id) : null;
        
        const childSessions = allSessions.filter(s => s.child_id === link.child_id);
        const recentSessions = childSessions.filter(s => {
          if (!s.completed_at) return false;
          try {
            return new Date(s.completed_at) >= twoWeeksAgo;
          } catch (e) {
            return false;
          }
        });
        
        const adherencePercent = Math.min(100, Math.round((recentSessions.length / 10) * 100));
        
        const lastSession = [...childSessions].sort((a, b) => {
          const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
          const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
          return dateB - dateA;
        })[0];
        
        const lastSessionDaysAgo = lastSession && lastSession.completed_at 
          ? Math.floor((now.getTime() - new Date(lastSession.completed_at).getTime()) / 86400000) 
          : 30;
        
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
        
        let kaeResult;
        try {
          kaeResult = calculateRisk(pattern);
        } catch (err) {
          console.error("KAE Error:", err);
          kaeResult = { riskLevel: 'BAJO' as const, riskScore: 0 };
        }

        return {
          linkId: link.id, 
          childId: link.child_id || null,
          childName: child?.name || 'Pendiente',
          caregiverName: caregiver?.name || link.caregiver_email || 'Sin nombre',
          caregiverEmail: link.caregiver_email || '',
          diagnosis: child?.diagnosis || null,
          gmfcs: child?.gmfcs || null,
          age: child?.age || null,
          status: link.status || 'pending',
          adherencePercent,
          riskLevel: kaeResult.riskLevel,
          riskScore: kaeResult.riskScore,
          lastSessionDaysAgo,
        };
      });
      setPatients(mapped);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
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

  const handleGenerateCode = async () => {
    if (!user) {
      toast.error('No se detectó sesión de usuario');
      return;
    }
    setInviteSending(true);
    try {
      // Código de 6 caracteres aleatorios
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `KIKI-${randomStr}`;
      
      console.log('DEBUG: Generando código para kinesio_id:', user.id);

      const { error } = await supabase
        .from('kiki_invitations')
        .insert({
          code: code,
          kinesio_id: user.id,
          status: 'pending'
        });

      if (error) {
        console.error('DEBUG: Supabase Insert Error:', error);
        throw error;
      }
      
      setGeneratedCode(code);
      setInviteSent(true);
      toast.success('Código generado con éxito');
    } catch (err: any) {
      console.error('DEBUG: Error capturado en handleGenerateCode:', err);
      const msg = err.message || 'Error desconocido';
      toast.error(`Error: ${msg}`);
    } finally {
      setInviteSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
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
                  <button onClick={(e) => { e.stopPropagation(); if (showArchived) handleRestore(p.linkId); else setActionPatient(p); }}
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

      {showAddPatient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={() => !inviteSending && setShowAddPatient(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-[340px] shadow-kiki-lg" onClick={e => e.stopPropagation()}>
            {inviteSent ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-mint-50 flex items-center justify-center mx-auto mb-2">
                    <Hash size={24} className="text-mint-600" />
                  </div>
                  <h3 className="font-bold text-lg">Código generado</h3>
                  <p className="text-xs text-muted-foreground mt-1">Compartí este código o el link con el cuidador/a.</p>
                </div>

                <div className="bg-muted/50 p-4 rounded-xl border border-border flex flex-col items-center">
                  <p className="text-2xl font-black tracking-widest text-navy mb-1">{generatedCode}</p>
                  <button onClick={() => copyToClipboard(generatedCode)} className="flex items-center gap-1.5 text-xs text-mint-600 font-bold uppercase tracking-wider">
                    <Copy size={12} /> Copiar código
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase text-center">Link de acceso rápido</p>
                  <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border overflow-hidden">
                    <p className="text-[10px] truncate flex-1 text-muted-foreground">{window.location.origin}/join?code={generatedCode}</p>
                    <button onClick={() => copyToClipboard(`${window.location.origin}/join?code=${generatedCode}`)} className="p-1.5 rounded-md bg-white border border-border text-muted-foreground">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <button onClick={() => { setShowAddPatient(false); setInviteSent(false); }} className="btn-primary w-full text-sm">Listo</button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-1">Vincular nuevo paciente</h3>
                <p className="text-xs text-muted-foreground mb-6">Generá un código único para vincularte con la familia.</p>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-mint-50/50 border border-mint-100">
                    <p className="text-xs text-mint-800 leading-relaxed">
                      El código será válido por 24 horas. Una vez que el cuidador lo use, se activará el seguimiento.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={handleGenerateCode} className="btn-primary w-full text-sm py-3" disabled={inviteSending}>
                      {inviteSending ? 'Generando...' : 'Generar código KIKI'}
                    </button>
                    <button onClick={() => setShowAddPatient(false)} className="btn-ghost w-full text-sm">Cancelar</button>
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
