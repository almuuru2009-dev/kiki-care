import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { KikiCard, AvatarCircle } from '@/components/kiki/KikiComponents';
import { useAppStore } from '@/stores/useAppStore';

export default function MessageList() {
  const navigate = useNavigate();
  const { conversations } = useAppStore();

  return (
    <AppShell>
      <ScreenHeader title="Mensajes" />

      <div className="px-4 pb-6 space-y-2">
        {conversations.map((conv, i) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <KikiCard onClick={() => navigate(`/kine/messages/${conv.id}`)} className="flex items-center gap-3">
              <AvatarCircle name={conv.caregiverName} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{conv.caregiverName}</p>
                  <span className="text-[11px] text-muted-foreground shrink-0">{conv.lastMessageTime}</span>
                </div>
                <p className="text-xs text-muted-foreground">{conv.patientName}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-mint text-[10px] font-semibold flex items-center justify-center text-navy shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </KikiCard>
          </motion.div>
        ))}
      </div>
    </AppShell>
  );
}
