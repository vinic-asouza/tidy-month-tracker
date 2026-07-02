import { supabase } from '@/integrations/supabase/client';
import type { AccountBalance, UpsertAccountBalanceInput } from '@/types/domain';
import { toAccountBalance } from '../mappers';
import { throwIfError } from './helpers';

export async function getAccountBalances(userId: string): Promise<AccountBalance[]> {
  const { data, error } = await supabase
    .from('account_balances')
    .select('*')
    .eq('user_id', userId)
    .order('year_month');

  throwIfError(error);
  return (data || []).map(toAccountBalance);
}

export async function upsertAccountBalance(
  params: UpsertAccountBalanceInput
): Promise<AccountBalance> {
  const { data, error } = await supabase
    .from('account_balances')
    .upsert(
      {
        account_id: params.accountId,
        user_id: params.userId,
        year_month: params.yearMonth,
        balance: params.balance,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'account_id,year_month' }
    )
    .select('*')
    .single();

  throwIfError(error);
  return toAccountBalance(data!);
}

export async function deleteAccountBalance(
  accountId: string,
  yearMonth: string
): Promise<void> {
  const { error } = await supabase
    .from('account_balances')
    .delete()
    .eq('account_id', accountId)
    .eq('year_month', yearMonth);

  throwIfError(error);
}
