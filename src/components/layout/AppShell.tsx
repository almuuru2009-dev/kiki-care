import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { useAuthContext } from '@/contexts/AuthContext';

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav }: AppShellProps) {
  const { profile } = useAuthContext();
  const location = useLocation();

  const showNav = !hideNav && profile;
  const isKine = profile?.role === 'kinesiologist';
  const role = isKine ? 'kinesiologist' : 'caregiver';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      {showNav && (
        <div className="hidden md:block">
          <DesktopSidebar role={role as 'kinesiologist' | 'caregiver'} currentPath={location.pathname} />
        </div>
      )}

      {/* Main content - centered, max 420px on mobile, wider on desktop with sidebar */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        <div className="flex-1 w-full max-w-[420px] mx-auto overflow-y-auto overflow-x-hidden">
          {children}
        </div>

        {/* Bottom nav - visible on mobile only */}
        {showNav && (
          <div className="md:hidden">
            <BottomNav role={role as 'kinesiologist' | 'caregiver'} currentPath={location.pathname} />
          </div>
        )}
      </div>
    </div>
  );
}
