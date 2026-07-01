import { describe, expect, it } from 'vitest';
import {
  filterWishesForMonth,
  isWishVisibleInMonth,
  shouldAutoExpireWish,
  sortWishesByOption,
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
