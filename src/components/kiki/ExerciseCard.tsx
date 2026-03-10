import { cn } from '@/lib/utils';

interface ExerciseCardProps {
  name: string;
  duration: number;
  sets: number;
  reps: string;
  thumbnailColor: string;
  targetArea: string;
  completed?: boolean;
  onClick?: () => void;
}

export function ExerciseCard({ name, duration, sets, reps, thumbnailColor, targetArea, completed, onClick }: ExerciseCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all",
        completed ? "bg-mint-50 border border-mint-200" : "bg-card border border-border",
        onClick && "cursor-pointer active:scale-[0.98]"
      )}
    >
      <div
        className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center"
        style={{ backgroundColor: thumbnailColor + '25' }}
      >
        {completed ? (
          <svg className="w-6 h-6 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: thumbnailColor }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", completed && "text-mint-700")}>{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {duration}min · {sets}x{reps} · {targetArea}
        </p>
      </div>
    </div>
  );
}
