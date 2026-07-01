/**
 * Hook para gerenciar lista de desejos
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { WishItem, CreateWishItemInput, UpdateWishItemInput } from '@/types/domain';
import * as wishItemsService from '@/services/wishItems';
import {
  filterWishesForMonth,
  shouldAutoExpireWish,
} from '@/utils/business/wishItems';

export const useWishItems = (currentMonth: string) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const hasLoadedRef = useRef(false);

  const loadWishes = useCallback(async () => {
    if (!user) {
      setWishes([]);
      setLoading(false);
      setIsRefetching(false);
      hasLoadedRef.current = false;
      return;
    }

    const isInitialLoad = !hasLoadedRef.current;
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefetching(true);
      }

      const data = await wishItemsService.getWishItems(user.id);
      const toExpire = data
        .filter((wish) => shouldAutoExpireWish(wish, currentMonth))
        .map((wish) => wish.id);

      if (toExpire.length > 0) {
        await wishItemsService.expireWishItems(toExpire, user.id);
        const refreshed = await wishItemsService.getWishItems(user.id);
        setWishes(refreshed);
        toast.info(
          toExpire.length === 1
            ? '1 desejo expirou e pode ser renovado no mês do prazo.'
            : `${toExpire.length} desejos expiraram e podem ser renovados no mês do prazo.`
        );
      } else {
        setWishes(data);
      }

      hasLoadedRef.current = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar desejos';
      toast.error(message);
      setWishes([]);
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  }, [user, currentMonth]);

  useEffect(() => {
    loadWishes();
  }, [loadWishes]);

  const visibleWishes = useMemo(
    () => filterWishesForMonth(wishes, currentMonth),
    [wishes, currentMonth]
  );

  const addWish = useCallback(
    async (data: CreateWishItemInput): Promise<WishItem | null> => {
      if (!user) return null;
      try {
        const created = await wishItemsService.createWishItem(data, user.id);
        setWishes((prev) => [...prev, created]);
        toast.success('Desejo adicionado');
        return created;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao adicionar desejo';
        toast.error(message);
        return null;
      }
    },
    [user]
  );

  const updateWish = useCallback(
    async (id: string, data: UpdateWishItemInput): Promise<WishItem | null> => {
      if (!user) return null;
      try {
        const updated = await wishItemsService.updateWishItem(id, data, user.id);
        setWishes((prev) => prev.map((w) => (w.id === id ? updated : w)));
        toast.success('Desejo atualizado');
        return updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao atualizar desejo';
        toast.error(message);
        return null;
      }
    },
    [user]
  );

  const removeWish = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;
      try {
        await wishItemsService.deleteWishItem(id, user.id);
        setWishes((prev) => prev.filter((w) => w.id !== id));
        toast.success('Desejo removido');
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao remover desejo';
        toast.error(message);
        return false;
      }
    },
    [user]
  );

  const conquerWish = useCallback(
    async (
      id: string,
      conqueredMonth: string,
      linkedExpenseId?: string
    ): Promise<WishItem | null> => {
      if (!user) return null;
      try {
        const updated = await wishItemsService.updateWishItem(
          id,
          {
            status: 'conquered',
            conqueredMonth,
            ...(linkedExpenseId ? { linkedExpenseId } : {}),
          },
          user.id
        );
        setWishes((prev) => prev.map((w) => (w.id === id ? updated : w)));
        toast.success('Desejo conquistado!');
        return updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao conquistar desejo';
        toast.error(message);
        return null;
      }
    },
    [user]
  );

  const renewWish = useCallback(
    async (id: string, newTargetMonth: string): Promise<WishItem | null> => {
      return updateWish(id, {
        status: 'active',
        targetMonth: newTargetMonth,
      });
    },
    [updateWish]
  );

  return {
    wishes,
    visibleWishes,
    loading,
    isRefetching,
    addWish,
    updateWish,
    removeWish,
    conquerWish,
    renewWish,
    refreshWishes: loadWishes,
  };
};
