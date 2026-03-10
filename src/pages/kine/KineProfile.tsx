import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ChevronRight, Bell, Globe, Shield, HelpCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';

export default function KineProfile() {
  const navigate = useNavigate();
  const { currentUser, logout, sessions } = useAppStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-6">
        <motion.div className="flex flex-col items-center mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <AvatarCircle name={currentUser?.name || 'VM'} color="#7EEDC4" size="lg" />
          <h2 className="text-lg font-bold mt-3">{currentUser?.name}</h2>
          <p className="text-sm text-muted-foreground">{currentUser?.specialty}</p>
        </motion.div>

        {/* Stats */}
        <div className="flex justify-center gap-6 mb-6">
          {[
            { value: '8', label: 'Pacientes' },
            { value: sessions.length.toString(), label: 'Sesiones' },
            { value: '12', label: 'Semanas' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-2">
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
                <span className="text-sm font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </KikiCard>

          <KikiCard>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preferencias</h3>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-muted-foreground" />
                <span className="text-sm">Notificaciones</span>
              </div>
              <div className="w-10 h-6 rounded-full bg-mint relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-card shadow-sm" />
              </div>
            </div>
          </KikiCard>

          <KikiCard>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-mint-500" />
                <span className="text-sm font-medium">Plan Profesional</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-mint-100 text-mint-700 font-medium">Activo</span>
            </div>
          </KikiCard>

          <KikiCard>
            {[
              { icon: HelpCircle, label: 'Ayuda' },
              { icon: Shield, label: 'Términos y condiciones' },
              { icon: Globe, label: 'Política de privacidad' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <item.icon size={16} className="text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            ))}
          </KikiCard>

          <button
            onClick={handleLogout}
            className="w-full text-center py-3 text-sm font-medium text-rust mt-4"
          >
            <LogOut size={16} className="inline mr-2" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </AppShell>
  );
}
