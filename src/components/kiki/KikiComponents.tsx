import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface KikiCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function KikiCard({ children, className, onClick }: KikiCardProps) {
  return (
    <div
      className={cn("bg-card rounded-xl shadow-kiki p-4", onClick && "cursor-pointer active:scale-[0.98] transition-transform", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatBadgeProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  color?: string;
}

export function StatBadge({ value, label, icon, color = 'bg-mint-50' }: StatBadgeProps) {
  return (
    <div className={cn("rounded-xl p-3 min-w-[110px]", color)}>
      {icon && <div className="mb-1">{icon}</div>}
      <p className="text-xl font-semibold text-foreground animate-count-up">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

interface AdherenceBarProps {
  percent: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function AdherenceBar({ percent, showLabel = true, size = 'md' }: AdherenceBarProps) {
  const color = percent >= 75 ? 'bg-mint' : percent >= 50 ? 'bg-gold' : 'bg-rust';
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Adherencia</span>
          <span className="font-medium">{percent}%</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted", h)}>
        <div
          className={cn("rounded-full transition-all animate-bar-grow", h, color)}
          style={{ '--bar-width': `${percent}%`, width: `${percent}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

interface RiskBadgeProps {
  level: 'BAJO' | 'MODERADO' | 'ALTO';
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const styles = {
    BAJO: 'bg-mint-100 text-mint-700',
    MODERADO: 'bg-amber-100 text-amber-700',
    ALTO: 'bg-red-100 text-red-700 animate-alert-pulse',
  };

  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide", styles[level])}>
      {level}
    </span>
  );
}

interface AvatarCircleProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarCircle({ name, color = '#7EEDC4', size = 'md' }: AvatarCircleProps) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };

  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-semibold shrink-0", sizes[size])}
      style={{ backgroundColor: color + '30', color }}
    >
      {initials}
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      {action}
    </div>
  );
}
