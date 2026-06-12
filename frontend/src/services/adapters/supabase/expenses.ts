import { supabase } from '@/integrations/supabase/client';
import type { Expense } from '@/types/domain';
import type { CreateExpenseParams, UpdateExpenseParams } from '@/services/params';
import { calculateRemainingMonths } from '@/utils/business/repeatMonths';
import {
  calculateRemainingInstallments,
  isValidInstallmentExpense,
} from '@/utils/business/installments';
import { toExpense } from '../mappers';
import { getAuthUserId, getMonthItemCount, throwIfError } from './helpers';

async function resolveUserId(userId?: string): Promise<string> {
  return userId ?? getAuthUserId();
}

async function ensureRemainingInstallmentsExist(
  userId: string,
  expenseId: string
): Promise<void> {
  const { data: e, error: fetchError } = await supabase
    .from('expenses')
    .select(
      'id, base_expense_id, year_month, type, category, description, payment_method, value, date, current_installment, total_installments'
    )
    .eq('id', expenseId)
    .eq('user_id', userId)
    .single();

  throwIfError(fetchError);
  if (!e) return;

  const baseId = e.base_expense_id || e.id;
  const cur = e.current_installment != null ? Number(e.current_installment) : null;
  const tot = e.total_installments != null ? Number(e.total_installments) : null;

  if (e.type !== 'installment' || cur == null || tot == null || cur >= tot) return;

  const remaining = calculateRemainingInstallments(e.year_month, cur, tot);
  const itemDate = e.date ?? new Date().toISOString().slice(0, 10);

  for (const inst of remaining) {
    const { count, error: existsError } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('year_month', inst.yearMonth)
      .or(`id.eq.${baseId},base_expense_id.eq.${baseId}`)
      .eq('current_installment', inst.installmentNumber);

    throwIfError(existsError);
    if ((count ?? 0) > 0) continue;

    const { error: insertError } = await supabase.from('expenses').insert({
      user_id: userId,
      year_month: inst.yearMonth,
      type: e.type,
      category: e.category,
      description: e.description,
      payment_method: e.payment_method,
      value: Number(e.value),
      paid: false,
      date: itemDate,
      base_expense_id: baseId,
      current_installment: inst.installmentNumber,
      total_installments: tot,
      display_order: 0,
    });

    throwIfError(insertError);
  }
}

export async function getExpenses(userId: string, yearMonth: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .order('display_order');

  throwIfError(error);
  return (data || []).map(toExpense);
}

export async function createExpense(params: CreateExpenseParams): Promise<Expense> {
  const userId = await resolveUserId(params.userId);
  const { yearMonth, ...expenseData } = params;
  const displayOrder = await getMonthItemCount('expenses', userId, yearMonth);
  const itemDate = expenseData.date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      year_month: yearMonth,
      type: expenseData.type,
      category: expenseData.category,
      description: expenseData.description,
      payment_method: expenseData.paymentMethod,
      value: expenseData.value,
      paid: expenseData.paid || false,
      date: itemDate,
      repeat_all_months: expenseData.repeatAllMonths || false,
      current_installment: expenseData.currentInstallment ?? null,
      total_installments: expenseData.totalInstallments ?? null,
      display_order: displayOrder,
    })
    .select('*')
    .single();

  throwIfError(error);
  const createdExpense = toExpense(data!);

  if (expenseData.type === 'fixed' && expenseData.repeatAllMonths) {
    const remainingMonths = calculateRemainingMonths(yearMonth);
    for (const month of remainingMonths) {
      const { error: copyError } = await supabase.from('expenses').insert({
        user_id: userId,
        year_month: month,
        type: expenseData.type,
        category: expenseData.category,
        description: expenseData.description,
        payment_method: expenseData.paymentMethod,
        value: expenseData.value,
        paid: false,
        date: itemDate,
        repeat_all_months: true,
        base_expense_id: createdExpense.id,
        display_order: 0,
      });
      throwIfError(copyError);
    }
  }

  if (
    isValidInstallmentExpense({
      type: expenseData.type,
      currentInstallment: expenseData.currentInstallment,
      totalInstallments: expenseData.totalInstallments,
    } as Expense)
  ) {
    const installments = calculateRemainingInstallments(
      yearMonth,
      expenseData.currentInstallment!,
      expenseData.totalInstallments!
    );

    for (const inst of installments) {
      const { error: instError } = await supabase.from('expenses').insert({
        user_id: userId,
        year_month: inst.yearMonth,
        type: expenseData.type,
        category: expenseData.category,
        description: expenseData.description,
        payment_method: expenseData.paymentMethod,
        value: expenseData.value,
        paid: false,
        date: itemDate,
        base_expense_id: createdExpense.id,
        current_installment: inst.installmentNumber,
        total_installments: expenseData.totalInstallments,
        display_order: 0,
      });
      throwIfError(instError);
    }
  }

  return createdExpense;
}

export async function updateExpense(params: UpdateExpenseParams): Promise<void> {
  const userId = await resolveUserId(params.userId);
  const { id, updates, applyToAllMonths } = params;

  const { data: currentExpense, error: fetchError } = await supabase
    .from('expenses')
    .select(
      'id, base_expense_id, repeat_all_months, type, year_month, category, description, payment_method, value, date'
    )
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  throwIfError(fetchError);
  if (!currentExpense) throw new Error('Despesa não encontrada');

  const wasRepeatAllMonths = currentExpense.repeat_all_months;
  const willBeRepeatAllMonths =
    updates.repeatAllMonths !== undefined ? updates.repeatAllMonths : wasRepeatAllMonths;
  const isChangingRepeatStatus =
    updates.repeatAllMonths !== undefined && updates.repeatAllMonths !== wasRepeatAllMonths;

  if (currentExpense.type === 'fixed') {
    if (isChangingRepeatStatus && willBeRepeatAllMonths && !currentExpense.base_expense_id) {
      const remainingMonths = calculateRemainingMonths(currentExpense.year_month);
      const currentDate = currentExpense.date ?? new Date().toISOString().slice(0, 10);

      for (const month of remainingMonths) {
        const { error: copyError } = await supabase.from('expenses').insert({
          user_id: userId,
          year_month: month,
          type: currentExpense.type,
          category: updates.category ?? currentExpense.category,
          description: updates.description ?? currentExpense.description,
          payment_method: updates.paymentMethod ?? currentExpense.payment_method,
          value: updates.value ?? Number(currentExpense.value),
          paid: false,
          date: updates.date !== undefined ? updates.date : currentDate,
          repeat_all_months: true,
          base_expense_id: id,
          display_order: 0,
        });
        throwIfError(copyError);
      }
    }

    if (isChangingRepeatStatus && !willBeRepeatAllMonths) {
      const baseId = currentExpense.base_expense_id || id;
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('base_expense_id', baseId)
        .eq('user_id', userId);
      throwIfError(deleteError);
    }
  }

  const row: Record<string, unknown> = {};
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.paymentMethod !== undefined) row.payment_method = updates.paymentMethod;
  if (updates.value !== undefined) row.value = updates.value;
  if (updates.paid !== undefined) row.paid = updates.paid;
  if (updates.repeatAllMonths !== undefined) row.repeat_all_months = updates.repeatAllMonths;
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.currentInstallment !== undefined) row.current_installment = updates.currentInstallment;
  if (updates.totalInstallments !== undefined) row.total_installments = updates.totalInstallments;

  if (Object.keys(row).length === 0) return;

  if (applyToAllMonths) {
    if (currentExpense.type === 'installment') {
      const baseId = currentExpense.base_expense_id || id;
      const { data: installments, error: instFetchError } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', userId)
        .or(`id.eq.${baseId},base_expense_id.eq.${baseId}`);

      throwIfError(instFetchError);
      const targetIds = (installments || []).map((t) => t.id);

      const sharedRow: Record<string, unknown> = {};
      if (updates.category !== undefined) sharedRow.category = updates.category;
      if (updates.description !== undefined) sharedRow.description = updates.description;
      if (updates.paymentMethod !== undefined) sharedRow.payment_method = updates.paymentMethod;
      if (updates.value !== undefined) sharedRow.value = updates.value;
      if (updates.paid !== undefined) sharedRow.paid = updates.paid;
      if (updates.date !== undefined) sharedRow.date = updates.date;

      if (Object.keys(sharedRow).length > 0 && targetIds.length > 0) {
        const { error: sharedError } = await supabase
          .from('expenses')
          .update(sharedRow)
          .in('id', targetIds)
          .eq('user_id', userId);
        throwIfError(sharedError);
      }

      const instRow: Record<string, unknown> = {};
      if (updates.currentInstallment !== undefined) {
        instRow.current_installment = updates.currentInstallment;
      }
      if (updates.totalInstallments !== undefined) {
        instRow.total_installments = updates.totalInstallments;
      }

      if (Object.keys(instRow).length > 0) {
        const { error: instUpdateError } = await supabase
          .from('expenses')
          .update(instRow)
          .eq('id', id)
          .eq('user_id', userId);
        throwIfError(instUpdateError);
      }

      await ensureRemainingInstallmentsExist(userId, id);
      return;
    }

    if (currentExpense.type === 'fixed') {
      const baseId = currentExpense.base_expense_id || id;
      const { data: targets, error: targetError } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', userId)
        .or(`id.eq.${baseId},base_expense_id.eq.${baseId}`)
        .gte('year_month', currentExpense.year_month);

      throwIfError(targetError);
      const targetIds = (targets || []).map((t) => t.id);
      if (targetIds.length === 0) return;

      const { error: updateError } = await supabase
        .from('expenses')
        .update(row)
        .in('id', targetIds)
        .eq('user_id', userId);

      throwIfError(updateError);
      return;
    }

    const { error: updateError } = await supabase
      .from('expenses')
      .update(row)
      .eq('id', id)
      .eq('user_id', userId);

    throwIfError(updateError);
  } else {
    const { error: updateError } = await supabase
      .from('expenses')
      .update(row)
      .eq('id', id)
      .eq('user_id', userId);

    throwIfError(updateError);

    if (
      currentExpense.type === 'installment' &&
      (updates.currentInstallment !== undefined || updates.totalInstallments !== undefined)
    ) {
      await ensureRemainingInstallmentsExist(userId, id);
    }
  }
}

export async function deleteExpense(
  id: string,
  userId: string,
  applyToAllMonths = false
): Promise<void> {
  if (applyToAllMonths) {
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('id, base_expense_id, type, year_month')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    throwIfError(fetchError);
    if (!expense) throw new Error('Despesa não encontrada');

    let targetIds = [id];

    if (expense.type === 'fixed') {
      const baseId = expense.base_expense_id || id;
      const { data: targets, error: targetError } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', userId)
        .or(`id.eq.${baseId},base_expense_id.eq.${baseId}`)
        .gte('year_month', expense.year_month);

      throwIfError(targetError);
      targetIds = (targets || []).map((t) => t.id);
      if (targetIds.length === 0) return;
    }

    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .in('id', targetIds)
      .eq('user_id', userId);

    throwIfError(deleteError);
  } else {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    throwIfError(error);
  }
}

export async function deleteInstallmentExpense(
  expense: Expense,
  userId: string
): Promise<void> {
  const { data: row, error: fetchError } = await supabase
    .from('expenses')
    .select('base_expense_id, id')
    .eq('id', expense.id)
    .eq('user_id', userId)
    .single();

  throwIfError(fetchError);
  if (!row) return;

  const baseId = row.base_expense_id || row.id;

  const { data: toDelete, error: listError } = await supabase
    .from('expenses')
    .select('id')
    .eq('user_id', userId)
    .or(`id.eq.${baseId},base_expense_id.eq.${baseId}`);

  throwIfError(listError);
  const ids = (toDelete || []).map((r) => r.id);
  if (ids.length === 0) return;

  const { error: deleteError } = await supabase
    .from('expenses')
    .delete()
    .in('id', ids)
    .eq('user_id', userId);

  throwIfError(deleteError);
}

export async function reorderExpenses(
  expenses: Expense[],
  userId: string
): Promise<void> {
  const expenseIds = expenses.map((expense) => expense.id);

  for (let i = 0; i < expenseIds.length; i++) {
    const { error } = await supabase
      .from('expenses')
      .update({ display_order: i })
      .eq('id', expenseIds[i])
      .eq('user_id', userId);

    throwIfError(error);
  }
}
