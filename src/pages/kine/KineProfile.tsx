import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ChevronRight, Bell, Globe, Shield, HelpCircle, Volume2, VolumeX, Users, BookOpen, Lock } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';

export default function KineProfile() {
  const navigate = useNavigate();
  const { currentUser, logout, sessions, patients, settings, updateSettings } = useAppStore();

  const handleLogout = () => {
    logout();
    navigate('/');
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

        {/* Stats */}
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
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mi cuenta</h3>
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
          </KikiCard>
        </motion.div>

        {/* Change password */}
        <motion.div variants={stagger.item}>
          <KikiCard onClick={() => navigate('/change-password')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Lock size={18} className="text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Cambiar contraseña</p>
                <p className="text-xs text-muted-foreground">Actualizá tu contraseña de acceso</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </KikiCard>
        </motion.div>

        {/* Exercise Library */}
        <motion.div variants={stagger.item}>
          <KikiCard onClick={() => navigate('/kine/exercises')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <BookOpen size={18} className="text-blue-brand" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Biblioteca de actividades</p>
                <p className="text-xs text-muted-foreground">Ejercicios, protocolos y comunidad</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </KikiCard>
        </motion.div>

        {/* Connected patients summary */}
        <motion.div variants={stagger.item}>
          <KikiCard onClick={() => navigate('/kine/patients')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mint-50 flex items-center justify-center">
                <Users size={18} className="text-mint-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{patients.length} pacientes activos</p>
                <p className="text-xs text-muted-foreground">Adherencia promedio: {Math.round(patients.reduce((s, p) => s + p.adherence, 0) / patients.length)}%</p>
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
                <button
                  onClick={() => updateSettings(item.key, !(settings as any)[item.key])}
                  className={`w-10 h-6 rounded-full relative transition-colors ${(settings as any)[item.key] ? 'bg-mint' : 'bg-muted'}`}
                  aria-label={`Toggle ${item.label}`}
                >
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
              <button
                onClick={() => updateSettings('soundEffects', !settings.soundEffects)}
                className={`w-10 h-6 rounded-full relative transition-colors ${settings.soundEffects ? 'bg-mint' : 'bg-muted'}`}
                aria-label="Toggle sound"
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${settings.soundEffects ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-muted-foreground" />
                <span className="text-sm">Idioma</span>
              </div>
              <span className="text-sm text-muted-foreground">Español 🇦🇷</span>
            </div>
          </KikiCard>
        </motion.div>

        {/* Plan */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-mint-500" />
                <span className="text-sm font-medium">Plan Profesional</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-mint-100 text-mint-700 font-medium">Activo</span>
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
                <div className="flex items-center gap-2">
                  <item.icon size={16} className="text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                </div>
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
      </motion.div>
    </AppShell>
  );
}
