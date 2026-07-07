import { describe, expect, it } from 'vitest';
import type { Account } from '@/types/domain';
import {
  ACCOUNT_ROLE_LABELS,
  filterInvestmentAccounts,
  filterMovementAccounts,
  isInvestmentAccount,
  isMovementAccount,
  resolveAccountRole,
} from '../accountRoles';

const mov: Account = {
  id: '1',
  name: 'Nubank',
  type: 'checking',
  role: 'movement',
  color: null,
  displayOrder: 0,
};

const inv: Account = {
  id: '2',
  name: 'Corretora',
  type: 'investment',
  role: 'investment',
  color: null,
  displayOrder: 1,
};

describe('accountRoles', () => {
  it('resolveAccountRole usa role explícito', () => {
    expect(resolveAccountRole(mov)).toBe('movement');
    expect(resolveAccountRole(inv)).toBe('investment');
  });

  it('resolveAccountRole infere de type quando role ausente', () => {
    expect(resolveAccountRole({ type: 'investment', role: 'movement' })).toBe('movement');
    expect(
      resolveAccountRole({ type: 'investment', role: undefined as unknown as 'movement' })
    ).toBe('investment');
  });

  it('filtra carteiras por papel', () => {
    const accounts = [mov, inv];
    expect(filterMovementAccounts(accounts)).toEqual([mov]);
    expect(filterInvestmentAccounts(accounts)).toEqual([inv]);
  });

  it('expõe labels de papel', () => {
    expect(ACCOUNT_ROLE_LABELS.movement).toBe('Carteira de movimentação');
    expect(isMovementAccount(mov)).toBe(true);
    expect(isInvestmentAccount(inv)).toBe(true);
  });
});
