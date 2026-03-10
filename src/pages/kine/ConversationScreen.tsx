import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Paperclip } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MessageBubble } from '@/components/kiki/MessageBubble';
import { useAppStore } from '@/stores/useAppStore';
import { format, parseISO } from 'date-fns';

const quickReplies = [
  '¿Cómo estuvo la sesión de hoy?',
  'Recuerden hacer la rutina mañana',
  'Buenas noticias del progreso',
];

export default function ConversationScreen() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, messages, conversations, sendMessage } = useAppStore();
  const [text, setText] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const convId = id || 'conv-1';
  const conv = conversations.find(c => c.id === convId);
  const convMessages = messages.filter(m => m.conversationId === convId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [convMessages.length]);

  const handleSend = (msg?: string) => {
    const finalText = msg || text.trim();
    if (!finalText) return;
    sendMessage(convId, finalText);
    setText('');
    setShowQuick(false);
  };

  const headerTitle = currentUser?.role === 'kinesiologist'
    ? `${conv?.caregiverName || 'Chat'} (${conv?.patientName || ''})`
    : conv?.caregiverName || 'Chat';

  // Group messages by date
  let lastDate = '';

  return (
    <AppShell hideNav>
      <ScreenHeader title={headerTitle} backButton />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4" style={{ height: 'calc(100vh - 200px)' }}>
        {convMessages.map(msg => {
          const msgDate = format(parseISO(msg.timestamp), 'dd/MM/yyyy');
          const showDateSep = msgDate !== lastDate;
          lastDate = msgDate;

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="flex justify-center my-3">
                  <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {format(parseISO(msg.timestamp), 'EEEE d MMM')}
                  </span>
                </div>
              )}
              <MessageBubble
                text={msg.text}
                timestamp={msg.timestamp}
                isOwn={msg.senderId === currentUser?.id}
              />
            </div>
          );
        })}
      </div>

      {/* Quick replies */}
      {showQuick && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
          {quickReplies.map(qr => (
            <button
              key={qr}
              onClick={() => handleSend(qr)}
              className="text-xs px-3 py-1.5 rounded-full bg-mint-50 text-mint-700 whitespace-nowrap shrink-0 border border-mint-200"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-background border-t border-border">
        <div className="flex items-center gap-2">
          <button className="text-muted-foreground p-2" aria-label="Adjuntar">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onFocus={() => setShowQuick(true)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="input-kiki flex-1"
            placeholder="Escribir mensaje…"
          />
          <button
            onClick={() => handleSend()}
            disabled={!text.trim()}
            className="w-10 h-10 rounded-full bg-mint flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            aria-label="Enviar"
          >
            <Send size={18} className="text-navy" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
