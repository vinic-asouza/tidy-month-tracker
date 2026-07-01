import { apiClient } from '@/api/client';
import type {
  WishItem,
  CreateWishItemInput,
  UpdateWishItemInput,
} from '@/types/domain';

export async function getWishItems(): Promise<WishItem[]> {
  return apiClient.get<WishItem[]>('/api/wish-items');
}

export async function createWishItem(data: CreateWishItemInput): Promise<WishItem> {
  return apiClient.post<WishItem>('/api/wish-items', data);
}

export async function updateWishItem(id: string, data: UpdateWishItemInput): Promise<WishItem> {
  return apiClient.put<WishItem>(`/api/wish-items/${id}`, data);
}

export async function deleteWishItem(id: string): Promise<void> {
  await apiClient.delete(`/api/wish-items/${id}`);
}

export async function expireWishItems(ids: string[]): Promise<void> {
  await apiClient.post('/api/wish-items/expire', { ids });
}
