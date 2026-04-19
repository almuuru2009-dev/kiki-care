import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ChevronRight, HelpCircle, Globe, Shield, Edit2, MessageSquarePlus, Save, X, Trash2, Bell, Activity, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function KineProfile() {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile } = useAuthContext();

  const [editingAccount, setEditingAccount] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editInst, setEditInst] = useState(profile?.institution || '');
  const [editMatricula, setEditMatricula] = useState(profile?.matricula || '');
  const [editSpecialty, setEditSpecialty] = useState(profile?.specialty || '');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showMAAInfo, setShowMAAInfo] = useState(false);

  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Settings
  const [notifNewMessages, setNotifNewMessages] = useState(true);
  const [notifAlerts, setNotifAlerts] = useState(true);
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(false);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  useEffect(() => {
    setEditName(profile?.name || '');
    setEditInst(profile?.institution || '');
    setEditMatricula(profile?.matricula || '');
    setEditSpecialty(profile?.specialty || '');
  }, [profile]);

  const loadStats = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('therapist_caregiver_links')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', user.id)
      .eq('status', 'active');
    setPatientCount(count || 0);

    // Load settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (settings) {
      setNotifNewMessages(settings.therapist_messages);
      setNotifWeeklyReport(settings.weekly_reports);
    }

    setLoading(false);
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const handleSaveProfile = async () => {
    const { error } = await updateProfile({
      name: editName,
      institution: editInst,
      matricula: editMatricula,
      specialty: editSpecialty,
    });
    if (error) {
      toast.error('Error al guardar');
    } else {
      setEditingAccount(false);
      toast.success('Perfil actualizado');
    }
  };



  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      toast.success('Cuenta eliminada permanentemente');
      await signOut();
      navigate('/', { replace: true });
    } catch (e: any) {
      toast.error('Error al eliminar cuenta: ' + (e.message || 'Intenta de nuevo'));
      setDeleteLoading(false);
    }
  };

  const handleSaveSetting = async (key: string, value: boolean) => {
    if (!user) return;
    const updates: any = { [key]: value, updated_at: new Date().toISOString() };
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' });
    if (!error) toast.success('Configuración actualizada');
  };

  const stagger = {
    container: { transition: { staggerChildren: 0.06 } },
    item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } },
  };

  return (
    <AppShell>
      <ScreenHeader title="Mi Perfil" />

      <motion.div className="px-4 pb-6 space-y-4" variants={stagger.container} initial="initial" animate="animate">
        {/* Avatar */}
        <motion.div variants={stagger.item} className="flex flex-col items-center">
          <AvatarCircle name={profile?.name || 'K'} color="#7EEDC4" size="lg" />
          <h2 className="text-xl font-bold mt-3">{profile?.name || 'Kinesiólogo'}</h2>
          <p className="text-sm text-muted-foreground">{profile?.specialty || 'Sin especialidad asignada'}</p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger.item}>
          <div className="flex gap-3 justify-center">
            <div className="text-center px-4 py-2 rounded-xl bg-mint-50">
              <p className="text-lg font-bold text-mint-700">{patientCount}</p>
              <p className="text-[10px] text-muted-foreground">Pacientes</p>
            </div>
          </div>
        </motion.div>

        {/* Account info */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mi cuenta</h3>
              <button onClick={() => {
                if (editingAccount) { setEditName(profile?.name || ''); setEditInst(profile?.institution || ''); setEditMatricula(profile?.matricula || ''); setEditSpecialty(profile?.specialty || ''); }
                setEditingAccount(!editingAccount);
              }} className="text-xs text-mint-500 font-medium flex items-center gap-1">
                {editingAccount ? <><X size={12} /> Cancelar</> : <><Edit2 size={12} /> Editar</>}
              </button>
            </div>
            {editingAccount ? (
              <div className="space-y-2">
                <div><label className="text-[10px] text-muted-foreground">Nombre</label><input className="input-kiki text-sm" value={editName} onChange={e => setEditName(e.target.value)} /></div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Especialidad</label>
                  <select className="input-kiki text-sm" value={editSpecialty} onChange={e => setEditSpecialty(e.target.value)}>
                    <option value="">Seleccionar</option>
                    <option>Kinesiología Pediátrica</option>
                    <option>Kinesiología Neurológica</option>
                    <option>Fisioterapia general</option>
                  </select>
                </div>
                <div><label className="text-[10px] text-muted-foreground">Institución</label><input className="input-kiki text-sm" value={editInst} onChange={e => setEditInst(e.target.value)} /></div>
                <div><label className="text-[10px] text-muted-foreground">Matrícula</label><input className="input-kiki text-sm" value={editMatricula} onChange={e => setEditMatricula(e.target.value)} /></div>
                <p className="text-xs text-muted-foreground">Email: {profile?.email}</p>
                <button onClick={handleSaveProfile} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                  <Save size={14} /> Guardar
                </button>
              </div>
            ) : (
              <>
                {[
                  { label: 'Nombre', value: profile?.name || '-' },
                  { label: 'Email', value: profile?.email || '-' },
                  { label: 'Especialidad', value: profile?.specialty || 'Sin especialidad' },
                  { label: 'Institución', value: profile?.institution || '-' },
                  { label: 'Matrícula', value: profile?.matricula || '-' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </>
            )}
          </KikiCard>
        </motion.div>

        {/* KAE Engine Info */}
        <motion.div variants={stagger.item}>
          <KikiCard onClick={() => setShowMAAInfo(!showMAAInfo)} className="cursor-pointer bg-gradient-to-r from-blue-50 to-mint-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">Kiki Adherence Engine (KAE)</h3>
                <p className="text-[10px] text-muted-foreground">Sistema inteligente de seguimiento de pacientes</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
            {showMAAInfo && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3 border-t border-border space-y-2">
                <p className="text-xs text-foreground">El KAE analiza automáticamente el comportamiento de cada familia para detectar riesgo de abandono terapéutico.</p>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-foreground">Variables analizadas:</p>
                  {[
                    { label: 'Frecuencia de sesiones', weight: '40%' },
                    { label: 'Días de inactividad', weight: '30%' },
                    { label: 'Duración de sesiones', weight: '20%' },
                    { label: 'Tiempo de respuesta', weight: '10%' },
                  ].map(v => (
                    <div key={v.label} className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">{v.label}</span>
                      <span className="font-medium">{v.weight}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-foreground">Niveles de riesgo:</p>
                  <div className="flex gap-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-mint-100 text-mint-700">Bajo (0-40)</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Moderado (41-69)</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-rust">Alto (70-100)</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">Las alertas se muestran en la pantalla de inicio cuando se detecta riesgo moderado o alto en algún paciente.</p>
              </motion.div>
            )}
          </KikiCard>
        </motion.div>

        {/* Notifications & Settings */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Bell size={12} className="inline mr-1" /> Notificaciones
            </h3>
            {[
              { label: 'Mensajes nuevos', value: notifNewMessages, onChange: (v: boolean) => { setNotifNewMessages(v); handleSaveSetting('therapist_messages', v); } },
              { label: 'Alertas KAE (adherencia)', value: notifAlerts, onChange: (v: boolean) => { setNotifAlerts(v); handleSaveSetting('daily_reminder', v); } },
              { label: 'Reporte semanal', value: notifWeeklyReport, onChange: (v: boolean) => { setNotifWeeklyReport(v); handleSaveSetting('weekly_reports', v); } },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{item.label}</span>
                <button onClick={() => item.onChange(!item.value)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${item.value ? 'bg-mint' : 'bg-muted'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-all ${item.value ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </KikiCard>
        </motion.div>

        {/* Change password */}
        <motion.div variants={stagger.item}>
          <KikiCard onClick={() => navigate('/change-password')} className="cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cambiar contraseña</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </KikiCard>
        </motion.div>

        {/* Legal */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            {[
              { icon: HelpCircle, label: 'Ayuda', path: '/faq' },
              { icon: Shield, label: 'Términos y condiciones', path: '/terms' },
              { icon: Globe, label: 'Política de privacidad', path: '/privacy' },
            ].map(item => (
              <div key={item.label} onClick={() => navigate(item.path)} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 cursor-pointer">
                <div className="flex items-center gap-2"><item.icon size={16} className="text-muted-foreground" /><span className="text-sm">{item.label}</span></div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            ))}
          </KikiCard>
        </motion.div>




        {/* Logout */}
        <motion.div variants={stagger.item}>
          <button onClick={handleLogout} className="w-full text-center py-3 text-sm font-medium text-rust">
            <LogOut size={16} className="inline mr-2" /> Cerrar sesión
          </button>
        </motion.div>

        {/* Delete account - hide for demo */}
        {profile?.email && !profile.email.includes('kikiapp.com') && !profile.email.includes('demo.kikicare.com') && (
          <motion.div variants={stagger.item}>
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-center py-2 text-sm text-muted-foreground/60">
              <Trash2 size={12} className="inline mr-1" /> Eliminar cuenta
            </button>
          </motion.div>
        )}


      </motion.div>



      {/* Delete account confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6" onClick={() => !deleteLoading && setShowDeleteConfirm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-[340px] shadow-kiki-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={24} className="text-rust" />
              </div>
              <div>
                <h3 className="font-bold text-base">¿Eliminar cuenta?</h3>
                <p className="text-xs text-muted-foreground">Esta acción es irreversible</p>
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-rust">Al eliminar tu cuenta:</p>
              <ul className="text-xs text-rust mt-1 space-y-0.5 list-disc pl-4">
                <li>Se eliminarán todos tus datos</li>
                <li>Se desvincularán todos tus pacientes</li>
                <li>Se borrarán todos los mensajes</li>
                <li>Se eliminará tu email del sistema</li>
                <li>No podrás recuperar esta cuenta</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-rust disabled:opacity-60">
                {deleteLoading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-muted text-muted-foreground">
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
