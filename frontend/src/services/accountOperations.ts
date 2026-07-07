import type {
  AccountOperation,
  CreateInvoicePaymentInput,
  CreateTransferInput,
  CreateWithdrawalInput,
  UpdateInvoicePaymentInput,
} from '@/types/domain';
import { accountOperationsAdapter } from './adapters/select';

export async function getAccountOperations(
  userId: string,
  yearMonth: string
): Promise<AccountOperation[]> {
  return accountOperationsAdapter().getAccountOperations(userId, yearMonth);
}

export async function createWithdrawal(
  params: CreateWithdrawalInput
): Promise<AccountOperation> {
  return accountOperationsAdapter().createWithdrawal(params);
}

export async function createTransfer(
  params: CreateTransferInput
): Promise<AccountOperation[]> {
  return accountOperationsAdapter().createTransfer(params);
}

export async function createInvoicePayment(
  params: CreateInvoicePaymentInput
): Promise<AccountOperation> {
  return accountOperationsAdapter().createInvoicePayment(params);
}

export async function updateInvoicePayment(
  id: string,
  userId: string,
  updates: UpdateInvoicePaymentInput
): Promise<AccountOperation> {
  return accountOperationsAdapter().updateInvoicePayment(id, userId, updates);
}

export async function deleteInvoicePaymentByCard(
  userId: string,
  creditCardId: string,
  yearMonth: string
): Promise<void> {
  return accountOperationsAdapter().deleteInvoicePaymentByCard(userId, creditCardId, yearMonth);
}

export async function deleteAccountOperation(id: string, userId: string): Promise<void> {
  return accountOperationsAdapter().deleteAccountOperation(id, userId);
}
