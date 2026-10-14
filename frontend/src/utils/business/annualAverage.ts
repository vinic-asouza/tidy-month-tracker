export interface AnnualAverageWindow {
  monthCount: number;
  closedYear: boolean;
}

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/**
 * Janela da média anual, independente do mês selecionado no painel.
 * Ano anterior ao de `today`: 12 meses.
 * Ano de `today`: só meses já encerrados (em 13 de outubro, janeiro a setembro).
 * Ano futuro: nenhum mês completo.
 */
export function resolveAnnualAverageWindow(
  viewedYear: number,
  today: Date = new Date()
): AnnualAverageWindow {
  if (!Number.isFinite(viewedYear)) {
    return { monthCount: 0, closedYear: false };
  }

  const currentYear = today.getFullYear();
  if (viewedYear < currentYear) {
    return { monthCount: 12, closedYear: true };
  }
  if (viewedYear > currentYear) {
    return { monthCount: 0, closedYear: false };
  }

  return { monthCount: today.getMonth(), closedYear: false };
}

export function sliceYearMonths<T>(months: readonly T[], monthCount: number): T[] {
  return months.slice(0, monthCount);
}

export function averageAmount(sum: number, monthCount: number): number {
  if (monthCount <= 0) return 0;
  return sum / monthCount;
}

/** Mês entra na média só se o modo ativo somou entrada, gasto ou investimento. */
export function monthHasAverageFlow(income: number, expenses: number, investments: number): boolean {
  return income !== 0 || expenses !== 0 || investments !== 0;
}

export function countActiveAverageMonths(
  months: readonly { income: number; expenses: number; investments: number }[],
  windowMonthCount: number
): number {
  return sliceYearMonths(months, windowMonthCount).filter((month) =>
    monthHasAverageFlow(month.income, month.expenses, month.investments)
  ).length;
}

export function formatAverageWindowLabel(
  viewedYear: number,
  today: Date = new Date(),
  activeMonthCount?: number
): string {
  const { monthCount } = resolveAnnualAverageWindow(viewedYear, today);
  if (monthCount <= 0) return 'Nenhum mês completo neste ano';

  const active = activeMonthCount ?? monthCount;
  if (active <= 0) return 'Nenhum mês com lançamentos neste período';

  const endName = MONTH_NAMES[monthCount - 1] ?? 'dezembro';
  if (active === monthCount) {
    if (monthCount >= 12) return 'Média mensal dos 12 meses';
    if (monthCount === 1) return 'Média mensal de janeiro (1 mês)';
    return `Média mensal de janeiro a ${endName} (${monthCount} meses)`;
  }

  const noun = active === 1 ? 'mês com lançamentos' : 'meses com lançamentos';
  if (monthCount >= 12) return `Média de ${active} ${noun}`;
  return `Média de ${active} ${noun}, até ${endName}`;
}
