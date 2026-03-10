import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';

export default function CuidadoraMessages() {
  const navigate = useNavigate();
  const { conversations } = useAppStore();
  const conv = conversations.find(c => c.id === 'conv-1');

  return (
    <AppShell>
      <ScreenHeader title="Mensajes" />
      <div className="px-4 pb-6">
        {conv && (
          <KikiCard onClick={() => navigate('/cuidadora/messages/conversation')} className="flex items-center gap-3">
            <AvatarCircle name="Valeria Moreno" size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Lic. Valeria Moreno</p>
              <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
            </div>
            {conv.unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-mint text-[10px] font-semibold flex items-center justify-center text-navy">
                {conv.unreadCount}
              </span>
            )}
          </KikiCard>
        )}
      </div>
    </AppShell>
  );
}
