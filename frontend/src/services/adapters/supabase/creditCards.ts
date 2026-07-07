import { supabase } from '@/integrations/supabase/client';
import type { CreditCard, CreditCardMonthlyStatus } from '@/types/domain';
import type { CreateCreditCardParams, UpdateCreditCardParams } from '@/services/params';
import { toCreditCard } from '../mappers';
import { getAuthUserId, getGlobalItemCount, throwIfError } from './helpers';

export async function getCreditCards(userId: string): Promise<CreditCard[]> {
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', userId)
    .order('display_order');

  throwIfError(error);
  return (data || []).map(toCreditCard);
}

export async function createCreditCard(params: CreateCreditCardParams): Promise<CreditCard> {
  const userId = params.userId ?? (await getAuthUserId());
  const displayOrder =
    params.displayOrder ?? (await getGlobalItemCount('credit_cards', userId));

  const { data, error } = await supabase
    .from('credit_cards')
    .insert({
      user_id: userId,
      name: params.name,
      color: params.color,
      paid: params.paid || false,
      display_order: displayOrder,
      due_day: params.dueDay ?? null,
      credit_limit: params.creditLimit ?? null,
    })
    .select('*')
    .single();

  throwIfError(error);
  return toCreditCard(data!);
}

export async function updateCreditCard(params: UpdateCreditCardParams): Promise<void> {
  const userId = params.userId ?? (await getAuthUserId());
  const { id, updates } = params;

  if (updates.name !== undefined) {
    const { data: currentCard, error: fetchError } = await supabase
      .from('credit_cards')
      .select('name')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    throwIfError(fetchError);
    if (!currentCard) throw new Error('Cartão não encontrado');

    const oldName = currentCard.name;
    if (oldName !== updates.name) {
      const { data: existingCard, error: dupError } = await supabase
        .from('credit_cards')
        .select('id')
        .eq('user_id', userId)
        .eq('name', updates.name)
        .neq('id', id)
        .maybeSingle();

      throwIfError(dupError);
      if (existingCard) throw new Error('Já existe um cartão com este nome');

      const { error: expenseError } = await supabase
        .from('expenses')
        .update({ payment_method: updates.name })
        .eq('user_id', userId)
        .eq('payment_method', oldName);

      throwIfError(expenseError);
    }
  }

  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.color !== undefined) row.color = updates.color;
  if (updates.paid !== undefined) row.paid = updates.paid;
  if (updates.dueDay !== undefined) row.due_day = updates.dueDay;
  if (updates.creditLimit !== undefined) row.credit_limit = updates.creditLimit;

  if (Object.keys(row).length === 0) return;

  const { error } = await supabase
    .from('credit_cards')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId);

  throwIfError(error);
}

export async function deleteCreditCard(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('credit_cards')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  throwIfError(error);
}

export async function canDeleteCreditCard(
  cardName: string,
  userId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('payment_method', cardName);

  throwIfError(error);
  return (count ?? 0) === 0;
}

export async function getCardMonthlyStatus(
  userId: string,
  creditCardId: string,
  yearMonth: string
): Promise<CreditCardMonthlyStatus | null> {
  const { data, error } = await supabase
    .from('credit_card_monthly_status')
    .select('paid')
    .eq('user_id', userId)
    .eq('credit_card_id', creditCardId)
    .eq('year_month', yearMonth)
    .maybeSingle();

  throwIfError(error);
  if (!data) return null;

  return { creditCardId, yearMonth, paid: data.paid };
}

export async function getAllCardMonthlyStatuses(
  userId: string,
  yearMonth: string,
  creditCards: CreditCard[]
): Promise<Record<string, boolean>> {
  const statusMap: Record<string, boolean> = {};
  creditCards.forEach((card) => {
    statusMap[card.id] = false;
  });

  if (creditCards.length === 0) return statusMap;

  const { data, error } = await supabase
    .from('credit_card_monthly_status')
    .select('credit_card_id, paid')
    .eq('user_id', userId)
    .eq('year_month', yearMonth);

  throwIfError(error);
  (data || []).forEach((row) => {
    statusMap[row.credit_card_id] = row.paid;
  });

  return statusMap;
}

export async function setCardMonthlyStatus(
  userId: string,
  creditCardId: string,
  yearMonth: string,
  paid: boolean
): Promise<void> {
  const { error } = await supabase
    .from('credit_card_monthly_status')
    .upsert(
      {
        user_id: userId,
        credit_card_id: creditCardId,
        year_month: yearMonth,
        paid,
      },
      { onConflict: 'user_id,credit_card_id,year_month' }
    );

  throwIfError(error);
}
