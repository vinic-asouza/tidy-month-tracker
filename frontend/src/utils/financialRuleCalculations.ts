/**
 * Funções auxiliares para cálculos da Regra Financeira
 */

import type { CreditCard, FinancialRule, FinancialRuleStats, MonthData } from '@/types/domain';
import { isExpenseEffectivelyPaid } from '@/utils/business/monthTotals';

/**
 * Calcula as estatísticas da regra financeira baseado nos dados do mês
 */
export function calculateFinancialRuleStats(
  rule: FinancialRule,
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): FinancialRuleStats {
  const statuses = cardMonthlyStatuses ?? monthData.cardMonthlyStatuses;

  const totalIncome = monthData.incomes
    .filter((income) => income.received)
    .reduce((sum, income) => sum + income.value, 0);

  const effectiveExpenses = monthData.expenses.filter((expense) =>
    isExpenseEffectivelyPaid(expense, creditCards, statuses)
  );

  const totalEffectiveExpenses = effectiveExpenses.reduce(
    (sum, expense) => sum + expense.value,
    0
  );

  const classifiedExpenses = effectiveExpenses.filter(
    (expense) => rule.categoryMapping[expense.category] != null
  );

  const unclassifiedValue = effectiveExpenses
    .filter((expense) => rule.categoryMapping[expense.category] == null)
    .reduce((sum, expense) => sum + expense.value, 0);

  const essentialsExpenses = classifiedExpenses
    .filter((expense) => rule.categoryMapping[expense.category] === 'essentials')
    .reduce((sum, expense) => sum + expense.value, 0);

  const lifestyleExpenses = classifiedExpenses
    .filter((expense) => rule.categoryMapping[expense.category] === 'lifestyle')
    .reduce((sum, expense) => sum + expense.value, 0);

  const totalInvestments = monthData.investments
    .filter((inv) => inv.invested)
    .reduce((sum, inv) => sum + inv.value, 0);

  // Calcular percentuais atuais
  const essentialsCurrent = totalIncome > 0 ? (essentialsExpenses / totalIncome) * 100 : 0;
  const lifestyleCurrent = totalIncome > 0 ? (lifestyleExpenses / totalIncome) * 100 : 0;
  const investmentsCurrent = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;

  // Calcular valores esperados (baseados na renda e percentuais da regra)
  const essentialsTargetValue = (totalIncome * rule.essentialsPercentage) / 100;
  const lifestyleTargetValue = (totalIncome * rule.lifestylePercentage) / 100;
  const investmentsTargetValue = (totalIncome * rule.investmentsPercentage) / 100;

  // Calcular diferenças
  const essentialsDifference = essentialsCurrent - rule.essentialsPercentage;
  const lifestyleDifference = lifestyleCurrent - rule.lifestylePercentage;
  const investmentsDifference = investmentsCurrent - rule.investmentsPercentage;

  const essentialsDifferenceValue = essentialsExpenses - essentialsTargetValue;
  const lifestyleDifferenceValue = lifestyleExpenses - lifestyleTargetValue;
  const investmentsDifferenceValue = totalInvestments - investmentsTargetValue;

  return {
    totalIncome,
    totalEffectiveExpenses,
    unclassifiedValue,
    essentials: {
      target: rule.essentialsPercentage,
      current: essentialsCurrent,
      targetValue: essentialsTargetValue,
      currentValue: essentialsExpenses,
      difference: essentialsDifference,
      differenceValue: essentialsDifferenceValue,
    },
    lifestyle: {
      target: rule.lifestylePercentage,
      current: lifestyleCurrent,
      targetValue: lifestyleTargetValue,
      currentValue: lifestyleExpenses,
      difference: lifestyleDifference,
      differenceValue: lifestyleDifferenceValue,
    },
    investments: {
      target: rule.investmentsPercentage,
      current: investmentsCurrent,
      targetValue: investmentsTargetValue,
      currentValue: totalInvestments,
      difference: investmentsDifference,
      differenceValue: investmentsDifferenceValue,
    },
  };
}
