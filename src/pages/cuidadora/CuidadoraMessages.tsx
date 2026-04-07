import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAuthContext } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';

export default function CuidadoraMessages() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { conversations, loading } = useConversations(user?.id);

  return (
    <AppShell>
      <ScreenHeader title="Mensajes" />
      <div className="px-4 pb-6 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">No hay mensajes aún</h3>
            <p className="text-sm text-muted-foreground mt-1">Cuando tu kinesiólogo/a te escriba, verás los mensajes acá</p>
          </div>
        ) : (
          conversations.map((conv, i) => (
            <motion.div key={conv.partnerId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <KikiCard onClick={() => navigate(`/cuidadora/messages/${conv.partnerId}`)} className="flex items-center gap-3">
                <AvatarCircle name={conv.partnerName} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{conv.partnerName}</p>
                    <span className="text-[11px] text-muted-foreground shrink-0">{conv.lastTime}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-mint text-[10px] font-semibold flex items-center justify-center text-navy shrink-0">
                    {conv.unread}
                  </span>
                )}
              </KikiCard>
            </motion.div>
          ))
        )}
      </div>
    </AppShell>
  );
}
