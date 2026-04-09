import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Check, Mail, Archive, Unlink, ArchiveRestore, AlertTriangle, Users, Filter, FileText } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PatientInfo {
  linkId: string;
  childId: string | null;
  childName: string;
  caregiverName: string;
  caregiverEmail: string;
  diagnosis: string | null;
  gmfcs: number | null;
  status: string;
  sessionCount?: number;
}

export default function PatientList() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [gmfcsFilter, setGmfcsFilter] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [showAddPatient, setShowAddPatient] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

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
    let childrenMap = new Map<string, any>();
    if (childIds.length > 0) {
      const { data: children } = await supabase.from('children').select('*').in('id', childIds);
      children?.forEach(c => childrenMap.set(c.id, c));
    }

    const caregiverIds = links.map(l => l.caregiver_id).filter(Boolean) as string[];
    let profileMap = new Map<string, any>();
    if (caregiverIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', caregiverIds);
      profiles?.forEach(p => profileMap.set(p.id, p));
    }

    const mapped: PatientInfo[] = links.map(link => {
      const child = link.child_id ? childrenMap.get(link.child_id) : null;
      const caregiver = link.caregiver_id ? profileMap.get(link.caregiver_id) : null;
      return {
        linkId: link.id, childId: link.child_id,
        childName: child?.name || 'Pendiente',
        caregiverName: caregiver?.name || link.caregiver_email,
        caregiverEmail: link.caregiver_email,
        diagnosis: child?.diagnosis || null,
        gmfcs: child?.gmfcs || null,
        status: link.status,
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
      if (!p.childName.toLowerCase().includes(q) && !p.caregiverName.toLowerCase().includes(q) && !p.caregiverEmail.toLowerCase().includes(q)) return false;
    }
    if (gmfcsFilter !== null && p.gmfcs !== gmfcsFilter) return false;
    return true;
  });

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
      if (error) { toast.error('Error al enviar la invitación'); }
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

  const generateReport = async (patient: PatientInfo) => {
    setGeneratingReport(patient.linkId);
    try {
      // Gather data
      let sessions: any[] = [];
      if (patient.childId) {
        const { data } = await supabase.from('sessions').select('*').eq('child_id', patient.childId).order('completed_at', { ascending: false }).limit(30);
        sessions = data || [];
      }

      const totalSessions = sessions.length;
      const avgDifficulty = totalSessions > 0 ? (sessions.reduce((s, ss) => s + (ss.difficulty || 0), 0) / totalSessions).toFixed(1) : 'N/A';
      const avgMood = totalSessions > 0 ? (sessions.reduce((s, ss) => s + (ss.child_mood || 3), 0) / totalSessions).toFixed(1) : 'N/A';
      const painCount = sessions.filter(s => s.pain_reported).length;
      const daysActive = new Set(sessions.map(s => new Date(s.completed_at).toISOString().split('T')[0])).size;
      const dateRange = sessions.length > 0 ? `${new Date(sessions[sessions.length - 1].completed_at).toLocaleDateString('es-AR')} – ${new Date(sessions[0].completed_at).toLocaleDateString('es-AR')}` : 'Sin datos';

      // Build HTML for DOCX-like download
      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><title>Informe ${patient.childName}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #1a1a2e; }
          h1 { color: #1a1a2e; border-bottom: 2px solid #7EEDC4; padding-bottom: 8px; }
          h2 { color: #1a1a2e; margin-top: 24px; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
          th { background-color: #f0fdf4; }
          .highlight { background-color: #f0fdf4; padding: 12px; border-radius: 6px; margin: 12px 0; }
          .footer { margin-top: 40px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 12px; }
        </style></head>
        <body>
          <h1>📋 Informe de Seguimiento — ${patient.childName}</h1>
          <p><strong>Fecha del informe:</strong> ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p><strong>Período analizado:</strong> ${dateRange}</p>
          <p><strong>Kinesiólogo/a:</strong> Dr./a ${user?.email || ''}</p>
          
          <h2>Datos del paciente</h2>
          <table>
            <tr><th>Nombre</th><td>${patient.childName}</td></tr>
            <tr><th>Diagnóstico</th><td>${patient.diagnosis || 'No especificado'}</td></tr>
            <tr><th>GMFCS</th><td>${patient.gmfcs ? 'Nivel ' + patient.gmfcs : 'No especificado'}</td></tr>
            <tr><th>Cuidador/a</th><td>${patient.caregiverName} (${patient.caregiverEmail})</td></tr>
          </table>

          <h2>Resumen de adherencia</h2>
          <div class="highlight">
            <table>
              <tr><th>Total de sesiones</th><td>${totalSessions}</td></tr>
              <tr><th>Días activos</th><td>${daysActive}</td></tr>
              <tr><th>Dificultad promedio</th><td>${avgDifficulty}/5</td></tr>
              <tr><th>Ánimo promedio</th><td>${avgMood}/5</td></tr>
              <tr><th>Sesiones con dolor</th><td>${painCount} (${totalSessions > 0 ? Math.round(painCount / totalSessions * 100) : 0}%)</td></tr>
            </table>
          </div>

          <h2>Historial de sesiones</h2>
          <table>
            <tr><th>Fecha</th><th>Dificultad</th><th>Ánimo</th><th>Dolor</th><th>Nota</th></tr>
            ${sessions.slice(0, 20).map(s => `
              <tr>
                <td>${new Date(s.completed_at).toLocaleDateString('es-AR')}</td>
                <td>${s.difficulty || '—'}/5</td>
                <td>${s.child_mood || '—'}/5</td>
                <td>${s.pain_reported ? '⚠️ Sí' : 'No'}</td>
                <td>${s.note || '—'}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Observaciones clínicas</h2>
          <p>${totalSessions < 3 ? 'Datos insuficientes para generar observaciones clínicas (menos de 3 sesiones registradas).' :
            `El paciente muestra una tendencia ${Number(avgDifficulty) > 3 ? 'alta' : Number(avgDifficulty) > 2 ? 'moderada' : 'baja'} en dificultad reportada. ${painCount > 0 ? `Se registró dolor en ${painCount} sesion(es), lo cual requiere seguimiento.` : 'No se reportaron episodios de dolor.'} El ánimo promedio es ${Number(avgMood) >= 4 ? 'bueno' : Number(avgMood) >= 3 ? 'neutral' : 'bajo'}.`
          }</p>

          <div class="footer">
            <p>Generado automáticamente por KikiCare · ${new Date().toLocaleDateString('es-AR')} · Este informe es una herramienta de apoyo clínico y no reemplaza la evaluación profesional.</p>
          </div>
        </body></html>
      `;

      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_${patient.childName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Informe descargado');
    } catch (e: any) {
      toast.error('Error generando informe');
    }
    setGeneratingReport(null);
  };

  return (
    <AppShell>
      <ScreenHeader title="Mis Pacientes" />
      <div className="px-4 pb-6">
        {/* Top add button */}
        <button onClick={() => setShowAddPatient(true)} className="btn-primary w-full text-sm mb-3">
          <Plus size={14} className="inline mr-1" /> Agregar paciente
        </button>

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
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-kiki pl-10" placeholder="Buscar paciente..." />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${gmfcsFilter !== null ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
            <Filter size={18} />
          </button>
        </div>

        {/* GMFCS Filter */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Filtrar por GMFCS</p>
            <div className="flex gap-1.5">
              {[null, 1, 2, 3, 4, 5].map(level => (
                <button key={level ?? 'all'} onClick={() => setGmfcsFilter(level)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${gmfcsFilter === level ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                  {level === null ? 'Todos' : `${level}`}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => (
              <motion.div key={p.linkId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="relative">
                  <KikiCard className="border-l-4 border-l-mint">
                    <div className="flex items-center gap-3">
                      <AvatarCircle name={p.childName} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.childName}</p>
                        <p className="text-xs text-muted-foreground">{p.diagnosis || 'Sin diagnóstico'} {p.gmfcs ? `· GMFCS ${p.gmfcs}` : ''}</p>
                        <p className="text-[10px] text-muted-foreground">Cuidador: {p.caregiverName}</p>
                        {p.status === 'pending' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pendiente</span>
                        )}
                      </div>
                    </div>
                    {/* Report button */}
                    {p.status === 'active' && p.childId && (
                      <button onClick={() => generateReport(p)}
                        disabled={generatingReport === p.linkId}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground hover:bg-muted transition-colors">
                        <FileText size={12} />
                        {generatingReport === p.linkId ? 'Generando...' : 'Descargar informe'}
                      </button>
                    )}
                  </KikiCard>
                  <button onClick={(e) => { e.stopPropagation(); showArchived ? handleRestore(p.linkId) : setActionPatient(p); }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:bg-muted z-10">
                    {showArchived ? <ArchiveRestore size={14} /> : <span className="text-xs font-bold">⋯</span>}
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
                  {showArchived ? 'No hay pacientes archivados' : 'No tenés pacientes aún'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddPatient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={() => !inviteSending && setShowAddPatient(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-[340px] shadow-kiki-lg" onClick={e => e.stopPropagation()}>
            {inviteSent ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">✉️</p>
                <h3 className="font-bold text-lg">Invitación enviada</h3>
                <p className="text-sm text-muted-foreground mt-1">El cuidador recibirá un email para vincularse.</p>
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
                    : `${confirmAction.patient.childName} será desvinculado permanentemente.`}
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
