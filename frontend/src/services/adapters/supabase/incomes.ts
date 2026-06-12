import { supabase } from '@/integrations/supabase/client';
import type { Income } from '@/types/domain';
import type { CreateIncomeParams, UpdateIncomeParams } from '@/services/params';
import { calculateRemainingMonths } from '@/utils/business/repeatMonths';
import { toIncome } from '../mappers';
import { getAuthUserId, getMonthItemCount, throwIfError } from './helpers';

async function resolveUserId(userId?: string): Promise<string> {
  return userId ?? getAuthUserId();
}

export async function getIncomes(userId: string, yearMonth: string): Promise<Income[]> {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .order('display_order');

  throwIfError(error);
  return (data || []).map(toIncome);
}

export async function createIncome(params: CreateIncomeParams): Promise<Income> {
  const userId = await resolveUserId(params.userId);
  const { yearMonth, ...incomeData } = params;
  const displayOrder = await getMonthItemCount('incomes', userId, yearMonth);
  const itemDate = incomeData.date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('incomes')
    .insert({
      user_id: userId,
      year_month: yearMonth,
      description: incomeData.description,
      value: incomeData.value,
      tag: incomeData.tag,
      date: itemDate,
      received: false,
      repeat_all_months: incomeData.repeatAllMonths || false,
      display_order: displayOrder,
    })
    .select('*')
    .single();

  throwIfError(error);
  const createdIncome = toIncome(data!);

  if (incomeData.repeatAllMonths) {
    const remainingMonths = calculateRemainingMonths(yearMonth);
    for (const month of remainingMonths) {
      const { error: copyError } = await supabase.from('incomes').insert({
        user_id: userId,
        year_month: month,
        description: incomeData.description,
        value: incomeData.value,
        tag: incomeData.tag,
        date: itemDate,
        received: false,
        repeat_all_months: true,
        base_income_id: createdIncome.id,
        display_order: 0,
      });
      throwIfError(copyError);
    }
  }

  return createdIncome;
}

export async function updateIncome(params: UpdateIncomeParams): Promise<void> {
  const userId = await resolveUserId(params.userId);
  const { id, updates, applyToAllMonths } = params;

  const { data: currentRows, error: fetchError } = await supabase
    .from('incomes')
    .select('id, base_income_id, repeat_all_months, year_month, description, value, tag, date')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  throwIfError(fetchError);
  if (!currentRows) throw new Error('Receita não encontrada');

  const wasRepeatAllMonths = currentRows.repeat_all_months;
  const willBeRepeatAllMonths =
    updates.repeatAllMonths !== undefined ? updates.repeatAllMonths : wasRepeatAllMonths;
  const isChangingRepeatStatus =
    updates.repeatAllMonths !== undefined && updates.repeatAllMonths !== wasRepeatAllMonths;

  if (isChangingRepeatStatus && willBeRepeatAllMonths && !currentRows.base_income_id) {
    const remainingMonths = calculateRemainingMonths(currentRows.year_month);
    for (const month of remainingMonths) {
      const { error: copyError } = await supabase.from('incomes').insert({
        user_id: userId,
        year_month: month,
        description: updates.description ?? currentRows.description,
        value: updates.value ?? Number(currentRows.value),
        tag: updates.tag ?? currentRows.tag,
        date: currentRows.date,
        received: false,
        repeat_all_months: true,
        base_income_id: id,
        display_order: 0,
      });
      throwIfError(copyError);
    }
  }

  if (isChangingRepeatStatus && !willBeRepeatAllMonths) {
    const baseId = currentRows.base_income_id || id;
    const { error: deleteError } = await supabase
      .from('incomes')
      .delete()
      .eq('base_income_id', baseId)
      .eq('user_id', userId);
    throwIfError(deleteError);
  }

  const row: Record<string, unknown> = {};
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.value !== undefined) row.value = updates.value;
  if (updates.tag !== undefined) row.tag = updates.tag;
  if (updates.received !== undefined) row.received = updates.received;
  if (updates.repeatAllMonths !== undefined) row.repeat_all_months = updates.repeatAllMonths;
  if (updates.date !== undefined) row.date = updates.date;

  if (Object.keys(row).length === 0) return;

  if (applyToAllMonths) {
    const baseId = currentRows.base_income_id || id;
    const { data: targets, error: targetError } = await supabase
      .from('incomes')
      .select('id')
      .eq('user_id', userId)
      .or(`id.eq.${baseId},base_income_id.eq.${baseId}`)
      .gte('year_month', currentRows.year_month);

    throwIfError(targetError);
    const targetIds = (targets || []).map((t) => t.id);
    if (targetIds.length === 0) return;

    const { error: updateError } = await supabase
      .from('incomes')
      .update(row)
      .in('id', targetIds)
      .eq('user_id', userId);

    throwIfError(updateError);
  } else {
    const { error: updateError } = await supabase
      .from('incomes')
      .update(row)
      .eq('id', id)
      .eq('user_id', userId);

    throwIfError(updateError);
  }
}

export async function deleteIncome(
  id: string,
  userId: string,
  applyToAllMonths = false
): Promise<void> {
  if (applyToAllMonths) {
    const { data: income, error: fetchError } = await supabase
      .from('incomes')
      .select('id, base_income_id, year_month')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    throwIfError(fetchError);
    if (!income) throw new Error('Receita não encontrada');

    const baseId = income.base_income_id || id;
    const { data: targets, error: targetError } = await supabase
      .from('incomes')
      .select('id')
      .eq('user_id', userId)
      .or(`id.eq.${baseId},base_income_id.eq.${baseId}`)
      .gte('year_month', income.year_month);

    throwIfError(targetError);
    const targetIds = (targets || []).map((t) => t.id);
    if (targetIds.length === 0) return;

    const { error: deleteError } = await supabase
      .from('incomes')
      .delete()
      .in('id', targetIds)
      .eq('user_id', userId);

    throwIfError(deleteError);
  } else {
    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    throwIfError(error);
  }
}

export async function reorderIncomes(
  incomes: Income[],
  userId: string,
  yearMonth: string
): Promise<void> {
  const incomeIds = incomes.map((income) => income.id);

  const { count, error: checkError } = await supabase
    .from('incomes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .in('id', incomeIds);

  throwIfError(checkError);
  if ((count ?? 0) !== incomeIds.length) {
    throw new Error('Algumas receitas não pertencem ao mês especificado');
  }

  for (let i = 0; i < incomeIds.length; i++) {
    const { error } = await supabase
      .from('incomes')
      .update({ display_order: i })
      .eq('id', incomeIds[i])
      .eq('user_id', userId);

    throwIfError(error);
  }
}
