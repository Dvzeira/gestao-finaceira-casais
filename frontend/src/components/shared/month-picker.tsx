import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatMonthYear } from '@/lib/format';

interface MonthPickerProps {
  value: string; // yyyy-MM
  onChange: (value: string) => void;
}

// Navegação de mês reutilizada por receitas, despesas e dashboard para
// filtrar registros pelo mês de referência.
export function MonthPicker({ value, onChange }: MonthPickerProps) {
  function shiftMonth(delta: number) {
    const [year, month] = value.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onChange(newValue);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => shiftMonth(-1)}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-32 text-center text-sm font-medium text-foreground">
        {formatMonthYear(`${value}-01`)}
      </span>
      <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => shiftMonth(1)}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
