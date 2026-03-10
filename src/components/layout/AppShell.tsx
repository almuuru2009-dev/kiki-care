import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useAppStore } from '@/stores/useAppStore';

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav }: AppShellProps) {
  const { currentUser } = useAppStore();
  const location = useLocation();

  const showNav = !hideNav && currentUser;
  const isKine = currentUser?.role === 'kinesiologist';

  return (
    <div className="mobile-frame flex flex-col min-h-screen bg-background">
      {/* Status bar simulation */}
      <div className="h-11 bg-navy flex items-center justify-between px-5 shrink-0">
        <span className="text-[13px] font-medium text-mint-200">
          {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex items-center gap-1">
          <div className="flex gap-[2px]">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-[3px] rounded-full bg-mint-200" style={{ height: `${6 + i * 2}px` }} />
            ))}
          </div>
          <svg className="w-5 h-3 ml-1 text-mint-200" fill="currentColor" viewBox="0 0 24 14">
            <rect x="0" y="0" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="2" y="2" width="14" height="10" rx="1" fill="currentColor" />
            <rect x="21" y="4" width="3" height="6" rx="1" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>

      {/* Bottom nav */}
      {showNav && (
        <BottomNav role={isKine ? 'kinesiologist' : 'caregiver'} currentPath={location.pathname} />
      )}
    </div>
  );
}
