/**
 * Regras de visibilidade e expiração da Lista de Desejos
 */

import type { Expense, WishItem, WishUrgency } from '@/types/domain';

export function compareYearMonth(a: string, b: string): number {
  return a.localeCompare(b);
}

export function isWishVisibleInMonth(wish: WishItem, viewingMonth: string): boolean {
  if (wish.status === 'conquered') return false;

  if (wish.status === 'expired') {
    return viewingMonth === wish.targetMonth;
  }

  return (
    wish.status === 'active' &&
    compareYearMonth(wish.startMonth, viewingMonth) <= 0 &&
    compareYearMonth(viewingMonth, wish.targetMonth) <= 0
  );
}

export function shouldAutoExpireWish(wish: WishItem, viewingMonth: string): boolean {
  return wish.status === 'active' && compareYearMonth(viewingMonth, wish.targetMonth) > 0;
}

export function isWishExpiringInMonth(wish: WishItem, viewingMonth: string): boolean {
  return wish.status === 'active' && viewingMonth === wish.targetMonth;
}

export function filterWishesForMonth(wishes: WishItem[], viewingMonth: string): WishItem[] {
  return wishes.filter((wish) => isWishVisibleInMonth(wish, viewingMonth));
}

export type ConqueredWishScope = 'currentMonth' | 'yearToDate';

export function isConqueredWishVisibleInMonth(
  wish: WishItem,
  viewingMonth: string,
  scope: ConqueredWishScope
): boolean {
  if (wish.status !== 'conquered' || !wish.conqueredMonth) return false;

  const viewYear = viewingMonth.slice(0, 4);
  const conqueredYear = wish.conqueredMonth.slice(0, 4);
  if (conqueredYear !== viewYear) return false;
  if (compareYearMonth(wish.conqueredMonth, viewingMonth) > 0) return false;

  if (scope === 'currentMonth') {
    return wish.conqueredMonth === viewingMonth;
  }

  return compareYearMonth(wish.conqueredMonth, viewingMonth) <= 0;
}

export function filterWishesForMonthDisplay(
  wishes: WishItem[],
  viewingMonth: string,
  conqueredScope: ConqueredWishScope
): WishItem[] {
  return wishes.filter(
    (wish) =>
      isWishVisibleInMonth(wish, viewingMonth) ||
      isConqueredWishVisibleInMonth(wish, viewingMonth, conqueredScope)
  );
}

export function getWishRealizedMetrics(
  wishes: WishItem[],
  currentMonth: string,
  expenses: Expense[]
): { count: number; total: number } {
  const conquered = wishes.filter(
    (w) => w.status === 'conquered' && w.conqueredMonth === currentMonth
  );
  const expenseById = new Map(expenses.map((e) => [e.id, e]));

  return {
    count: conquered.length,
    total: conquered.reduce((sum, w) => {
      const expense = w.linkedExpenseId ? expenseById.get(w.linkedExpenseId) : undefined;
      return sum + (expense?.value ?? 0);
    }, 0),
  };
}

export function sortWishes(wishes: WishItem[]): WishItem[] {
  return sortWishesByOption(wishes, 'urgency');
}

export type WishSortOption = 'urgency' | 'deadline' | 'highest' | 'lowest' | 'alphabetic';

export function sortWishesByOption(wishes: WishItem[], option: WishSortOption): WishItem[] {
  const sorted = [...wishes];

  switch (option) {
    case 'deadline':
      return sorted.sort((a, b) => compareYearMonth(a.targetMonth, b.targetMonth));
    case 'highest':
      return sorted.sort((a, b) => b.value - a.value);
    case 'lowest':
      return sorted.sort((a, b) => a.value - b.value);
    case 'alphabetic':
      return sorted.sort((a, b) => a.description.localeCompare(b.description, 'pt-BR'));
    case 'urgency':
    default: {
      const urgencyWeight: Record<WishUrgency, number> = { high: 0, medium: 1, low: 2 };
      return sorted.sort((a, b) => {
        const urgencyDiff = urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        const deadlineDiff = compareYearMonth(a.targetMonth, b.targetMonth);
        if (deadlineDiff !== 0) return deadlineDiff;
        return b.value - a.value;
      });
    }
  }
}

export function sortWishesForDisplay(
  wishes: WishItem[],
  sortOption: WishSortOption
): WishItem[] {
  const pending = wishes.filter((w) => w.status !== 'conquered');
  const conquered = wishes.filter((w) => w.status === 'conquered');

  const sortedPending = sortWishesByOption(pending, sortOption);
  const sortedConquered = [...conquered].sort((a, b) => {
    const monthDiff = compareYearMonth(b.conqueredMonth ?? '', a.conqueredMonth ?? '');
    if (monthDiff !== 0) return monthDiff;
    return a.description.localeCompare(b.description, 'pt-BR');
  });

  return [...sortedPending, ...sortedConquered];
}

export const WISH_URGENCY_LABELS: Record<WishUrgency, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const SHORT_MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function formatShortYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const idx = parseInt(month, 10) - 1;
  return `${SHORT_MONTH_NAMES[idx] ?? month}/${year}`;
}
