/**
 * Funções auxiliares para cálculos da Regra Financeira
 */

import type { CreditCard, FinancialRule, FinancialRuleStats, MonthData } from '@/types/domain';
import {
  isExpenseEffectivelyPaid,
  isResgateIncome,
  type SummaryViewMode,
} from '@/utils/business/monthTotals';

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

/**
 * Calcula as estatísticas da regra financeira com base em todos os lançamentos do mês.
 */
export function calculatePlannedFinancialRuleStats(
  rule: FinancialRule,
  monthData: MonthData
): FinancialRuleStats {
  // Resgates só entram no efetivado: no planejado inflariam a base de renda da regra.
  const totalIncome = monthData.incomes
    .filter((income) => !isResgateIncome(income))
    .reduce((sum, income) => sum + income.value, 0);

  const allExpenses = monthData.expenses;
  const totalEffectiveExpenses = allExpenses.reduce((sum, expense) => sum + expense.value, 0);

  const classifiedExpenses = allExpenses.filter(
    (expense) => rule.categoryMapping[expense.category] != null
  );

  const unclassifiedValue = allExpenses
    .filter((expense) => rule.categoryMapping[expense.category] == null)
    .reduce((sum, expense) => sum + expense.value, 0);

  const essentialsExpenses = classifiedExpenses
    .filter((expense) => rule.categoryMapping[expense.category] === 'essentials')
    .reduce((sum, expense) => sum + expense.value, 0);

  const lifestyleExpenses = classifiedExpenses
    .filter((expense) => rule.categoryMapping[expense.category] === 'lifestyle')
    .reduce((sum, expense) => sum + expense.value, 0);

  const totalInvestments = monthData.investments.reduce((sum, inv) => sum + inv.value, 0);

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

export function calculateFinancialRuleStatsByMode(
  mode: SummaryViewMode,
  rule: FinancialRule,
  monthData: MonthData,
  creditCards: CreditCard[] = [],
  cardMonthlyStatuses?: Record<string, boolean>
): FinancialRuleStats {
  if (mode === 'planned') {
    return calculatePlannedFinancialRuleStats(rule, monthData);
  }
  return calculateFinancialRuleStats(rule, monthData, creditCards, cardMonthlyStatuses);
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

/**
 * Calcula as estatísticas da regra financeira consolidadas ao longo do ano (planejado).
 */
export function calculateAnnualPlannedFinancialRuleStats(
  rule: FinancialRule,
  yearData: MonthData[]
): FinancialRuleStats {
  let totalIncome = 0;
  let totalEffectiveExpenses = 0;
  let unclassifiedValue = 0;
  let essentialsExpenses = 0;
  let lifestyleExpenses = 0;
  let totalInvestments = 0;

  for (const monthData of yearData) {
    const monthStats = calculatePlannedFinancialRuleStats(rule, monthData);

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

export function calculateAnnualFinancialRuleStatsByMode(
  mode: SummaryViewMode,
  rule: FinancialRule,
  yearData: MonthData[],
  creditCards: CreditCard[] = []
): FinancialRuleStats {
  if (mode === 'planned') {
    return calculateAnnualPlannedFinancialRuleStats(rule, yearData);
  }
  return calculateAnnualFinancialRuleStats(rule, yearData, creditCards);
}

function scaleBucketMoney<T extends { targetValue: number; currentValue: number; differenceValue: number }>(
  bucket: T,
  divisor: number
): T {
  return {
    ...bucket,
    targetValue: bucket.targetValue / divisor,
    currentValue: bucket.currentValue / divisor,
    differenceValue: bucket.differenceValue / divisor,
  };
}

/**
 * Média da regra na janela e total dos 12 meses.
 * Sem janela ou sem mês com lançamento, a média fica ausente e o total do ano permanece.
 */
export function resolveAnnualRuleMoney(
  yearStats: FinancialRuleStats,
  windowStats: FinancialRuleStats,
  windowMonthCount: number,
  activeMonthCount: number
): { average: FinancialRuleStats | null; year: FinancialRuleStats } {
  if (windowMonthCount <= 0 || activeMonthCount <= 0) {
    return { average: null, year: yearStats };
  }

  return {
    average: scaleFinancialRuleMoney(windowStats, activeMonthCount),
    year: yearStats,
  };
}

/** Soma gastos das categorias informadas, no modo ativo. Usado no aviso de não mapeadas. */
export function sumExpensesInCategories(
  months: readonly MonthData[],
  categories: readonly string[],
  mode: SummaryViewMode,
  creditCards: CreditCard[]
): number {
  const planned = mode === 'planned';
  return months.reduce((yearSum, monthData) => {
    const monthTotal = monthData.expenses
      .filter((expense) => categories.includes(expense.category))
      .filter(
        (expense) =>
          planned || isExpenseEffectivelyPaid(expense, creditCards, monthData.cardMonthlyStatuses)
      )
      .reduce((sum, expense) => sum + expense.value, 0);
    return yearSum + monthTotal;
  }, 0);
}

/** Divide só os valores em R$. Percentuais da mesma soma permanecem. */
export function scaleFinancialRuleMoney(
  stats: FinancialRuleStats,
  divisor: number
): FinancialRuleStats {
  if (divisor <= 0) return stats;

  return {
    ...stats,
    totalIncome: stats.totalIncome / divisor,
    totalEffectiveExpenses: stats.totalEffectiveExpenses / divisor,
    unclassifiedValue: stats.unclassifiedValue / divisor,
    essentials: scaleBucketMoney(stats.essentials, divisor),
    lifestyle: scaleBucketMoney(stats.lifestyle, divisor),
    investments: scaleBucketMoney(stats.investments, divisor),
  };
}
