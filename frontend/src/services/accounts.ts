import type { Account, CreateAccountInput, UpdateAccountInput } from '@/types/domain';
import { accountsAdapter } from './adapters/select';

export async function getAccounts(userId: string): Promise<Account[]> {
  return accountsAdapter().getAccounts(userId);
}

export async function createAccount(
  params: CreateAccountInput & { userId: string; displayOrder?: number }
): Promise<Account> {
  return accountsAdapter().createAccount(params);
}

export async function updateAccount(
  id: string,
  userId: string,
  updates: UpdateAccountInput
): Promise<void> {
  return accountsAdapter().updateAccount(id, userId, updates);
}

export async function deleteAccount(id: string, userId: string): Promise<void> {
  return accountsAdapter().deleteAccount(id, userId);
}

export async function getEarliestAccountMovementMonth(userId: string): Promise<string | null> {
  return accountsAdapter().getEarliestAccountMovementMonth(userId);
}
