/**
 * Utilitários para cálculos de parcelas
 * 
 * Reutiliza lógica do frontend (mesma implementação)
 */

export interface InstallmentMonth {
  yearMonth: string;
  installmentNumber: number;
}

/**
 * Calcula os meses e números das parcelas restantes
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
 */
export function isValidInstallmentExpense(
  type: string,
  currentInstallment?: number,
  totalInstallments?: number
): boolean {
  if (type !== 'installment') {
    return false;
  }

  if (!currentInstallment || !totalInstallments) {
    return false;
  }

  if (currentInstallment < 1 || totalInstallments < 1) {
    return false;
  }

  if (currentInstallment > totalInstallments) {
    return false;
  }

  return true;
}
