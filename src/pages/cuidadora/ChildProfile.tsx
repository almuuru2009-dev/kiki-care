import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Send, LogOut, Bell, BellOff, Mail } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';
import kikiMascot from '@/assets/kiki-mascot.png';

export default function ChildProfile() {
  const navigate = useNavigate();
  const { patients, milestones, currentUser, logout } = useAppStore();
  const child = patients.find(p => p.id === 'pat-1')!;
  const childMilestones = milestones.filter(m => m.patientId === 'pat-1');

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <AppShell>
      <ScreenHeader title="Perfil de Valentín" />
      <div className="px-4 pb-6 space-y-4">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-mint-100 flex items-center justify-center mb-3 relative">
            <img src={kikiMascot} alt="Kiki" className="w-14 h-14 object-contain" />
          </div>
          <h2 className="text-xl font-bold">{child.name}</h2>
          <p className="text-sm text-muted-foreground">{child.age} años · {child.diagnosis}</p>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted mt-1">GMFCS Nivel {child.gmfcs}</span>
        </motion.div>

        {/* Current plan */}
        <KikiCard className="bg-navy">
          <h3 className="text-sm font-semibold text-navy-50">Plan actual</h3>
          <p className="text-xs text-navy-300 mt-0.5">Fortalecimiento miembro inferior · 5x/semana</p>
          <p className="text-xs text-navy-300 mt-0.5">Asignado por Lic. Valeria Moreno</p>
          <p className="text-xs text-navy-300 mt-1">En curso desde hace 8 semanas</p>
        </KikiCard>

        {/* Milestones */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Logros</h3>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
            {childMilestones.map(ms => (
              <div key={ms.id} className={`min-w-[150px] card-kiki p-3 ${ms.achieved ? 'border border-mint-200 bg-mint-50' : 'opacity-60'}`}>
                <span className="text-lg">{ms.achieved ? '✓' : '○'}</span>
                <p className="text-xs font-medium mt-1">{ms.title}</p>
                {ms.date && <p className="text-[10px] text-muted-foreground mt-0.5">{ms.date}</p>}
                {!ms.achieved && <p className="text-[10px] text-mint-600 mt-0.5">Próximo objetivo</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Therapist */}
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

        {/* Settings */}
        <KikiCard>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notificaciones</h3>
          {[
            { icon: Bell, label: 'Recordatorio diario', on: true },
            { icon: Mail, label: 'Mensajes del kinesiólogo', on: true },
            { icon: BellOff, label: 'Informes semanales', on: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <item.icon size={14} className="text-muted-foreground" />
                <span className="text-sm">{item.label}</span>
              </div>
              <div className={`w-9 h-5 rounded-full relative cursor-pointer ${item.on ? 'bg-mint' : 'bg-muted'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${item.on ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </KikiCard>

        <button onClick={handleLogout} className="w-full text-center py-3 text-sm font-medium text-rust">
          <LogOut size={16} className="inline mr-2" /> Cerrar sesión
        </button>
      </div>
    </AppShell>
  );
}
