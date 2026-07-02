import { apiClient } from '@/api/client';
import type { Account, CreateAccountInput, UpdateAccountInput } from '@/types/domain';

export async function getAccounts(): Promise<Account[]> {
  return apiClient.get<Account[]>('/api/accounts');
}

export async function createAccount(
  params: CreateAccountInput & { userId: string; displayOrder?: number }
): Promise<Account> {
  return apiClient.post<Account>('/api/accounts', params);
}

export async function updateAccount(
  id: string,
  _userId: string,
  updates: UpdateAccountInput
): Promise<void> {
  await apiClient.put(`/api/accounts/${id}`, updates);
}

export async function deleteAccount(id: string): Promise<void> {
  await apiClient.delete(`/api/accounts/${id}`);
}

export async function getEarliestAccountMovementMonth(_userId: string): Promise<string | null> {
  return null;
}
