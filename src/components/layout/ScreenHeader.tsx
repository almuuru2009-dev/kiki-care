import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: boolean;
  rightAction?: ReactNode;
  className?: string;
  light?: boolean;
}

export function ScreenHeader({ title, subtitle, backButton, rightAction, className, light }: ScreenHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("flex items-center justify-between px-4 pt-4 pb-3", className)}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {backButton && (
          <button
            onClick={() => navigate(-1)}
            className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0",
              light ? "bg-background/10 text-background hover:bg-background/20" : "bg-muted text-foreground hover:bg-muted/80"
            )}
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className={cn("text-lg font-semibold truncate", light && "text-background")}>{title}</h1>
          {subtitle && (
            <p className={cn("text-sm truncate", light ? "text-background/70" : "text-muted-foreground")}>{subtitle}</p>
          )}
        </div>
      </div>
      {rightAction && <div className="shrink-0 ml-2">{rightAction}</div>}
    </div>
  );
}
