import { useNavigate } from 'react-router-dom';
import { Home, Users, Bell, MessageCircle, User, TrendingUp, Trophy } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  role: 'kinesiologist' | 'caregiver';
  currentPath: string;
}

const kineItems = [
  { icon: Home, label: 'Inicio', path: '/kine/home' },
  { icon: Users, label: 'Pacientes', path: '/kine/patients' },
  { icon: Bell, label: 'Alertas', path: '/kine/alerts' },
  { icon: MessageCircle, label: 'Mensajes', path: '/kine/messages' },
  { icon: User, label: 'Perfil', path: '/kine/profile' },
];

const caregiverItems = [
  { icon: Home, label: 'Hoy', path: '/cuidadora/home' },
  { icon: TrendingUp, label: 'Progreso', path: '/cuidadora/progress' },
  { icon: MessageCircle, label: 'Mensajes', path: '/cuidadora/messages' },
  { icon: Heart, label: 'Valentín', path: '/cuidadora/child' },
];

export function BottomNav({ role, currentPath }: BottomNavProps) {
  const navigate = useNavigate();
  const { maaAlerts, conversations } = useAppStore();

  const items = role === 'kinesiologist' ? kineItems : caregiverItems;
  const activeAlerts = maaAlerts.filter(a => a.isActive).length;
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="shrink-0 bg-navy border-t border-navy-600 safe-bottom">
      <div className="flex items-center justify-around h-[60px]">
        {items.map(item => {
          const isActive = currentPath.startsWith(item.path);
          const Icon = item.icon;
          let badge = 0;
          if (item.label === 'Alertas') badge = activeAlerts;
          if (item.label === 'Mensajes') badge = unreadMessages;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors relative",
                isActive ? "text-mint" : "text-navy-300 hover:text-mint-200"
              )}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-[18px] h-[18px] rounded-full bg-rust text-[10px] font-semibold flex items-center justify-center text-background">
                    {badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-5 h-[3px] rounded-full bg-mint" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
