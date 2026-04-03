import { useNavigate } from 'react-router-dom';
import { Home, Users, MessageCircle, User, TrendingUp, Trophy, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesktopSidebarProps {
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
  { icon: Trophy, label: 'Medallas', path: '/cuidadora/medals' },
  { icon: TrendingUp, label: 'Progreso', path: '/cuidadora/progress' },
  { icon: MessageCircle, label: 'Mensajes', path: '/cuidadora/messages' },
  { icon: User, label: 'Perfil', path: '/cuidadora/child' },
];

export function DesktopSidebar({ role, currentPath }: DesktopSidebarProps) {
  const navigate = useNavigate();
  const items = role === 'kinesiologist' ? kineItems : caregiverItems;

  return (
    <aside className="w-56 h-screen sticky top-0 bg-navy flex flex-col py-6 px-3">
      <div className="px-3 mb-8">
        <h2 className="text-lg font-bold text-mint">KikiCare</h2>
        <p className="text-[10px] text-navy-300 mt-0.5">
          {role === 'kinesiologist' ? 'Panel Kinesiólogo' : 'Panel Cuidador/a'}
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map(item => {
          const isActive = currentPath.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-mint/15 text-mint"
                  : "text-navy-300 hover:bg-navy-600 hover:text-mint-200"
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
