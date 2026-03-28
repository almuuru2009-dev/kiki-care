import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Paperclip, Image, FileText, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MessageBubble } from '@/components/kiki/MessageBubble';
import { useAppStore } from '@/stores/useAppStore';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showAttach, setShowAttach] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; type: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convId = id || 'conv-1';
  const conv = conversations.find(c => c.id === convId);
  const convMessages = messages.filter(m => m.conversationId === convId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [convMessages.length]);

  const handleSend = (msg?: string) => {
    const finalText = msg || text.trim();
    if (!finalText && !attachment) return;
    const messageText = attachment ? `📎 ${attachment.name}${finalText ? `\n${finalText}` : ''}` : finalText;
    sendMessage(convId, messageText);
    setText('');
    setShowQuick(false);
    setAttachment(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment({ name: file.name, type: file.type });
      setShowAttach(false);
    }
  };

  const headerTitle = currentUser?.role === 'kinesiologist'
    ? `${conv?.caregiverName || 'Chat'} (${conv?.patientName || ''})`
    : conv?.caregiverName || 'Chat';

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
                    {format(parseISO(msg.timestamp), "EEEE d 'de' MMMM", { locale: es })}
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

      {/* Attachment preview */}
      {attachment && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
            <FileText size={16} className="text-muted-foreground" />
            <span className="text-xs flex-1 truncate">{attachment.name}</span>
            <button onClick={() => setAttachment(null)} className="text-muted-foreground" aria-label="Quitar archivo">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Attachment sheet */}
      <AnimatePresence>
        {showAttach && (
          <>
            <motion.div className="fixed inset-0 bg-black/20 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAttach(false)} />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[390px] bg-background rounded-t-2xl p-4"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="w-8 h-1 rounded-full bg-muted mx-auto mb-4" />
              <p className="text-sm font-semibold mb-3">Adjuntar</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { fileInputRef.current?.setAttribute('accept', 'image/*'); fileInputRef.current?.click(); }}
                  className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-mint-50 flex items-center justify-center">
                    <Image size={20} className="text-mint-600" />
                  </div>
                  <span className="text-xs font-medium">Imagen</span>
                </button>
                <button
                  onClick={() => { fileInputRef.current?.setAttribute('accept', '.pdf,.doc,.docx,.xls,.xlsx'); fileInputRef.current?.click(); }}
                  className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <FileText size={20} className="text-blue-brand" />
                  </div>
                  <span className="text-xs font-medium">Archivo</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-background border-t border-border">
        <div className="flex items-center gap-2">
          <button className="text-muted-foreground p-2" aria-label="Adjuntar" onClick={() => setShowAttach(true)}>
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
            disabled={!text.trim() && !attachment}
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
