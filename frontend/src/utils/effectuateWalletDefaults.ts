import type { Account } from '@/types/domain';

export const EFFECTUATE_WALLET_FREE = '__free__';

const storageKey = (kind: string, context?: string) =>
  context ? `effectuateWallet:${kind}:${context}` : `effectuateWallet:${kind}`;

export function getDefaultEffectuateAccountId(
  kind: 'income' | 'expense' | 'investment',
  accounts: Account[],
  context?: string
): string {
  if (accounts.length === 0) return EFFECTUATE_WALLET_FREE;

  try {
    const stored = localStorage.getItem(storageKey(kind, context));
    if (stored === EFFECTUATE_WALLET_FREE) return EFFECTUATE_WALLET_FREE;
    if (stored && accounts.some((a) => a.id === stored)) return stored;
  } catch {
    // ignore
  }

  return accounts[0]?.id ?? EFFECTUATE_WALLET_FREE;
}

export function persistEffectuateAccountId(
  kind: 'income' | 'expense' | 'investment',
  accountId: string | null,
  context?: string
): void {
  try {
    localStorage.setItem(
      storageKey(kind, context),
      accountId ?? EFFECTUATE_WALLET_FREE
    );
  } catch {
    // ignore
  }
}

export function toEffectuateAccountId(selection: string): string | null {
  return selection === EFFECTUATE_WALLET_FREE ? null : selection;
}
