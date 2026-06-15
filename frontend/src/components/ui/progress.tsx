import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentProps<'div'> {
  value: number;
}

// Barra de progresso simples (0-100), usada para acompanhar o avanço de metas.
function Progress({ value, className, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div className="h-full rounded-full bg-goal transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export { Progress };
