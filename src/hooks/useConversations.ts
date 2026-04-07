import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationSummary {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  const loadConversations = useCallback(async () => {
    if (!userId) return;

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(500);

    if (!messages || messages.length === 0) {
      setConversations([]);
      setTotalUnread(0);
      setLoading(false);
      return;
    }

    const partnerMap = new Map<string, { msgs: typeof messages; unread: number }>();
    let unreadTotal = 0;

    for (const msg of messages) {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, { msgs: [], unread: 0 });
      }
      const entry = partnerMap.get(partnerId)!;
      if (entry.msgs.length < 1) entry.msgs.push(msg); // only keep latest
      if (!msg.read && msg.receiver_id === userId) {
        entry.unread++;
        unreadTotal++;
      }
    }

    const partnerIds = Array.from(partnerMap.keys());
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', partnerIds);

    const convs: ConversationSummary[] = partnerIds.map(pid => {
      const entry = partnerMap.get(pid)!;
      const lastMsg = entry.msgs[0];
      const profile = profiles?.find(p => p.id === pid);
      return {
        partnerId: pid,
        partnerName: profile?.name || 'Usuario',
        lastMessage: lastMsg.content,
        lastTime: new Date(lastMsg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        unread: entry.unread,
      };
    });

    setConversations(convs);
    setTotalUnread(unreadTotal);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`conversations-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, loadConversations]);

  return { conversations, loading, totalUnread, reload: loadConversations };
}
