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

  return buildFinancialRuleStats(
    rule,
    totalIncome,
    totalEffectiveExpenses,
    unclassifiedValue,
    essentialsExpenses,
    lifestyleExpenses,
    totalInvestments
  );
}

function buildFinancialRuleStats(
  rule: FinancialRule,
  totalIncome: number,
  totalEffectiveExpenses: number,
  unclassifiedValue: number,
  essentialsExpenses: number,
  lifestyleExpenses: number,
  totalInvestments: number
): FinancialRuleStats {
  const essentialsCurrent = totalIncome > 0 ? (essentialsExpenses / totalIncome) * 100 : 0;
  const lifestyleCurrent = totalIncome > 0 ? (lifestyleExpenses / totalIncome) * 100 : 0;
  const investmentsCurrent = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;

  const essentialsTargetValue = (totalIncome * rule.essentialsPercentage) / 100;
  const lifestyleTargetValue = (totalIncome * rule.lifestylePercentage) / 100;
  const investmentsTargetValue = (totalIncome * rule.investmentsPercentage) / 100;

  return {
    totalIncome,
    totalEffectiveExpenses,
    unclassifiedValue,
    essentials: {
      target: rule.essentialsPercentage,
      current: essentialsCurrent,
      targetValue: essentialsTargetValue,
      currentValue: essentialsExpenses,
      difference: essentialsCurrent - rule.essentialsPercentage,
      differenceValue: essentialsExpenses - essentialsTargetValue,
    },
    lifestyle: {
      target: rule.lifestylePercentage,
      current: lifestyleCurrent,
      targetValue: lifestyleTargetValue,
      currentValue: lifestyleExpenses,
      difference: lifestyleCurrent - rule.lifestylePercentage,
      differenceValue: lifestyleExpenses - lifestyleTargetValue,
    },
    investments: {
      target: rule.investmentsPercentage,
      current: investmentsCurrent,
      targetValue: investmentsTargetValue,
      currentValue: totalInvestments,
      difference: investmentsCurrent - rule.investmentsPercentage,
      differenceValue: totalInvestments - investmentsTargetValue,
    },
  };
}

/**
 * Calcula as estatísticas da regra financeira consolidadas ao longo do ano.
 * Agrega valores efetivados de todos os meses e deriva os percentuais anuais.
 */
export function calculateAnnualFinancialRuleStats(
  rule: FinancialRule,
  yearData: MonthData[],
  creditCards: CreditCard[] = []
): FinancialRuleStats {
  let totalIncome = 0;
  let totalEffectiveExpenses = 0;
  let unclassifiedValue = 0;
  let essentialsExpenses = 0;
  let lifestyleExpenses = 0;
  let totalInvestments = 0;

  for (const monthData of yearData) {
    const monthStats = calculateFinancialRuleStats(
      rule,
      monthData,
      creditCards,
      monthData.cardMonthlyStatuses
    );

    totalIncome += monthStats.totalIncome;
    totalEffectiveExpenses += monthStats.totalEffectiveExpenses;
    unclassifiedValue += monthStats.unclassifiedValue;
    essentialsExpenses += monthStats.essentials.currentValue;
    lifestyleExpenses += monthStats.lifestyle.currentValue;
    totalInvestments += monthStats.investments.currentValue;
  }

  return buildFinancialRuleStats(
    rule,
    totalIncome,
    totalEffectiveExpenses,
    unclassifiedValue,
    essentialsExpenses,
    lifestyleExpenses,
    totalInvestments
  );
}
