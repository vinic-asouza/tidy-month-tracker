import type {
  AccountOperation,
  CreateInvoicePaymentInput,
  CreateTransferInput,
  CreateWithdrawalInput,
  UpdateInvoicePaymentInput,
} from '@/types/domain';

const notImplemented = (): never => {
  throw new Error('Operações de carteira não disponíveis neste provedor');
};

export async function getAccountOperations(
  _userId: string,
  _yearMonth: string
): Promise<AccountOperation[]> {
  return [];
}

export async function createWithdrawal(
  _params: CreateWithdrawalInput
): Promise<AccountOperation> {
  return notImplemented();
}

export async function createTransfer(
  _params: CreateTransferInput
): Promise<AccountOperation[]> {
  return notImplemented();
}

export async function createInvoicePayment(
  _params: CreateInvoicePaymentInput
): Promise<AccountOperation> {
  return notImplemented();
}

export async function updateInvoicePayment(
  _id: string,
  _userId: string,
  _updates: UpdateInvoicePaymentInput
): Promise<AccountOperation> {
  return notImplemented();
}

export async function deleteInvoicePaymentByCard(
  _userId: string,
  _creditCardId: string,
  _yearMonth: string
): Promise<void> {
  return notImplemented();
}

export async function deleteAccountOperation(_id: string, _userId: string): Promise<void> {
  return notImplemented();
}
