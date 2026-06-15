import { formatCurrency } from '@/lib/format';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}

interface GoalMemberSplitCardProps {
  name: string;
  percentage: number;
  monthlyAmount?: number;
  accent: 'primary' | 'goal';
}

const ACCENT_STYLES: Record<GoalMemberSplitCardProps['accent'], { avatar: string; bar: string }> = {
  primary: { avatar: 'bg-primary text-primary-foreground', bar: 'bg-primary' },
  goal: { avatar: 'bg-goal text-goal-foreground', bar: 'bg-goal' },
};

// Card de divisão de contribuição de um membro do casal: percentual destacado
// e quanto precisa investir por mês para a meta dentro do prazo.
export function GoalMemberSplitCard({ name, percentage, monthlyAmount, accent }: GoalMemberSplitCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${styles.avatar}`}>
          {getInitials(name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">Contribuição combinada</p>
        </div>
        <span className="ml-auto font-display text-2xl font-semibold tabular-nums text-foreground">
          {percentage}%
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${styles.bar} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>

      {monthlyAmount !== undefined && (
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Meta mensal</span>
          <span className="font-display text-lg font-semibold tabular-nums text-foreground">
            {formatCurrency(monthlyAmount)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">/mês</span>
          </span>
        </div>
      )}
    </div>
  );
}
