import type { AccountBalance, UpsertAccountBalanceInput } from '@/types/domain';
import { accountBalancesAdapter } from './adapters/select';

export async function getAccountBalances(userId: string): Promise<AccountBalance[]> {
  return accountBalancesAdapter().getAccountBalances(userId);
}

export async function upsertAccountBalance(
  params: UpsertAccountBalanceInput
): Promise<AccountBalance> {
  return accountBalancesAdapter().upsertAccountBalance(params);
}

export async function deleteAccountBalance(
  accountId: string,
  yearMonth: string
): Promise<void> {
  return accountBalancesAdapter().deleteAccountBalance(accountId, yearMonth);
}
