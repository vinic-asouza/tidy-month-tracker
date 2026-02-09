/**
 * Lógica de negócio para despesas parceladas
 * 
 * Funções puras para calcular parcelas de despesas.
 * Sem dependências de I/O, facilmente testáveis.
 */

import type { Expense } from '@/types/domain';

export interface InstallmentMonth {
  yearMonth: string;
  installmentNumber: number;
}

/**
 * Calcula os meses e números das parcelas restantes de uma despesa parcelada
 * 
 * @param currentYearMonth - Mês atual no formato "YYYY-MM"
 * @param currentInstallment - Número da parcela atual (ex: 1, 2, 3...)
 * @param totalInstallments - Total de parcelas
 * @returns Array com os meses e números das parcelas restantes
 * 
 * @example
 * calculateRemainingInstallments("2024-01", 1, 5)
 * // Retorna: [
 * //   { yearMonth: "2024-02", installmentNumber: 2 },
 * //   { yearMonth: "2024-03", installmentNumber: 3 },
 * //   { yearMonth: "2024-04", installmentNumber: 4 },
 * //   { yearMonth: "2024-05", installmentNumber: 5 }
 * // ]
 */
export function calculateRemainingInstallments(
  currentYearMonth: string,
  currentInstallment: number,
  totalInstallments: number
): InstallmentMonth[] {
  const [year, month] = currentYearMonth.split('-').map(Number);
  const remaining = totalInstallments - currentInstallment;
  
  if (remaining <= 0) {
    return [];
  }

  const installments: InstallmentMonth[] = [];
  
  for (let i = 1; i <= remaining; i++) {
    let targetMonth = month + i;
    let targetYear = year;

    // Ajusta para o próximo ano se necessário
    while (targetMonth > 12) {
      targetMonth -= 12;
      targetYear += 1;
    }

    const yearMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    installments.push({
      yearMonth,
      installmentNumber: currentInstallment + i,
    });
  }

  return installments;
}

/**
 * Valida se uma despesa parcelada tem dados válidos
 * 
 * Aceita Expense completo ou parcial (sem id) para validação
 */
export function isValidInstallmentExpense(
  expense: Expense | Omit<Expense, 'id'>
): boolean {
  if (expense.type !== 'installment') {
    return false;
  }

  if (!expense.currentInstallment || !expense.totalInstallments) {
    return false;
  }

  if (expense.currentInstallment < 1 || expense.totalInstallments < 1) {
    return false;
  }

  if (expense.currentInstallment > expense.totalInstallments) {
    return false;
  }

  return true;
}
