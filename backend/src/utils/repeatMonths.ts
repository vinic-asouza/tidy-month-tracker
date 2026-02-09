/**
 * Utilitários para cálculos de repetição mensal
 * 
 * Reutiliza lógica do frontend (mesma implementação)
 */

/**
 * Calcula os meses restantes do ano para repetição
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
