import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Users, MessageCircle, User, TrendingUp, Trophy, BookOpen, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface BottomNavProps {
  role: 'kinesiologist' | 'caregiver';
  currentPath: string;
}

const kineItems = [
  { icon: Home, label: 'Inicio', path: '/kine/home' },
  { icon: Users, label: 'Pacientes', path: '/kine/patients' },
  { icon: CalendarDays, label: 'Agenda', path: '/kine/agenda' },
  { icon: MessageCircle, label: 'Mensajes', path: '/kine/messages', badge: true },
  { icon: BookOpen, label: 'Biblioteca', path: '/kine/exercises' },
];

const caregiverItems = [
  { icon: Home, label: 'Inicio', path: '/cuidadora/home' },
  { icon: TrendingUp, label: 'Progreso', path: '/cuidadora/progress' },
  { icon: MessageCircle, label: 'Mensajes', path: '/cuidadora/messages', badge: true },
  { icon: Trophy, label: 'Medallas', path: '/cuidadora/medals' },
  { icon: User, label: 'Perfil', path: '/cuidadora/child' },
];


export function BottomNav({ role, currentPath }: BottomNavProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const items = role === 'kinesiologist' ? kineItems : caregiverItems;

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);
      setUnreadCount(count || 0);
    };
    fetchUnread();

    // Realtime subscription for messages
    const channel = supabase
      .channel('unread-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchUnread())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="shrink-0 bg-navy border-t border-navy-600 safe-bottom">
      <div className="flex items-center justify-around h-[60px]">
        {items.map(item => {
          const isActive = currentPath.startsWith(item.path);
          const Icon = item.icon;
          const showBadge = 'badge' in item && item.badge && unreadCount > 0;

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
                {showBadge && (
                  <div className="absolute -top-1 -right-2 min-w-[14px] h-[14px] rounded-full bg-rust flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </div>
                )}
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
