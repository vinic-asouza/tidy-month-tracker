/**
 * Regras de visibilidade e expiração da Lista de Desejos
 */

import type { WishItem, WishUrgency } from '@/types/domain';

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
