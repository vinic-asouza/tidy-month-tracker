/**
 * Lógica de negócio para repetição mensal
 * 
 * Funções puras para calcular meses de repetição.
 * Sem dependências de I/O, facilmente testáveis.
 */

/**
 * Calcula os meses restantes do ano para repetição
 * 
 * @param currentYearMonth - Mês atual no formato "YYYY-MM"
 * @returns Array com os meses restantes do ano (excluindo o mês atual)
 * 
 * @example
 * calculateRemainingMonths("2024-03")
 * // Retorna: ["2024-01", "2024-02", "2024-04", "2024-05", ..., "2024-12"]
 */
export function calculateRemainingMonths(currentYearMonth: string): string[] {
  const [year, currentMonth] = currentYearMonth.split('-').map(Number);
  const months: string[] = [];

  for (let m = 1; m <= 12; m++) {
    if (m === currentMonth) continue;
    const monthKey = `${year}-${String(m).padStart(2, '0')}`;
    months.push(monthKey);
  }

  return months;
}

/**
 * Extrai o ano de um yearMonth
 */
export function extractYear(yearMonth: string): number {
  return parseInt(yearMonth.split('-')[0]);
}

/**
 * Extrai o mês de um yearMonth
 */
export function extractMonth(yearMonth: string): number {
  return parseInt(yearMonth.split('-')[1]);
}

/**
 * Formata um ano e mês para o formato yearMonth
 */
export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Meses da visão anual a atualizar após mutação multi-mês.
 * Inclui o mês corrente + demais meses do ano civil quando applyToAllMonths.
 */
export function getYearRefreshMonths(
  currentMonth: string,
  applyToAllMonths: boolean,
  extraMonths: string[] = []
): string[] {
  const base = applyToAllMonths
    ? [currentMonth, ...calculateRemainingMonths(currentMonth)]
    : [];
  return [...new Set([...base, ...extraMonths])];
}
