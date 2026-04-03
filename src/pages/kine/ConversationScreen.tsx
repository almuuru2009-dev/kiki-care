import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MessageBubble } from '@/components/kiki/MessageBubble';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RealMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export default function ConversationScreen() {
  const { id: partnerId } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<RealMessage[]>([]);
  const [partnerName, setPartnerName] = useState('Chat');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && partnerId) {
      loadMessages();
      loadPartnerName();
      // Mark messages as read
      supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('read', false)
        .then(() => {});
    }
  }, [user, partnerId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !partnerId) return;

    const channel = supabase
      .channel(`messages-${partnerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as RealMessage;
        if (
          (msg.sender_id === user.id && msg.receiver_id === partnerId) ||
          (msg.sender_id === partnerId && msg.receiver_id === user.id)
        ) {
          setMessages(prev => [...prev, msg]);
          // Auto-mark as read if we receive it
          if (msg.sender_id === partnerId) {
            supabase.from('messages').update({ read: true }).eq('id', msg.id).then(() => {});
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, partnerId]);

  const loadMessages = async () => {
    if (!user || !partnerId) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    setMessages(data || []);
    setLoading(false);
  };

  const loadPartnerName = async () => {
    if (!partnerId) return;
    const { data } = await supabase.from('profiles').select('name').eq('id', partnerId).single();
    if (data) setPartnerName(data.name);
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content || !user || !partnerId) return;

    setText('');
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content,
    });
  };

  let lastDate = '';

  return (
    <AppShell hideNav>
      <ScreenHeader title={partnerName} backButton />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4" style={{ height: 'calc(100vh - 140px)' }}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No hay mensajes aún. ¡Enviá el primero!</p>
          </div>
        ) : (
          messages.map(msg => {
            const msgDate = format(new Date(msg.created_at), 'dd/MM/yyyy');
            const showDateSep = msgDate !== lastDate;
            lastDate = msgDate;

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex justify-center my-3">
                    <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {format(new Date(msg.created_at), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                )}
                <MessageBubble
                  text={msg.content}
                  timestamp={msg.created_at}
                  isOwn={msg.sender_id === user?.id}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-background border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="input-kiki flex-1"
            placeholder="Escribir mensaje…"
          />
          <button
            onClick={handleSend}
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
