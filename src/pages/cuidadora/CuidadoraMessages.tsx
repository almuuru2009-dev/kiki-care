import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/stores/useAppStore';
import { useEffect } from 'react';

export default function CuidadoraMessages() {
  const navigate = useNavigate();
  const { conversations } = useAppStore();

  // If only one conversation, go directly to it
  const caregiverConversations = conversations.filter(c => c.participants.includes('cuid-1'));

  useEffect(() => {
    if (caregiverConversations.length === 1) {
      navigate('/cuidadora/messages/conversation', { replace: true });
    }
  }, [caregiverConversations.length, navigate]);

  // If multiple conversations, show list (shouldn't normally happen for caregiver)
  if (caregiverConversations.length <= 1) {
    return <AppShell><div className="p-4 text-center text-sm text-muted-foreground">Redirigiendo...</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-6">
        <h1 className="text-lg font-semibold mb-4">Mensajes</h1>
        {caregiverConversations.map(conv => (
          <div key={conv.id} onClick={() => navigate('/cuidadora/messages/conversation')} className="card-kiki p-3 mb-2 flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-mint-100 flex items-center justify-center text-sm font-bold text-navy">
              {conv.caregiverName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Lic. Valeria Moreno</p>
              <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
            </div>
            {conv.unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-mint text-[10px] font-semibold flex items-center justify-center text-navy">{conv.unreadCount}</span>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
