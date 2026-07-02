import { describe, expect, it } from 'vitest';
import {
  filterWishesForMonth,
  filterWishesForMonthDisplay,
  isConqueredWishVisibleInMonth,
  isWishVisibleInMonth,
  shouldAutoExpireWish,
  sortWishesByOption,
  sortWishesForDisplay,
  getWishRealizedMetrics,
} from '../wishItems';
import type { WishItem } from '@/types/domain';

const baseWish = (overrides: Partial<WishItem> = {}): WishItem => ({
  id: '1',
  description: 'Notebook',
  value: 5000,
  urgency: 'medium',
  startMonth: '2026-01',
  targetMonth: '2026-06',
  status: 'active',
  ...overrides,
});

describe('wishItems visibility', () => {
  it('shows active wish within start and target months', () => {
    const wish = baseWish();
    expect(isWishVisibleInMonth(wish, '2026-03')).toBe(true);
    expect(filterWishesForMonth([wish], '2026-03')).toHaveLength(1);
  });

  it('shows wish from previous months while still active', () => {
    const wish = baseWish({ startMonth: '2026-01', targetMonth: '2026-12' });
    expect(isWishVisibleInMonth(wish, '2026-05')).toBe(true);
  });

  it('hides conquered wishes everywhere', () => {
    const wish = baseWish({ status: 'conquered', conqueredMonth: '2026-03' });
    expect(isWishVisibleInMonth(wish, '2026-03')).toBe(false);
  });

  it('shows expired wish only on target month for renewal', () => {
    const wish = baseWish({ status: 'expired', targetMonth: '2026-06' });
    expect(isWishVisibleInMonth(wish, '2026-06')).toBe(true);
    expect(isWishVisibleInMonth(wish, '2026-07')).toBe(false);
  });

  it('flags auto-expire after target month', () => {
    const wish = baseWish({ targetMonth: '2026-06' });
    expect(shouldAutoExpireWish(wish, '2026-07')).toBe(true);
    expect(shouldAutoExpireWish(wish, '2026-06')).toBe(false);
  });

  it('sorts by option', () => {
    const wishes = [
      baseWish({ id: '1', description: 'Zebra', value: 100, urgency: 'low', targetMonth: '2026-12' }),
      baseWish({ id: '2', description: 'Alpha', value: 500, urgency: 'high', targetMonth: '2026-03' }),
    ];
    expect(sortWishesByOption(wishes, 'alphabetic')[0].description).toBe('Alpha');
    expect(sortWishesByOption(wishes, 'highest')[0].value).toBe(500);
    expect(sortWishesByOption(wishes, 'urgency')[0].urgency).toBe('high');
  });
});

describe('getWishRealizedMetrics', () => {
  it('soma gastos vinculados de desejos conquistados no mês', () => {
    const wishes = [
      baseWish({
        id: 'w1',
        status: 'conquered',
        conqueredMonth: '2026-03',
        linkedExpenseId: 'e1',
      }),
      baseWish({
        id: 'w2',
        status: 'conquered',
        conqueredMonth: '2026-03',
        linkedExpenseId: 'e2',
      }),
      baseWish({
        id: 'w3',
        status: 'conquered',
        conqueredMonth: '2026-02',
        linkedExpenseId: 'e3',
      }),
      baseWish({ id: 'w4', status: 'conquered', conqueredMonth: '2026-03' }),
    ];
    const expenses = [
      { id: 'e1', value: 100 } as import('@/types/domain').Expense,
      { id: 'e2', value: 250 } as import('@/types/domain').Expense,
      { id: 'e3', value: 999 } as import('@/types/domain').Expense,
    ];

    expect(getWishRealizedMetrics(wishes, '2026-03', expenses)).toEqual({
      count: 3,
      total: 350,
    });
  });

  it('retorna zero quando não há conquistas no mês', () => {
    expect(getWishRealizedMetrics([], '2026-03', [])).toEqual({ count: 0, total: 0 });
  });
});

describe('conquered wish visibility', () => {
  const conquered = (overrides: Partial<WishItem> = {}) =>
    baseWish({ status: 'conquered', conqueredMonth: '2026-03', ...overrides });

  it('currentMonth: mostra conquista do mês selecionado no mesmo ano', () => {
    const wish = conquered({ conqueredMonth: '2026-03' });
    expect(isConqueredWishVisibleInMonth(wish, '2026-03', 'currentMonth')).toBe(true);
    expect(filterWishesForMonthDisplay([wish], '2026-03', 'currentMonth')).toHaveLength(1);
  });

  it('currentMonth: oculta conquista de outro mês', () => {
    const wish = conquered({ conqueredMonth: '2026-02' });
    expect(isConqueredWishVisibleInMonth(wish, '2026-03', 'currentMonth')).toBe(false);
  });

  it('yearToDate: inclui conquistas do ano até o mês selecionado', () => {
    const jan = conquered({ id: '1', conqueredMonth: '2026-01' });
    const feb = conquered({ id: '2', conqueredMonth: '2026-02' });
    const mar = conquered({ id: '3', conqueredMonth: '2026-03' });
    const result = filterWishesForMonthDisplay([jan, feb, mar], '2026-03', 'yearToDate');
    expect(result).toHaveLength(3);
  });

  it('yearToDate: exclui conquistas de ano diferente', () => {
    const old = conquered({ conqueredMonth: '2025-12' });
    expect(isConqueredWishVisibleInMonth(old, '2026-03', 'yearToDate')).toBe(false);
  });

  it('exclui conquista futura em relação ao mês visualizado', () => {
    const future = conquered({ conqueredMonth: '2026-06' });
    expect(isConqueredWishVisibleInMonth(future, '2026-03', 'yearToDate')).toBe(false);
  });

  it('sortWishesForDisplay coloca conquistados após pendentes', () => {
    const active = baseWish({ id: 'a', description: 'Ativo' });
    const done = conquered({ id: 'c', description: 'Conquistado', conqueredMonth: '2026-01' });
    const sorted = sortWishesForDisplay([done, active], 'alphabetic');
    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('c');
  });
});
