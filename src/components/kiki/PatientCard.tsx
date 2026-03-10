import { cn } from '@/lib/utils';
import { AvatarCircle, AdherenceBar, RiskBadge } from './KikiComponents';
import type { Patient } from '@/lib/types';

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
  compact?: boolean;
}

export function PatientCard({ patient, onClick, compact }: PatientCardProps) {
  if (compact) {
    return (
      <div onClick={onClick} className="min-w-[140px] card-kiki p-3 cursor-pointer active:scale-[0.97] transition-transform">
        <AvatarCircle name={patient.name} color={patient.avatarColor} size="sm" />
        <p className="text-sm font-medium mt-2 truncate">{patient.name.split(' ')[0]}</p>
        <p className="text-[11px] text-muted-foreground">{patient.adherence}% adherencia</p>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="card-kiki p-4 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start gap-3">
        <AvatarCircle name={patient.name} color={patient.avatarColor} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">{patient.name}</p>
            <RiskBadge level={
              patient.adherence >= 75 ? 'BAJO' : patient.adherence >= 50 ? 'MODERADO' : 'ALTO'
            } />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {patient.age} años · {patient.diagnosis}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            GMFCS {patient.gmfcs} · Hace {patient.lastSessionDaysAgo === 0 ? 'hoy' : `${patient.lastSessionDaysAgo} días`}
          </p>
          <div className="mt-2">
            <AdherenceBar percent={patient.adherence} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
