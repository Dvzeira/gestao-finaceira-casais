interface GoalProgressRingProps {
  value: number;
  label: string;
  sublabel: string;
}

const SIZE = 168;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Anel de progresso circular: representa visualmente o percentual concluído
// de uma meta, com o valor em destaque no centro.
export function GoalProgressRing({ value, label, sublabel }: GoalProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="relative flex size-[168px] shrink-0 items-center justify-center">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        role="img"
        aria-label={`${label} ${sublabel}`}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-goal/10"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="text-goal transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center text-center">
        <span className="font-display text-4xl font-semibold tabular-nums text-foreground">
          {label}
        </span>
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {sublabel}
        </span>
      </div>
    </div>
  );
}
