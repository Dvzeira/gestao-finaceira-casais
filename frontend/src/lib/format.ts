// Helpers centralizados de formatação de moeda e data, usados em todas as
// features para evitar duplicação de lógica de apresentação.

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// Datas do backend são ISO em UTC (ex: receivedAt à meia-noite). Formatamos
// em UTC para evitar que o fuso local (ex: UTC-3) "volte" um dia.
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

const monthYearFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return dateFormatter.format(date);
}

// Exibe "junho de 2026" a partir de uma data de referência (ex: referenceMonth).
export function formatMonthYear(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return monthYearFormatter.format(date);
}

// Converte uma data para o formato `yyyy-MM-dd` esperado pelos inputs HTML
// de tipo `date` e pelos DTOs de data ISO do backend.
export function toDateInputValue(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

// Retorna o mês atual no formato `yyyy-MM`, usado como valor inicial dos
// filtros de mês de referência.
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
