/**
 * Hook para gerenciar regra financeira (cache compartilhado mês/ano — DEV-61).
 */

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  FinancialRule,
  CreateFinancialRuleInput,
  UpdateFinancialRuleInput,
} from '@/types/domain';
import * as financialRuleService from '@/services/financialRule';
import { financialRuleKeys } from '@/lib/financeQueryKeys';

export const useFinancialRule = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();

  const { data: rule = null, isLoading: loading } = useQuery({
    queryKey: financialRuleKeys.detail(userId),
    queryFn: () => financialRuleService.getFinancialRule(),
    enabled: !!userId,
  });

  const createRule = useCallback(
    async (data: CreateFinancialRuleInput): Promise<FinancialRule> => {
      if (!user) throw new Error('Usuário não autenticado');

      try {
        const newRule = await financialRuleService.createFinancialRule(data);
        queryClient.setQueryData(financialRuleKeys.detail(user.id), newRule);
        toast.success('Regra financeira criada com sucesso');
        return newRule;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao criar regra financeira';
        toast.error(message);
        throw error;
      }
    },
    [user, queryClient]
  );

  const updateRule = useCallback(
    async (data: UpdateFinancialRuleInput): Promise<FinancialRule> => {
      if (!user) throw new Error('Usuário não autenticado');

      try {
        const updatedRule = await financialRuleService.updateFinancialRule(data);
        queryClient.setQueryData(financialRuleKeys.detail(user.id), updatedRule);
        toast.success('Regra financeira atualizada com sucesso');
        return updatedRule;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao atualizar regra financeira';
        toast.error(message);
        throw error;
      }
    },
    [user, queryClient]
  );

  const deleteRule = useCallback(async (): Promise<void> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      await financialRuleService.deleteFinancialRule();
      queryClient.setQueryData(financialRuleKeys.detail(user.id), null);
      toast.success('Regra financeira deletada com sucesso');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao deletar regra financeira';
      toast.error(message);
      throw error;
    }
  }, [user, queryClient]);

  const refreshRule = useCallback(async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ queryKey: financialRuleKeys.detail(user.id) });
  }, [user, queryClient]);

  return {
    rule,
    loading,
    createRule,
    updateRule,
    deleteRule,
    refreshRule,
  };
};
