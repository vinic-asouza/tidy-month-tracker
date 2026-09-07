import { supabase } from '@/integrations/supabase/client';
import type { Account, CreateAccountInput, UpdateAccountInput } from '@/types/domain';
import { toAccount } from '../mappers';
import { getAuthUserId, throwIfError } from './helpers';

type MovementTable = 'incomes' | 'expenses' | 'investments' | 'account_operations';

async function resolveUserId(userId?: string): Promise<string> {
  return userId ?? getAuthUserId();
}

export async function getAccounts(userId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('display_order');

  throwIfError(error);
  return (data || []).map(toAccount);
}

export async function createAccount(
  params: CreateAccountInput & { userId: string; displayOrder?: number }
): Promise<Account> {
  const userId = await resolveUserId(params.userId);

  const { data: existing, error: dupError } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', params.name)
    .maybeSingle();

  throwIfError(dupError);
  if (existing) throw new Error('Já existe uma carteira com este nome');

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      name: params.name,
      type: params.type,
      role: params.role,
      color: params.color ?? null,
      display_order: params.displayOrder ?? 0,
    })
    .select('*')
    .single();

  throwIfError(error);
  return toAccount(data!);
}

/** Verifica se a carteira já foi usada em qualquer lançamento ou operação. */
async function hasAccountMovements(userId: string, accountId: string): Promise<boolean> {
  const checks: { table: MovementTable; columns: string[] }[] = [
    { table: 'incomes', columns: ['account_id'] },
    { table: 'expenses', columns: ['account_id'] },
    { table: 'investments', columns: ['account_id', 'source_account_id'] },
    { table: 'account_operations', columns: ['source_account_id', 'destination_account_id'] },
  ];

  for (const { table, columns } of checks) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or(columns.map((column) => `${column}.eq.${accountId}`).join(','));

    throwIfError(error);
    if ((count ?? 0) > 0) return true;
  }

  return false;
}

export async function updateAccount(
  id: string,
  userId: string,
  updates: UpdateAccountInput
): Promise<void> {
  const uid = await resolveUserId(userId);

  if (updates.name !== undefined) {
    const { data: existing, error: dupError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', uid)
      .ilike('name', updates.name)
      .neq('id', id)
      .maybeSingle();

    throwIfError(dupError);
    if (existing) throw new Error('Já existe uma carteira com este nome');
  }

  if (updates.role !== undefined) {
    const { data: current, error: currentError } = await supabase
      .from('accounts')
      .select('role')
      .eq('id', id)
      .eq('user_id', uid)
      .maybeSingle();

    throwIfError(currentError);

    const roleChanges = current != null && current.role !== updates.role;
    if (roleChanges && (await hasAccountMovements(uid, id))) {
      throw new Error('Não é possível alterar o papel: esta carteira já tem movimentos');
    }
  }

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.role !== undefined) row.role = updates.role;
  if (updates.color !== undefined) row.color = updates.color;

  const { error } = await supabase
    .from('accounts')
    .update(row)
    .eq('id', id)
    .eq('user_id', uid);

  throwIfError(error);
}

export async function deleteAccount(id: string, userId: string): Promise<void> {
  const uid = await resolveUserId(userId);
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', uid);

  throwIfError(error);
}

async function getEarliestYearMonthFromTable(
  table: MovementTable,
  userId: string,
  columns: string[]
): Promise<string | null> {
  const { data, error } = await supabase
    .from(table)
    .select('year_month')
    .eq('user_id', userId)
    .or(columns.map((column) => `${column}.not.is.null`).join(','))
    .order('year_month', { ascending: true })
    .limit(1)
    .maybeSingle();

  throwIfError(error);
  return data?.year_month ?? null;
}

export async function getEarliestAccountMovementMonth(userId: string): Promise<string | null> {
  const uid = await resolveUserId(userId);
  const months = await Promise.all([
    getEarliestYearMonthFromTable('incomes', uid, ['account_id']),
    getEarliestYearMonthFromTable('expenses', uid, ['account_id']),
    getEarliestYearMonthFromTable('investments', uid, ['account_id', 'source_account_id']),
    getEarliestYearMonthFromTable('account_operations', uid, [
      'source_account_id',
      'destination_account_id',
    ]),
  ]);

  const candidates = months.filter((month): month is string => month !== null);
  if (candidates.length === 0) return null;
  return candidates.sort()[0];
}
