import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, LogOut, Bell, BellOff, Mail, ChevronRight, Settings, Volume2, VolumeX, Edit2, HelpCircle, Shield, Globe, MessageSquarePlus, UserMinus, UserPlus, Save, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
import kikiGlasses from '@/assets/kiki-glasses.png';

export default function ChildProfile() {
  const navigate = useNavigate();
  const { patients, currentUser, logout, settings, updateSettings, sessions, updateUserProfile, submitFeedback } = useAppStore();
  const child = patients.find(p => p.id === 'pat-1')!;
  const totalSessions = sessions.filter(s => s.patientId === 'pat-1').length;

  // Child editing state
  const [editingChild, setEditingChild] = useState(false);
  const [childName, setChildName] = useState(child?.name || '');
  const [childAge, setChildAge] = useState(child?.age?.toString() || '');
  const [childDiagnosis, setChildDiagnosis] = useState(child?.diagnosis || '');
  const [childGmfcs, setChildGmfcs] = useState(child?.gmfcs?.toString() || '');

  // Account editing
  const [editingAccount, setEditingAccount] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');

  // Therapist section
  const [therapistLinked, setTherapistLinked] = useState(true);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkCode, setLinkCode] = useState('');

  // Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleSaveChild = () => {
    // In a real app this would update the database
    toast.success('Información del niño actualizada');
    setEditingChild(false);
  };

  const handleSaveAccount = () => {
    updateUserProfile({ name: editName, email: editEmail });
    setEditingAccount(false);
    toast.success('Cuenta actualizada');
  };

  const handleUnlink = () => {
    setTherapistLinked(false);
    setShowUnlinkConfirm(false);
    toast.success('Kinesiólogo desvinculado');
  };

  const handleLink = () => {
    if (!linkCode.trim()) return;
    setTherapistLinked(true);
    setShowLinkInput(false);
    setLinkCode('');
    toast.success('Solicitud de vínculo enviada');
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) return;
    submitFeedback(feedbackText);
    setFeedbackSent(true);
    setTimeout(() => { setShowFeedback(false); setFeedbackSent(false); setFeedbackText(''); }, 2000);
  };

  const stagger = {
    container: { transition: { staggerChildren: 0.06 } },
    item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } },
  };

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
          <p className="text-sm text-muted-foreground">{child?.age} años · {child?.diagnosis}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted">GMFCS Nivel {child?.gmfcs}</span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-mint-100 text-mint-700">{totalSessions} sesiones</span>
          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div variants={stagger.item} className="flex gap-3">
          <div className="flex-1 rounded-xl bg-mint-50 p-3 text-center">
            <p className="text-lg font-bold text-navy">{child?.adherence}%</p>
            <p className="text-[10px] text-muted-foreground">Adherencia</p>
          </div>
          <div className="flex-1 rounded-xl bg-blue-50 p-3 text-center">
            <p className="text-lg font-bold text-navy">{child?.sessionsPerWeek}</p>
            <p className="text-[10px] text-muted-foreground">Sesiones/sem</p>
          </div>
        </motion.div>

        {/* Child info (editable) */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Información del niño</h3>
              <button onClick={() => {
                if (editingChild) {
                  // Cancel
                  setChildName(child?.name || '');
                  setChildAge(child?.age?.toString() || '');
                  setChildDiagnosis(child?.diagnosis || '');
                  setChildGmfcs(child?.gmfcs?.toString() || '');
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
                  <input className="input-kiki text-sm" value={childDiagnosis} onChange={e => setChildDiagnosis(e.target.value)} />
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
                  { label: 'Nombre', value: child?.name },
                  { label: 'Edad', value: `${child?.age} años` },
                  { label: 'Diagnóstico', value: child?.diagnosis },
                  { label: 'GMFCS', value: `Nivel ${child?.gmfcs}` },
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

        {/* My therapist */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mi kinesiólogo</h3>
            {therapistLinked ? (
              <>
                <div className="flex items-center gap-3">
                  <AvatarCircle name="Valeria Moreno" color="#7EEDC4" size="md" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Lic. Valeria Moreno</p>
                    <p className="text-xs text-muted-foreground">Kinesiología Pediátrica</p>
                    <p className="text-xs text-muted-foreground">MN-48291</p>
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
                <p className="text-sm text-muted-foreground mb-3">No tenés un kinesiólogo vinculado</p>
                {showLinkInput ? (
                  <div className="space-y-2">
                    <input className="input-kiki text-sm text-center" placeholder="Código de vinculación" value={linkCode} onChange={e => setLinkCode(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground">Pedile el código a tu kinesiólogo o esperá su invitación por email</p>
                    <div className="flex gap-2">
                      <button onClick={handleLink} className="btn-primary flex-1 text-sm" disabled={!linkCode.trim()}>Vincular</button>
                      <button onClick={() => setShowLinkInput(false)} className="btn-ghost flex-1 text-sm">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowLinkInput(true)} className="btn-primary text-sm px-6">
                    <UserPlus size={14} className="inline mr-1" /> Vincular kinesiólogo
                  </button>
                )}
              </div>
            )}
          </KikiCard>
        </motion.div>

        {/* My account */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mi cuenta</h3>
              <button onClick={() => { setEditingAccount(!editingAccount); setEditName(currentUser?.name || ''); setEditEmail(currentUser?.email || ''); }}
                className="text-xs text-mint-500 font-medium flex items-center gap-1">
                {editingAccount ? <><X size={12} /> Cancelar</> : <><Edit2 size={12} /> Editar</>}
              </button>
            </div>
            {editingAccount ? (
              <div className="space-y-2">
                <input className="input-kiki text-sm" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" />
                <input className="input-kiki text-sm" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" />
                <button onClick={handleSaveAccount} className="btn-primary w-full text-sm">Guardar</button>
              </div>
            ) : (
              <>
                {[
                  { label: 'Nombre', value: currentUser?.name },
                  { label: 'Email', value: currentUser?.email },
                  { label: 'Relación', value: 'Madre' },
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
                  className={`w-10 h-6 rounded-full relative transition-colors ${(settings as any)[item.key] ? 'bg-mint' : 'bg-muted'}`} aria-label={`Toggle ${item.label}`}>
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
                className={`w-10 h-6 rounded-full relative transition-colors ${settings.soundEffects ? 'bg-mint' : 'bg-muted'}`} aria-label="Toggle sound effects">
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
