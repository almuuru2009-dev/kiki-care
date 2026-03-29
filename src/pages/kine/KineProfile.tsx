import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ChevronRight, Bell, Globe, Shield, HelpCircle, Volume2, VolumeX, Lock, CreditCard, Edit2, MessageSquarePlus, Crown } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';

export default function KineProfile() {
  const navigate = useNavigate();
  const { currentUser, logout, sessions, patients, settings, updateSettings, subscription, upgradePlan, submitFeedback, updateUserProfile } = useAppStore();
  const [editingAccount, setEditingAccount] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editInst, setEditInst] = useState(currentUser?.institution || '');
  const [editMatricula, setEditMatricula] = useState(currentUser?.matricula || '');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleSaveProfile = () => {
    updateUserProfile({ name: editName, email: editEmail, institution: editInst, matricula: editMatricula });
    setEditingAccount(false);
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
      <motion.div className="px-4 pt-6 pb-6 space-y-3" variants={stagger.container} initial="initial" animate="animate">
        <motion.div variants={stagger.item} className="flex flex-col items-center mb-4">
          <AvatarCircle name={currentUser?.name || 'VM'} color="#7EEDC4" size="lg" />
          <h2 className="text-lg font-bold mt-3">{currentUser?.name}</h2>
          <p className="text-sm text-muted-foreground">{currentUser?.specialty}</p>
        </motion.div>

        <motion.div variants={stagger.item} className="flex justify-center gap-6 mb-2">
          {[
            { value: patients.length.toString(), label: 'Pacientes' },
            { value: sessions.length.toString(), label: 'Sesiones' },
            { value: '12', label: 'Semanas' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Account */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mi cuenta</h3>
              <button onClick={() => { setEditingAccount(!editingAccount); setEditName(currentUser?.name || ''); setEditEmail(currentUser?.email || ''); setEditInst(currentUser?.institution || ''); setEditMatricula(currentUser?.matricula || ''); }}
                className="text-xs text-mint-500 font-medium flex items-center gap-1">
                <Edit2 size={12} /> {editingAccount ? 'Cancelar' : 'Editar'}
              </button>
            </div>
            {editingAccount ? (
              <div className="space-y-2">
                <input className="input-kiki text-sm" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" />
                <input className="input-kiki text-sm" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" />
                <input className="input-kiki text-sm" value={editMatricula} onChange={e => setEditMatricula(e.target.value)} placeholder="Matrícula" />
                <input className="input-kiki text-sm" value={editInst} onChange={e => setEditInst(e.target.value)} placeholder="Institución" />
                <button onClick={handleSaveProfile} className="btn-primary w-full text-sm">Guardar cambios</button>
              </div>
            ) : (
              <>
                {[
                  { label: 'Nombre', value: currentUser?.name },
                  { label: 'Email', value: currentUser?.email },
                  { label: 'Matrícula', value: currentUser?.matricula },
                  { label: 'Institución', value: currentUser?.institution },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground truncate ml-4 text-right">{item.value}</span>
                  </div>
                ))}
              </>
            )}
          </KikiCard>
        </motion.div>

        {/* Change password */}
        <motion.div variants={stagger.item}>
          <KikiCard onClick={() => navigate('/change-password')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Lock size={18} className="text-gold" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Cambiar contraseña</p>
                <p className="text-xs text-muted-foreground">Actualizá tu contraseña de acceso</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </KikiCard>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notificaciones</h3>
            {[
              { icon: Bell, label: 'Alertas MAA', key: 'dailyReminder' },
              { icon: Bell, label: 'Sesiones completadas', key: 'therapistMessages' },
              { icon: Bell, label: 'Mensajes de cuidadoras', key: 'weeklyReports' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <item.icon size={14} className="text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <button onClick={() => updateSettings(item.key, !(settings as any)[item.key])}
                  className={`w-10 h-6 rounded-full relative transition-colors ${(settings as any)[item.key] ? 'bg-mint' : 'bg-muted'}`} aria-label={`Toggle ${item.label}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${(settings as any)[item.key] ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </KikiCard>
        </motion.div>

        {/* App config */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Configuración</h3>
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                {settings.soundEffects ? <Volume2 size={14} className="text-muted-foreground" /> : <VolumeX size={14} className="text-muted-foreground" />}
                <span className="text-sm">Sonidos</span>
              </div>
              <button onClick={() => updateSettings('soundEffects', !settings.soundEffects)}
                className={`w-10 h-6 rounded-full relative transition-colors ${settings.soundEffects ? 'bg-mint' : 'bg-muted'}`} aria-label="Toggle sound">
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${settings.soundEffects ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2"><Globe size={14} className="text-muted-foreground" /><span className="text-sm">Idioma</span></div>
              <span className="text-sm text-muted-foreground">Español 🇦🇷</span>
            </div>
          </KikiCard>
        </motion.div>

        {/* Plan & Pricing */}
        <motion.div variants={stagger.item}>
          <KikiCard onClick={() => setShowPricing(!showPricing)}>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-mint-500" />
                <span className="text-sm font-medium">
                  {subscription.plan === 'free_trial' ? `Plan gratuito — ${subscription.trialDaysLeft} días restantes` :
                   subscription.plan === 'inicial' ? 'Plan Inicial — Activo' : 'Plan Pro — Activo'}
                </span>
              </div>
              <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showPricing ? 'rotate-90' : ''}`} />
            </div>
          </KikiCard>
          {showPricing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 mt-2">
              <KikiCard className="border-2 border-mint-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold">Plan Inicial</h4>
                  <span className="text-sm font-bold text-mint-600">$12.000/mes</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Hasta 10 pacientes, biblioteca completa, alertas MAA.</p>
                <button onClick={() => upgradePlan('inicial')} className={`w-full text-sm py-2 rounded-full font-medium ${subscription.plan === 'inicial' ? 'bg-muted text-muted-foreground' : 'btn-primary'}`}
                  disabled={subscription.plan === 'inicial'}>
                  {subscription.plan === 'inicial' ? 'Plan actual' : 'Elegir plan'}
                </button>
              </KikiCard>
              <KikiCard className="border-2 border-gold">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold">Plan Pro</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gold text-background font-bold">POPULAR</span>
                  </div>
                  <span className="text-sm font-bold text-gold">$20.000/mes</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Pacientes ilimitados, comunidad, protocolos compartidos, exportar informes.</p>
                <button onClick={() => upgradePlan('pro')} className={`w-full text-sm py-2 rounded-full font-medium ${subscription.plan === 'pro' ? 'bg-muted text-muted-foreground' : 'bg-gold text-background'}`}
                  disabled={subscription.plan === 'pro'}>
                  {subscription.plan === 'pro' ? 'Plan actual' : 'Elegir plan'}
                </button>
              </KikiCard>
            </motion.div>
          )}
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

        <motion.div variants={stagger.item}>
          <button onClick={handleLogout} className="w-full text-center py-3 text-sm font-medium text-rust mt-2">
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
