import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface MessageBubbleProps {
  text: string;
  timestamp: string;
  isOwn: boolean;
}

export function MessageBubble({ text, timestamp, isOwn }: MessageBubbleProps) {
  const time = format(parseISO(timestamp), 'HH:mm');

  return (
    <div className={cn("flex mb-3", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[75%] px-3.5 py-2.5 rounded-2xl",
        isOwn
          ? "bg-navy text-navy-50 rounded-br-md"
          : "bg-card border border-border text-foreground rounded-bl-md"
      )}>
        <p className="text-sm leading-relaxed">{text}</p>
        <p className={cn("text-[10px] mt-1", isOwn ? "text-navy-300" : "text-muted-foreground")}>
          {time}
        </p>
      </div>
    </div>
  );
}
