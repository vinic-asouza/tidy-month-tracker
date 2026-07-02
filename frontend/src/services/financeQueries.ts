import type { CreditCard, MonthData } from '@/types/domain';
import { getEmptyMonthData } from '@/types/finance';
import { getMonthsInRange } from '@/utils/business/accounts';
import * as incomesService from '@/services/incomes';
import * as expensesService from '@/services/expenses';
import * as investmentsService from '@/services/investments';
import * as creditCardsService from '@/services/creditCards';

export type MonthBundle = MonthData & {
  cardMonthlyStatuses: Record<string, boolean>;
};

export async function fetchMonthBundle(
  userId: string,
  yearMonth: string,
  creditCards: CreditCard[]
): Promise<MonthBundle> {
  const [incomes, expenses, investments, cardMonthlyStatuses] = await Promise.all([
    incomesService.getIncomes(userId, yearMonth),
    expensesService.getExpenses(userId, yearMonth),
    investmentsService.getInvestments(userId, yearMonth),
    creditCardsService.getAllCardMonthlyStatuses(userId, yearMonth, creditCards),
  ]);

  return {
    incomes,
    expenses,
    investments,
    cardMonthlyStatuses,
  };
}

export async function fetchYearData(
  userId: string,
  year: number,
  creditCards: CreditCard[]
): Promise<MonthData[]> {
  const monthPromises = Array.from({ length: 12 }, async (_, index) => {
    const yearMonth = `${year}-${String(index + 1).padStart(2, '0')}`;
    try {
      const bundle = await fetchMonthBundle(userId, yearMonth, creditCards);
      return {
        incomes: bundle.incomes,
        expenses: bundle.expenses,
        investments: bundle.investments,
        cardMonthlyStatuses: bundle.cardMonthlyStatuses,
      };
    } catch {
      return {
        ...getEmptyMonthData(),
        cardMonthlyStatuses: {},
      };
    }
  });

  return Promise.all(monthPromises);
}

export async function fetchMonthsRange(
  userId: string,
  fromYearMonth: string,
  toYearMonth: string,
  creditCards: CreditCard[]
): Promise<Record<string, MonthData>> {
  const months = getMonthsInRange(fromYearMonth, toYearMonth);
  if (months.length === 0) return {};

  const bundles = await Promise.all(
    months.map(async (yearMonth) => {
      try {
        const bundle = await fetchMonthBundle(userId, yearMonth, creditCards);
        return {
          yearMonth,
          data: {
            incomes: bundle.incomes,
            expenses: bundle.expenses,
            investments: bundle.investments,
            cardMonthlyStatuses: bundle.cardMonthlyStatuses,
          } satisfies MonthData,
        };
      } catch {
        return { yearMonth, data: getEmptyMonthData() };
      }
    })
  );

  return Object.fromEntries(bundles.map(({ yearMonth, data }) => [yearMonth, data]));
}
