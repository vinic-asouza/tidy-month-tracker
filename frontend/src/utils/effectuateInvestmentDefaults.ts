import type { Account } from '@/types/domain';
import {
  filterInvestmentAccounts,
  filterMovementAccounts,
} from '@/utils/business/accountRoles';
import { EFFECTUATE_WALLET_FREE } from '@/utils/effectuateWalletDefaults';

const SOURCE_KEY = 'effectuateInvestment:source';
const DEST_KEY = 'effectuateInvestment:dest';

function resolveDefaultSourceId(movement: Account[], storedSource: string | null): string {
  if (storedSource === EFFECTUATE_WALLET_FREE) return EFFECTUATE_WALLET_FREE;
  if (storedSource && movement.some((a) => a.id === storedSource)) return storedSource;
  if (movement.length > 0) return movement[0].id;
  return EFFECTUATE_WALLET_FREE;
}

export function getDefaultEffectuateInvestmentAccounts(accounts: Account[]): {
  sourceId: string;
  destId: string;
} {
  const movement = filterMovementAccounts(accounts);
  const investment = filterInvestmentAccounts(accounts);

  try {
    const storedSource = localStorage.getItem(SOURCE_KEY);
    const storedDest = localStorage.getItem(DEST_KEY);
    const sourceId = resolveDefaultSourceId(movement, storedSource);
    const destId =
      storedDest && investment.some((a) => a.id === storedDest)
        ? storedDest
        : investment[0]?.id ?? '';
    return { sourceId, destId };
  } catch {
    return {
      sourceId: resolveDefaultSourceId(movement, null),
      destId: investment[0]?.id ?? '',
    };
  }
}

export function persistEffectuateInvestmentAccounts(
  sourceAccountId: string,
  destinationAccountId: string
): void {
  try {
    localStorage.setItem(SOURCE_KEY, sourceAccountId);
    localStorage.setItem(DEST_KEY, destinationAccountId);
  } catch {
    // ignore
  }
}
