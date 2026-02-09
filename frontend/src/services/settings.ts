/**
 * Serviço de Configurações (Settings)
 * 
 * Usa API REST para operações de configurações
 */

import { apiClient } from '@/api/client';
import type { FinanceSettings } from '@/types/domain';

/**
 * Busca as configurações do usuário ou retorna padrões
 */
export async function getSettings(_userId: string): Promise<FinanceSettings> {
  return apiClient.get<FinanceSettings>('/api/settings');
}

/**
 * Atualiza as tags de investimento
 */
export async function updateInvestmentTags(
  _userId: string,
  tags: string[]
): Promise<void> {
  await apiClient.put('/api/settings/investment-tags', { tags });
}

/**
 * Atualiza todas as tags de investimento que usam um nome antigo para um novo
 */
export async function updateInvestmentTagInInvestments(
  _userId: string,
  oldTag: string,
  newTag: string
): Promise<void> {
  await apiClient.put('/api/settings/investment-tags/update', {
    oldTag,
    newTag,
  });
}
