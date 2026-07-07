import type { MonthData } from '@/types/domain';

export function getMonthIndex(yearMonth: string): number {
  return parseInt(yearMonth.split('-')[1], 10) - 1;
}

export function toMonthSnapshot(
  monthData: Pick<
    MonthData,
    'incomes' | 'expenses' | 'investments' | 'accountOperations'
  >,
  cardMonthlyStatuses: Record<string, boolean>
): MonthData {
  return {
    incomes: monthData.incomes,
    expenses: monthData.expenses,
    investments: monthData.investments,
    accountOperations: monthData.accountOperations ?? [],
    cardMonthlyStatuses: { ...cardMonthlyStatuses },
  };
}

export function patchYearDataMonth(
  yearData: MonthData[],
  monthIndex: number,
  snapshot: MonthData
): MonthData[] {
  if (yearData.length !== 12 || monthIndex < 0 || monthIndex > 11) {
    return yearData;
  }
  const next = [...yearData];
  next[monthIndex] = snapshot;
  return next;
}
