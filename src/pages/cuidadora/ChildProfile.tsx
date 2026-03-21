import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, LogOut, Bell, BellOff, Mail, ChevronRight, Settings, Volume2, VolumeX, Trophy, Heart } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';
import kikiMascot from '@/assets/kiki-mascot.png';

export default function ChildProfile() {
  const navigate = useNavigate();
  const { patients, milestones, medals, currentUser, logout, settings, updateSettings, sessions } = useAppStore();
  const child = patients.find(p => p.id === 'pat-1')!;
  const childMilestones = milestones.filter(m => m.patientId === 'pat-1');
  const earnedMedals = medals.filter(m => m.patientId === 'pat-1' && m.earned);
  const totalSessions = sessions.filter(s => s.patientId === 'pat-1').length;

  const handleLogout = () => { logout(); navigate('/'); };

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
            <motion.img
              src={kikiMascot}
              alt="Kiki"
              className="w-16 h-16 object-contain"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-mint flex items-center justify-center text-xs font-bold text-navy shadow-md">
              {earnedMedals.length}🏅
            </div>
          </div>
          <h2 className="text-xl font-bold">{child.name}</h2>
          <p className="text-sm text-muted-foreground">{child.age} años · {child.diagnosis}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted">GMFCS Nivel {child.gmfcs}</span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-mint-100 text-mint-700">{totalSessions} sesiones</span>
          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div variants={stagger.item} className="flex gap-3">
          <div className="flex-1 rounded-xl bg-mint-50 p-3 text-center">
            <p className="text-lg font-bold text-navy">{child.adherence}%</p>
            <p className="text-[10px] text-muted-foreground">Adherencia</p>
          </div>
          <div className="flex-1 rounded-xl bg-blue-50 p-3 text-center">
            <p className="text-lg font-bold text-navy">{child.sessionsPerWeek}</p>
            <p className="text-[10px] text-muted-foreground">Sesiones/sem</p>
          </div>
          <div className="flex-1 rounded-xl bg-amber-50 p-3 text-center">
            <p className="text-lg font-bold text-navy">{earnedMedals.length}</p>
            <p className="text-[10px] text-muted-foreground">Medallas</p>
          </div>
        </motion.div>

        {/* Current plan */}
        <motion.div variants={stagger.item}>
          <KikiCard className="bg-navy">
            <h3 className="text-sm font-semibold text-navy-50">Plan actual</h3>
            <p className="text-xs text-navy-300 mt-0.5">Fortalecimiento miembro inferior · 5x/semana</p>
            <p className="text-xs text-navy-300 mt-0.5">Asignado por Lic. Valeria Moreno</p>
            <p className="text-xs text-navy-300 mt-1">En curso desde hace 8 semanas</p>
          </KikiCard>
        </motion.div>

        {/* Medals preview */}
        <motion.div variants={stagger.item}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Medallas de Kiki</h3>
            <button onClick={() => navigate('/cuidadora/medals')} className="text-xs text-mint-600 font-medium flex items-center gap-0.5">
              Ver todas <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            {earnedMedals.slice(0, 5).map(medal => (
              <motion.div
                key={medal.id}
                whileHover={{ scale: 1.05 }}
                className="min-w-[72px] rounded-xl bg-gradient-to-br from-mint-200 to-mint-100 p-2.5 text-center shadow-sm"
              >
                <span className="text-2xl">{medal.icon}</span>
                <p className="text-[9px] font-semibold mt-1 text-navy leading-tight">{medal.title}</p>
              </motion.div>
            ))}
            <button
              onClick={() => navigate('/cuidadora/medals')}
              className="min-w-[72px] rounded-xl border-2 border-dashed border-muted p-2.5 flex flex-col items-center justify-center"
            >
              <Trophy size={18} className="text-muted-foreground" />
              <p className="text-[9px] text-muted-foreground font-medium mt-1">+{medals.filter(m => !m.earned).length} más</p>
            </button>
          </div>
        </motion.div>

        {/* Milestones */}
        <motion.div variants={stagger.item}>
          <h3 className="text-sm font-semibold mb-2">Logros</h3>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
            {childMilestones.map(ms => (
              <div key={ms.id} className={`min-w-[140px] card-kiki p-3 ${ms.achieved ? 'border border-mint-200 bg-mint-50' : 'opacity-60'}`}>
                <span className="text-lg">{ms.achieved ? '✓' : '○'}</span>
                <p className="text-xs font-medium mt-1">{ms.title}</p>
                {ms.date && <p className="text-[10px] text-muted-foreground mt-0.5">{ms.date}</p>}
                {!ms.achieved && <p className="text-[10px] text-mint-600 mt-0.5">Próximo objetivo</p>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* My therapist */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mi kinesiólogo</h3>
            <div className="flex items-center gap-3">
              <AvatarCircle name="Valeria Moreno" color="#7EEDC4" size="md" />
              <div className="flex-1">
                <p className="text-sm font-medium">Lic. Valeria Moreno</p>
                <p className="text-xs text-muted-foreground">Kinesiología Pediátrica</p>
                <p className="text-xs text-muted-foreground">Próxima consulta: Mié 5 mar</p>
              </div>
            </div>
            <button onClick={() => navigate('/cuidadora/messages/conversation')} className="btn-secondary w-full mt-3 text-sm">
              <Send size={14} className="inline mr-1" /> Enviar mensaje
            </button>
          </KikiCard>
        </motion.div>

        {/* My account */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mi cuenta</h3>
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

        {/* App settings */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Configuración</h3>
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                {settings.soundEffects ? <Volume2 size={14} className="text-muted-foreground" /> : <VolumeX size={14} className="text-muted-foreground" />}
                <span className="text-sm">Efectos de sonido</span>
              </div>
              <button
                onClick={() => updateSettings('soundEffects', !settings.soundEffects)}
                className={`w-10 h-6 rounded-full relative transition-colors ${settings.soundEffects ? 'bg-mint' : 'bg-muted'}`}
                aria-label="Toggle sound effects"
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${settings.soundEffects ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-muted-foreground" />
                <span className="text-sm">Idioma</span>
              </div>
              <span className="text-sm text-muted-foreground">Español 🇦🇷</span>
            </div>
          </KikiCard>
        </motion.div>

        {/* Legal */}
        <motion.div variants={stagger.item}>
          <KikiCard>
            {['Ayuda', 'Términos y condiciones', 'Política de privacidad'].map(label => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <span className="text-sm">{label}</span>
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
      </motion.div>
    </AppShell>
  );
}
