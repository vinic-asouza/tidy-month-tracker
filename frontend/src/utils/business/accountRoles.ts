import type { Account, AccountRole } from '@/types/domain';

export const ACCOUNT_ROLE_LABELS: Record<AccountRole, string> = {
  movement: 'Carteira de movimentação',
  investment: 'Carteira de investimentos',
};

export const MOVEMENT_ACCOUNT_TYPES = ['checking', 'savings', 'cash', 'other'] as const;

export function resolveAccountRole(account: Pick<Account, 'type' | 'role'>): AccountRole {
  if (account.role) return account.role;
  return account.type === 'investment' ? 'investment' : 'movement';
}

export function isMovementAccount(account: Pick<Account, 'type' | 'role'>): boolean {
  return resolveAccountRole(account) === 'movement';
}

export function isInvestmentAccount(account: Pick<Account, 'type' | 'role'>): boolean {
  return resolveAccountRole(account) === 'investment';
}

export function filterMovementAccounts<T extends Pick<Account, 'type' | 'role'>>(accounts: T[]): T[] {
  return accounts.filter(isMovementAccount);
}

export function filterInvestmentAccounts<T extends Pick<Account, 'type' | 'role'>>(
  accounts: T[]
): T[] {
  return accounts.filter(isInvestmentAccount);
}

export function accountRoleSubtitle(role: AccountRole): string {
  return role === 'movement' ? 'Liquidez' : 'Posição aplicada';
}
