/**
 * Reposiciona o dia de uma data YYYY-MM-DD no year_month alvo,
 * clampando ao último dia do mês (mesmo comportamento do CSV / DEV-176).
 */
export function rebaseDateToYearMonth(ymd: string, yearMonth: string): string {
  const day = Number(ymd.slice(8, 10));
  const [y, m] = yearMonth.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const d = Math.min(day || 1, lastDay);
  return `${yearMonth}-${String(d).padStart(2, '0')}`;
}
