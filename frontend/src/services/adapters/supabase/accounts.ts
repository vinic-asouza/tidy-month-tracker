import { supabase } from '@/integrations/supabase/client';
import type { Account, CreateAccountInput, UpdateAccountInput } from '@/types/domain';
import { toAccount } from '../mappers';
import { getAuthUserId, throwIfError } from './helpers';

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
      color: params.color ?? null,
      display_order: params.displayOrder ?? 0,
    })
    .select('*')
    .single();

  throwIfError(error);
  return toAccount(data!);
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

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.type !== undefined) row.type = updates.type;
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
  table: 'incomes' | 'expenses' | 'investments',
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from(table)
    .select('year_month')
    .eq('user_id', userId)
    .not('account_id', 'is', null)
    .order('year_month', { ascending: true })
    .limit(1)
    .maybeSingle();

  throwIfError(error);
  return data?.year_month ?? null;
}

export async function getEarliestAccountMovementMonth(userId: string): Promise<string | null> {
  const uid = await resolveUserId(userId);
  const [incomeMonth, expenseMonth, investmentMonth] = await Promise.all([
    getEarliestYearMonthFromTable('incomes', uid),
    getEarliestYearMonthFromTable('expenses', uid),
    getEarliestYearMonthFromTable('investments', uid),
  ]);

  const candidates = [incomeMonth, expenseMonth, investmentMonth].filter(
    (month): month is string => month !== null
  );
  if (candidates.length === 0) return null;
  return candidates.sort()[0];
}
