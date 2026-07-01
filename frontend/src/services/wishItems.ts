import type {
  WishItem,
  CreateWishItemInput,
  UpdateWishItemInput,
} from '@/types/domain';
import { wishItemsAdapter } from './adapters/select';

export async function getWishItems(userId?: string): Promise<WishItem[]> {
  return wishItemsAdapter().getWishItems(userId);
}

export async function createWishItem(
  data: CreateWishItemInput,
  userId?: string
): Promise<WishItem> {
  return wishItemsAdapter().createWishItem(data, userId);
}

export async function updateWishItem(
  id: string,
  data: UpdateWishItemInput,
  userId?: string
): Promise<WishItem> {
  return wishItemsAdapter().updateWishItem(id, data, userId);
}

export async function deleteWishItem(id: string, userId?: string): Promise<void> {
  return wishItemsAdapter().deleteWishItem(id, userId);
}

export async function expireWishItems(ids: string[], userId?: string): Promise<void> {
  return wishItemsAdapter().expireWishItems(ids, userId);
}
