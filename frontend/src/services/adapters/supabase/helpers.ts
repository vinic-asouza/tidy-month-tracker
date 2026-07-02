import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';

export function throwIfError(error: PostgrestError | null): void {
  if (error) throw new Error(error.message);
}

export async function getAuthUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Usuário não autenticado');
  return user.id;
}

export async function getMonthItemCount(
  table: 'incomes' | 'expenses' | 'investments',
  userId: string,
  yearMonth: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('year_month', yearMonth);

  throwIfError(error);
  return count ?? 0;
}

export async function getGlobalItemCount(
  table: 'credit_cards' | 'accounts',
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  throwIfError(error);
  return count ?? 0;
}
