import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, LogOut, Bell, BellOff, Mail, ChevronRight, Settings, Volume2, VolumeX, Edit2, HelpCircle, Shield, Globe, MessageSquarePlus, UserMinus, UserPlus, Save, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import kikiGlasses from '@/assets/kiki-glasses.png';

interface ChildData {
  id: string;
  name: string;
  age: number | null;
  diagnosis: string | null;
  gmfcs: number | null;
}

interface TherapistLink {
  id: string;
  therapist_id: string;
  therapist_name: string;
  therapist_specialty: string | null;
  therapist_matricula: string | null;
}

export default function ChildProfile() {
  const navigate = useNavigate();
  const { settings, updateSettings, submitFeedback } = useAppStore();
  const { user, profile, signOut } = useAuthContext();

  // Real data state
  const [child, setChild] = useState<ChildData | null>(null);
  const [therapistLink, setTherapistLink] = useState<TherapistLink | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Child editing state
  const [editingChild, setEditingChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childDiagnosis, setChildDiagnosis] = useState('');
  const [childGmfcs, setChildGmfcs] = useState('');

  // Account editing
  const [editingAccount, setEditingAccount] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Therapist section
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  // Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
      setEditName(profile?.name || '');
      setEditEmail(profile?.email || user.email || '');
    }
  }, [user, profile]);

  const loadData = async () => {
    if (!user) return;

    // Load children
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('caregiver_id', user.id)
      .limit(1);

    if (children && children.length > 0) {
      const c = children[0];
      setChild({ id: c.id, name: c.name, age: c.age, diagnosis: c.diagnosis, gmfcs: c.gmfcs });
      setChildName(c.name);
      setChildAge(c.age?.toString() || '');
      setChildDiagnosis(c.diagnosis || '');
      setChildGmfcs(c.gmfcs?.toString() || '');
    }

    // Load therapist link
    const { data: links } = await supabase
      .from('therapist_caregiver_links')
      .select('id, therapist_id')
      .eq('caregiver_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (links && links.length > 0) {
      const link = links[0];
      const { data: therapistProfile } = await supabase
        .from('profiles')
        .select('name, specialty, matricula')
        .eq('id', link.therapist_id)
        .single();

      setTherapistLink({
        id: link.id,
        therapist_id: link.therapist_id,
        therapist_name: therapistProfile?.name || 'Kinesiólogo',
        therapist_specialty: therapistProfile?.specialty || null,
        therapist_matricula: therapistProfile?.matricula || null,
      });
    }

    setLoadingData(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveChild = async () => {
    if (!child) return;
    const { error } = await supabase
      .from('children')
      .update({
        name: childName,
        age: childAge ? parseInt(childAge) : null,
        diagnosis: childDiagnosis || null,
        gmfcs: childGmfcs ? parseInt(childGmfcs) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', child.id);

    if (error) {
      toast.error('Error al guardar');
    } else {
      setChild({ ...child, name: childName, age: childAge ? parseInt(childAge) : null, diagnosis: childDiagnosis, gmfcs: childGmfcs ? parseInt(childGmfcs) : null });
      toast.success('Información del niño actualizada');
      setEditingChild(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ name: editName, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      toast.error('Error al guardar');
    } else {
      setEditingAccount(false);
      toast.success('Cuenta actualizada');
    }
  };

  const handleUnlink = async () => {
    if (!therapistLink) return;
    const { error } = await supabase
      .from('therapist_caregiver_links')
      .update({ status: 'archived', responded_at: new Date().toISOString() })
      .eq('id', therapistLink.id);

    if (error) {
      toast.error('Error al desvincular');
    } else {
      setTherapistLink(null);
      setShowUnlinkConfirm(false);
      toast.success('Kinesiólogo desvinculado');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !user) return;
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      text: feedbackText,
      type: 'comment',
    });
    if (!error) {
      setFeedbackSent(true);
      setTimeout(() => { setShowFeedback(false); setFeedbackSent(false); setFeedbackText(''); }, 2000);
    }
  };

  const stagger = {
    container: { transition: { staggerChildren: 0.06 } },
    item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } },
  };

  if (loadingData) {
    return (
      <AppShell>
        <ScreenHeader title="Perfil" />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScreenHeader title="Perfil" />
      <motion.div className="px-4 pb-6 space-y-4" variants={stagger.container} initial="initial" animate="animate">
        {/* Child Hero */}
        <motion.div variants={stagger.item} className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-mint-100 flex items-center justify-center mb-3 relative">
            <motion.img src={kikiGlasses} alt="Kiki" className="w-16 h-16 object-contain"
              animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
          <h2 className="text-xl font-bold">{child?.name || 'Mi niño'}</h2>
          {child && <p className="text-sm text-muted-foreground">{child.age} años · {child.diagnosis}</p>}
          {child && (
            <div className="flex gap-2 mt-2">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted">GMFCS Nivel {child.gmfcs}</span>
            </div>
          )}
        </motion.div>

        {/* Child info (editable) */}
        {child && (
          <motion.div variants={stagger.item}>
            <KikiCard>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Información del niño</h3>
                <button onClick={() => {
                  if (editingChild) {
                    setChildName(child.name);
                    setChildAge(child.age?.toString() || '');
                    setChildDiagnosis(child.diagnosis || '');
                    setChildGmfcs(child.gmfcs?.toString() || '');
                  }
                  setEditingChild(!editingChild);
                }} className="text-xs text-mint-500 font-medium flex items-center gap-1">
                  {editingChild ? <><X size={12} /> Cancelar</> : <><Edit2 size={12} /> Editar</>}
                </button>
              </div>
              {editingChild ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium">Nombre</label>
                    <input className="input-kiki text-sm" value={childName} onChange={e => setChildName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium">Edad</label>
                    <input className="input-kiki text-sm" type="number" value={childAge} onChange={e => setChildAge(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium">Diagnóstico</label>
                    <select className="input-kiki text-sm" value={childDiagnosis} onChange={e => setChildDiagnosis(e.target.value)}>
                      <option value="">Seleccionar</option>
                      <option>PCI espástica bilateral</option>
                      <option>PCI espástica unilateral</option>
                      <option>PCI discinética</option>
                      <option>PCI atáxica</option>
                      <option>PCI mixta</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium">Nivel GMFCS</label>
                    <div className="flex gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map(level => (
                        <button key={level} onClick={() => setChildGmfcs(level.toString())}
                          className={`w-9 h-9 rounded-full text-xs font-bold transition-colors ${childGmfcs === level.toString() ? 'bg-mint text-navy' : 'bg-muted text-muted-foreground'}`}>
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleSaveChild} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                    <Save size={14} /> Guardar cambios
                  </button>
                </div>
              ) : (
                <>
                  {[
                    { label: 'Nombre', value: child.name },
                    { label: 'Edad', value: child.age ? `${child.age} años` : '-' },
                    { label: 'Diagnóstico', value: child.diagnosis || '-' },
                    { label: 'GMFCS', value: child.gmfcs ? `Nivel ${child.gmfcs}` : '-' },
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
        )}

        {/* No child registered */}
        {!child && (
          <motion.div variants={stagger.item}>
            <KikiCard>
              <p className="text-sm text-muted-foreground text-center py-4">
                No tenés un niño registrado aún. Tu kinesiólogo te enviará una invitación.
              </p>
            </KikiCard>
          </motion.div>
        )}

        {/* My therapist */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mi kinesiólogo</h3>
            {therapistLink ? (
              <>
                <div className="flex items-center gap-3">
                  <AvatarCircle name={therapistLink.therapist_name} color="#7EEDC4" size="md" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{therapistLink.therapist_name}</p>
                    {therapistLink.therapist_specialty && <p className="text-xs text-muted-foreground">{therapistLink.therapist_specialty}</p>}
                    {therapistLink.therapist_matricula && <p className="text-xs text-muted-foreground">{therapistLink.therapist_matricula}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigate('/cuidadora/messages/conversation')} className="btn-secondary flex-1 text-sm">
                    <Send size={14} className="inline mr-1" /> Mensaje
                  </button>
                  <button onClick={() => setShowUnlinkConfirm(true)} className="flex-1 text-sm py-2 rounded-xl border border-red-200 text-rust font-medium flex items-center justify-center gap-1">
                    <UserMinus size={14} /> Desvincular
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No tenés un kinesiólogo vinculado</p>
                <p className="text-xs text-muted-foreground mt-1">Pedile a tu kinesiólogo que te envíe una invitación por email</p>
              </div>
            )}
          </KikiCard>
        </motion.div>

        {/* My account */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mi cuenta</h3>
              <button onClick={() => { setEditingAccount(!editingAccount); setEditName(profile?.name || ''); setEditEmail(profile?.email || ''); }}
                className="text-xs text-mint-500 font-medium flex items-center gap-1">
                {editingAccount ? <><X size={12} /> Cancelar</> : <><Edit2 size={12} /> Editar</>}
              </button>
            </div>
            {editingAccount ? (
              <div className="space-y-2">
                <input className="input-kiki text-sm" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" />
                <p className="text-xs text-muted-foreground">Email: {profile?.email || user?.email}</p>
                <button onClick={handleSaveAccount} className="btn-primary w-full text-sm">Guardar</button>
              </div>
            ) : (
              <>
                {[
                  { label: 'Nombre', value: profile?.name || '-' },
                  { label: 'Email', value: profile?.email || user?.email || '-' },
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

        {/* Notification settings */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notificaciones</h3>
            {[
              { icon: Bell, label: 'Recordatorio diario', key: 'dailyReminder' },
              { icon: Mail, label: 'Mensajes del kinesiólogo', key: 'therapistMessages' },
              { icon: BellOff, label: 'Informes semanales', key: 'weeklyReports' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2"><item.icon size={14} className="text-muted-foreground" /><span className="text-sm">{item.label}</span></div>
                <button onClick={() => updateSettings(item.key, !(settings as any)[item.key])}
                  className={`w-10 h-6 rounded-full relative transition-colors ${(settings as any)[item.key] ? 'bg-mint' : 'bg-muted'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${(settings as any)[item.key] ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </KikiCard>
        </motion.div>

        {/* App settings */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Configuración</h3>
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                {settings.soundEffects ? <Volume2 size={14} className="text-muted-foreground" /> : <VolumeX size={14} className="text-muted-foreground" />}
                <span className="text-sm">Efectos de sonido</span>
              </div>
              <button onClick={() => updateSettings('soundEffects', !settings.soundEffects)}
                className={`w-10 h-6 rounded-full relative transition-colors ${settings.soundEffects ? 'bg-mint' : 'bg-muted'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${settings.soundEffects ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2"><Settings size={14} className="text-muted-foreground" /><span className="text-sm">Idioma</span></div>
              <span className="text-sm text-muted-foreground">Español 🇦🇷</span>
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

        {/* Feedback */}
        <motion.div variants={stagger.item}>
          <button onClick={() => setShowFeedback(true)} className="w-full text-center py-2 text-sm text-muted-foreground font-medium">
            <MessageSquarePlus size={14} className="inline mr-1" /> Enviar comentarios
          </button>
        </motion.div>
      </motion.div>

      {/* Unlink confirmation modal */}
      {showUnlinkConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={() => setShowUnlinkConfirm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-[340px] shadow-kiki-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">¿Desvincular kinesiólogo?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Si te desvinculás, tu kinesiólogo ya no podrá ver el progreso del niño ni enviarte planes de ejercicios. Podés vincular uno nuevo después.
            </p>
            <div className="flex gap-2">
              <button onClick={handleUnlink} className="flex-1 py-2.5 rounded-xl bg-red-50 text-rust text-sm font-medium">Desvincular</button>
              <button onClick={() => setShowUnlinkConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-muted text-sm font-medium">Cancelar</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Feedback modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={() => !feedbackSent && setShowFeedback(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-[340px] shadow-kiki-lg" onClick={e => e.stopPropagation()}>
            {feedbackSent ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">🙏</p>
                <h3 className="font-bold text-lg">Gracias por tu comentario</h3>
                <p className="text-sm text-muted-foreground mt-1">Tu opinión nos ayuda a mejorar KikiCare</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-3">Enviar comentarios</h3>
                <textarea className="input-kiki text-sm min-h-[100px] resize-none" placeholder="Escribí tu comentario, sugerencia o reporte de error…"
                  value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSubmitFeedback} className="btn-primary flex-1 text-sm" disabled={!feedbackText.trim()}>Enviar</button>
                  <button onClick={() => setShowFeedback(false)} className="btn-ghost flex-1 text-sm">Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
