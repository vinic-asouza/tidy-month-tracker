import { supabase } from '@/integrations/supabase/client';
import type {
  WishItem,
  CreateWishItemInput,
  UpdateWishItemInput,
} from '@/types/domain';
import { toWishItem } from '../mappers';
import { getAuthUserId, throwIfError } from './helpers';

async function resolveUserId(userId?: string): Promise<string> {
  return userId ?? getAuthUserId();
}

export async function getWishItems(userId?: string): Promise<WishItem[]> {
  const uid = await resolveUserId(userId);
  const { data, error } = await supabase
    .from('wish_items')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: true });

  throwIfError(error);
  return (data || []).map(toWishItem);
}

export async function createWishItem(
  data: CreateWishItemInput,
  userId?: string
): Promise<WishItem> {
  const uid = await resolveUserId(userId);
  const { data: row, error } = await supabase
    .from('wish_items')
    .insert({
      user_id: uid,
      description: data.description,
      value: data.value,
      urgency: data.urgency,
      start_month: data.startMonth,
      target_month: data.targetMonth,
      status: 'active',
    })
    .select('*')
    .single();

  throwIfError(error);
  return toWishItem(row!);
}

export async function updateWishItem(
  id: string,
  data: UpdateWishItemInput,
  userId?: string
): Promise<WishItem> {
  const uid = await resolveUserId(userId);
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.description !== undefined) payload.description = data.description;
  if (data.value !== undefined) payload.value = data.value;
  if (data.urgency !== undefined) payload.urgency = data.urgency;
  if (data.targetMonth !== undefined) payload.target_month = data.targetMonth;
  if (data.status !== undefined) payload.status = data.status;
  if (data.conqueredMonth !== undefined) payload.conquered_month = data.conqueredMonth;
  if (data.linkedExpenseId !== undefined) payload.linked_expense_id = data.linkedExpenseId;

  const { data: row, error } = await supabase
    .from('wish_items')
    .update(payload)
    .eq('id', id)
    .eq('user_id', uid)
    .select('*')
    .single();

  throwIfError(error);
  return toWishItem(row!);
}

export async function deleteWishItem(id: string, userId?: string): Promise<void> {
  const uid = await resolveUserId(userId);
  const { error } = await supabase.from('wish_items').delete().eq('id', id).eq('user_id', uid);
  throwIfError(error);
}

export async function expireWishItems(ids: string[], userId?: string): Promise<void> {
  if (ids.length === 0) return;
  const uid = await resolveUserId(userId);
  const { error } = await supabase
    .from('wish_items')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('user_id', uid)
    .in('id', ids);

  throwIfError(error);
}
