import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ChevronRight, HelpCircle, Globe, Shield, Edit2, MessageSquarePlus, Save, X } from 'lucide-react';
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !user) return;
    await supabase.from('feedback').insert({ user_id: user.id, text: feedbackText, type: 'comment' });
    setFeedbackSent(true);
    toast.success('Gracias por tu comentario');
    setTimeout(() => { setShowFeedback(false); setFeedbackSent(false); setFeedbackText(''); }, 2000);
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
          <p className="text-sm text-muted-foreground">{profile?.specialty || 'Kinesiología'}</p>
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
                  { label: 'Especialidad', value: profile?.specialty || '-' },
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
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-3">Enviar comentarios</h3>
                <textarea className="input-kiki text-sm min-h-[100px] resize-none" placeholder="Escribí tu comentario…"
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
