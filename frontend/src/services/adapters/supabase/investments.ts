import { supabase } from '@/integrations/supabase/client';
import type { Investment } from '@/types/domain';
import type { CreateInvestmentParams, UpdateInvestmentParams } from '@/services/params';
import { calculateRemainingMonths } from '@/utils/business/repeatMonths';
import { toInvestment } from '../mappers';
import { getAuthUserId, throwIfError } from './helpers';
import { omitPerMonthFields } from '@/utils/business/seriesUpdates';

async function resolveUserId(userId?: string): Promise<string> {
  return userId ?? getAuthUserId();
}

export async function getInvestments(
  userId: string,
  yearMonth: string
): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .order('display_order');

  throwIfError(error);
  return (data || []).map(toInvestment);
}

export async function createInvestment(params: CreateInvestmentParams): Promise<Investment> {
  const userId = await resolveUserId(params.userId);
  const { yearMonth, displayOrder = 0, ...investmentData } = params;
  const itemDate = investmentData.date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      year_month: yearMonth,
      description: investmentData.description,
      value: investmentData.value,
      tag: investmentData.tag,
      date: itemDate,
      invested: false,
      repeat_all_months: investmentData.repeatAllMonths || false,
      display_order: displayOrder,
      account_id: null,
      source_account_id: null,
    })
    .select('*')
    .single();

  throwIfError(error);
  const createdInvestment = toInvestment(data!);

  if (investmentData.repeatAllMonths) {
    const remainingMonths = calculateRemainingMonths(yearMonth);
    if (remainingMonths.length > 0) {
      const rows = remainingMonths.map((month) => ({
        user_id: userId,
        year_month: month,
        description: investmentData.description,
        value: investmentData.value,
        tag: investmentData.tag,
        date: itemDate,
        invested: false,
        repeat_all_months: true,
        base_investment_id: createdInvestment.id,
        display_order: 0,
        account_id: null,
        source_account_id: null,
      }));
      const { error: copyError } = await supabase.from('investments').insert(rows);
      throwIfError(copyError);
    }
  }

  return createdInvestment;
}

export async function updateInvestment(params: UpdateInvestmentParams): Promise<void> {
  const userId = await resolveUserId(params.userId);
  const { id, updates, applyToAllMonths } = params;

  const { data: currentRows, error: fetchError } = await supabase
    .from('investments')
    .select('id, base_investment_id, repeat_all_months, year_month, description, value, tag, date, invested, account_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  throwIfError(fetchError);
  if (!currentRows) throw new Error('Investimento não encontrado');

  const wasRepeatAllMonths = currentRows.repeat_all_months;
  const willBeRepeatAllMonths =
    updates.repeatAllMonths !== undefined ? updates.repeatAllMonths : wasRepeatAllMonths;
  const isChangingRepeatStatus =
    updates.repeatAllMonths !== undefined && updates.repeatAllMonths !== wasRepeatAllMonths;

  if (isChangingRepeatStatus && willBeRepeatAllMonths && !currentRows.base_investment_id) {
    const remainingMonths = calculateRemainingMonths(currentRows.year_month);
    if (remainingMonths.length > 0) {
      const rows = remainingMonths.map((month) => ({
        user_id: userId,
        year_month: month,
        description: updates.description ?? currentRows.description,
        value: updates.value ?? Number(currentRows.value),
        tag: updates.tag ?? currentRows.tag,
        date: currentRows.date,
        invested: false,
        repeat_all_months: true,
        base_investment_id: id,
        display_order: 0,
        account_id: null,
        source_account_id: null,
      }));
      const { error: copyError } = await supabase.from('investments').insert(rows);
      throwIfError(copyError);
    }
  }

  if (isChangingRepeatStatus && !willBeRepeatAllMonths) {
    const baseId = currentRows.base_investment_id || id;
    const { error: deleteError } = await supabase
      .from('investments')
      .delete()
      .eq('base_investment_id', baseId)
      .eq('user_id', userId);
    throwIfError(deleteError);
  }

  const row: Record<string, unknown> = {};
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.value !== undefined) row.value = updates.value;
  if (updates.tag !== undefined) row.tag = updates.tag;
  if (updates.invested !== undefined) row.invested = updates.invested;
  if (updates.repeatAllMonths !== undefined) row.repeat_all_months = updates.repeatAllMonths;
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.accountId !== undefined) row.account_id = updates.accountId ?? null;
  if (updates.sourceAccountId !== undefined) row.source_account_id = updates.sourceAccountId ?? null;

  if (Object.keys(row).length === 0) return;

  if (applyToAllMonths) {
    const baseId = currentRows.base_investment_id || id;
    const { data: targets, error: targetError } = await supabase
      .from('investments')
      .select('id')
      .eq('user_id', userId)
      .or(`id.eq.${baseId},base_investment_id.eq.${baseId}`)
      .gte('year_month', currentRows.year_month);

    throwIfError(targetError);
    const targetIds = (targets || []).map((t) => t.id);
    if (targetIds.length === 0) return;

    const { error: updateError } = await supabase
      .from('investments')
      .update(omitPerMonthFields(row))
      .in('id', targetIds)
      .eq('user_id', userId);

    throwIfError(updateError);
  } else {
    const { error: updateError } = await supabase
      .from('investments')
      .update(row)
      .eq('id', id)
      .eq('user_id', userId);

    throwIfError(updateError);
  }
}

export async function deleteInvestment(
  id: string,
  userId: string,
  applyToAllMonths = false
): Promise<void> {
  if (applyToAllMonths) {
    const { data: investment, error: fetchError } = await supabase
      .from('investments')
      .select('id, base_investment_id, year_month')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    throwIfError(fetchError);
    if (!investment) throw new Error('Investimento não encontrado');

    const baseId = investment.base_investment_id || id;
    const { data: targets, error: targetError } = await supabase
      .from('investments')
      .select('id')
      .eq('user_id', userId)
      .or(`id.eq.${baseId},base_investment_id.eq.${baseId}`)
      .gte('year_month', investment.year_month);

    throwIfError(targetError);
    const targetIds = (targets || []).map((t) => t.id);
    if (targetIds.length === 0) return;

    const { error: deleteError } = await supabase
      .from('investments')
      .delete()
      .in('id', targetIds)
      .eq('user_id', userId);

    throwIfError(deleteError);
  } else {
    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    throwIfError(error);
  }
}

export async function reorderInvestments(
  investments: Investment[],
  userId: string
): Promise<void> {
  const investmentIds = investments.map((investment) => investment.id);

  for (let i = 0; i < investmentIds.length; i++) {
    const { error } = await supabase
      .from('investments')
      .update({ display_order: i })
      .eq('id', investmentIds[i])
      .eq('user_id', userId);

    throwIfError(error);
  }
}
