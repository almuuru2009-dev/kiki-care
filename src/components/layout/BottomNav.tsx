import { useNavigate } from 'react-router-dom';
import { Home, Users, MessageCircle, User, TrendingUp, Trophy, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  role: 'kinesiologist' | 'caregiver';
  currentPath: string;
}

const kineItems = [
  { icon: Home, label: 'Inicio', path: '/kine/home' },
  { icon: Users, label: 'Pacientes', path: '/kine/patients' },
  { icon: MessageCircle, label: 'Mensajes', path: '/kine/messages' },
  { icon: BookOpen, label: 'Biblioteca', path: '/kine/exercises' },
  { icon: User, label: 'Perfil', path: '/kine/profile' },
];

const caregiverItems = [
  { icon: Home, label: 'Inicio', path: '/cuidadora/home' },
  { icon: TrendingUp, label: 'Progreso', path: '/cuidadora/progress' },
  { icon: MessageCircle, label: 'Mensajes', path: '/cuidadora/messages' },
  { icon: Trophy, label: 'Medallas', path: '/cuidadora/medals' },
  { icon: User, label: 'Perfil', path: '/cuidadora/child' },
];

export function BottomNav({ role, currentPath }: BottomNavProps) {
  const navigate = useNavigate();
  const items = role === 'kinesiologist' ? kineItems : caregiverItems;

  return (
    <div className="shrink-0 bg-navy border-t border-navy-600 safe-bottom">
      <div className="flex items-center justify-around h-[60px]">
        {items.map(item => {
          const isActive = currentPath.startsWith(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 transition-colors relative",
                isActive ? "text-mint" : "text-navy-300 hover:text-mint-200"
              )}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={cn("text-[9px]", isActive ? "font-semibold" : "font-medium")}>
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
