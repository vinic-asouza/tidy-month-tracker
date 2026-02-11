/**
 * Hook para gerenciar regra financeira
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { FinancialRule, CreateFinancialRuleInput, UpdateFinancialRuleInput } from '@/types/domain';
import * as financialRuleService from '@/services/financialRule';

export const useFinancialRule = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rule, setRule] = useState<FinancialRule | null>(null);

  // Carregar regra ao montar ou quando user mudar
  useEffect(() => {
    if (!user) {
      setRule(null);
      setLoading(false);
      return;
    }

    const loadRule = async () => {
      try {
        setLoading(true);
        const data = await financialRuleService.getFinancialRule();
        setRule(data);
      } catch (error) {
        // Se não houver regra, é normal (retorna null)
        setRule(null);
      } finally {
        setLoading(false);
      }
    };

    loadRule();
  }, [user]);

  // Criar regra
  const createRule = useCallback(async (data: CreateFinancialRuleInput): Promise<FinancialRule> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const newRule = await financialRuleService.createFinancialRule(data);
      setRule(newRule);
      toast.success('Regra financeira criada com sucesso');
      return newRule;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar regra financeira';
      toast.error(message);
      throw error;
    }
  }, [user]);

  // Atualizar regra
  const updateRule = useCallback(async (data: UpdateFinancialRuleInput): Promise<FinancialRule> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    if (!rule) {
      throw new Error('Regra financeira não encontrada');
    }

    try {
      const updatedRule = await financialRuleService.updateFinancialRule(data);
      setRule(updatedRule);
      toast.success('Regra financeira atualizada com sucesso');
      return updatedRule;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar regra financeira';
      toast.error(message);
      throw error;
    }
  }, [user, rule]);

  // Deletar regra
  const deleteRule = useCallback(async (): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    if (!rule) {
      throw new Error('Regra financeira não encontrada');
    }

    try {
      await financialRuleService.deleteFinancialRule();
      setRule(null);
      toast.success('Regra financeira deletada com sucesso');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar regra financeira';
      toast.error(message);
      throw error;
    }
  }, [user, rule]);

  // Recarregar regra
  const refreshRule = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await financialRuleService.getFinancialRule();
      setRule(data);
    } catch (error) {
      setRule(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    rule,
    loading,
    createRule,
    updateRule,
    deleteRule,
    refreshRule,
  };
};
