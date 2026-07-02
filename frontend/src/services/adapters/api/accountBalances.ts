import { apiClient } from '@/api/client';
import type { AccountBalance, UpsertAccountBalanceInput } from '@/types/domain';

export async function getAccountBalances(): Promise<AccountBalance[]> {
  return apiClient.get<AccountBalance[]>('/api/account-balances');
}

export async function upsertAccountBalance(
  params: UpsertAccountBalanceInput
): Promise<AccountBalance> {
  return apiClient.post<AccountBalance>('/api/account-balances/upsert', params);
}

export async function deleteAccountBalance(
  accountId: string,
  yearMonth: string
): Promise<void> {
  await apiClient.delete(`/api/account-balances/${accountId}/${yearMonth}`);
}
