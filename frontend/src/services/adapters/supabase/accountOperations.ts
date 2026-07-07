import { supabase } from '@/integrations/supabase/client';
import type {
  AccountOperation,
  CreateInvoicePaymentInput,
  CreateTransferInput,
  CreateWithdrawalInput,
  UpdateInvoicePaymentInput,
} from '@/types/domain';
import { toAccountOperation } from '../mappers';
import { getAuthUserId, throwIfError } from './helpers';

async function resolveUserId(userId?: string): Promise<string> {
  return userId ?? getAuthUserId();
}

export async function getAccountOperations(
  userId: string,
  yearMonth: string
): Promise<AccountOperation[]> {
  const { data, error } = await supabase
    .from('account_operations')
    .select('*')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .order('operation_date', { ascending: false });

  throwIfError(error);
  return (data || []).map(toAccountOperation);
}

export async function createInvoicePayment(
  params: CreateInvoicePaymentInput
): Promise<AccountOperation> {
  const userId = await resolveUserId(params.userId);

  const { data, error } = await supabase
    .from('account_operations')
    .insert({
      user_id: userId,
      type: 'invoice_payment',
      source_account_id: params.sourceAccountId,
      credit_card_id: params.creditCardId,
      amount: params.amount,
      year_month: params.yearMonth,
      operation_date: params.operationDate,
      description: params.description ?? null,
    })
    .select('*')
    .single();

  throwIfError(error);
  return toAccountOperation(data!);
}

export async function updateInvoicePayment(
  id: string,
  userId: string,
  updates: UpdateInvoicePaymentInput
): Promise<AccountOperation> {
  const uid = await resolveUserId(userId);

  const row: Record<string, unknown> = {};
  if (updates.sourceAccountId !== undefined) row.source_account_id = updates.sourceAccountId;
  if (updates.amount !== undefined) row.amount = updates.amount;
  if (updates.description !== undefined) row.description = updates.description;

  const { data, error } = await supabase
    .from('account_operations')
    .update(row)
    .eq('id', id)
    .eq('user_id', uid)
    .eq('type', 'invoice_payment')
    .select('*')
    .single();

  throwIfError(error);
  return toAccountOperation(data!);
}

export async function deleteInvoicePaymentByCard(
  userId: string,
  creditCardId: string,
  yearMonth: string
): Promise<void> {
  const uid = await resolveUserId(userId);

  const { error } = await supabase
    .from('account_operations')
    .delete()
    .eq('user_id', uid)
    .eq('credit_card_id', creditCardId)
    .eq('year_month', yearMonth)
    .eq('type', 'invoice_payment');

  throwIfError(error);
}

export async function createWithdrawal(
  params: CreateWithdrawalInput
): Promise<AccountOperation> {
  const userId = await resolveUserId(params.userId);

  const { data, error } = await supabase
    .from('account_operations')
    .insert({
      user_id: userId,
      type: 'withdrawal',
      source_account_id: params.sourceAccountId,
      amount: params.amount,
      year_month: params.yearMonth,
      operation_date: params.operationDate,
      description: params.description ?? null,
    })
    .select('*')
    .single();

  throwIfError(error);
  return toAccountOperation(data!);
}

export async function createTransfer(
  params: CreateTransferInput
): Promise<AccountOperation[]> {
  const userId = await resolveUserId(params.userId);
  const transferGroupId = crypto.randomUUID();

  const { data, error } = await supabase
    .from('account_operations')
    .insert([
      {
        user_id: userId,
        type: 'transfer_out',
        source_account_id: params.sourceAccountId,
        amount: params.amount,
        year_month: params.yearMonth,
        operation_date: params.operationDate,
        description: params.description ?? null,
        transfer_group_id: transferGroupId,
      },
      {
        user_id: userId,
        type: 'transfer_in',
        destination_account_id: params.destinationAccountId,
        amount: params.amount,
        year_month: params.yearMonth,
        operation_date: params.operationDate,
        description: params.description ?? null,
        transfer_group_id: transferGroupId,
      },
    ])
    .select('*');

  throwIfError(error);
  return (data || []).map(toAccountOperation);
}

export async function deleteAccountOperation(id: string, userId: string): Promise<void> {
  const uid = await resolveUserId(userId);

  const { data: op, error: fetchError } = await supabase
    .from('account_operations')
    .select('transfer_group_id')
    .eq('id', id)
    .eq('user_id', uid)
    .maybeSingle();

  throwIfError(fetchError);

  if (op?.transfer_group_id) {
    const { error } = await supabase
      .from('account_operations')
      .delete()
      .eq('user_id', uid)
      .eq('transfer_group_id', op.transfer_group_id);
    throwIfError(error);
    return;
  }

  const { error } = await supabase
    .from('account_operations')
    .delete()
    .eq('id', id)
    .eq('user_id', uid);

  throwIfError(error);
}
