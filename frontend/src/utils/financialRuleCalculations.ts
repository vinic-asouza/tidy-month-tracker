/**
 * Funções auxiliares para cálculos da Regra Financeira
 */

import type { FinancialRule, FinancialRuleStats, MonthData } from '@/types/domain';

/**
 * Calcula as estatísticas da regra financeira baseado nos dados do mês
 */
export function calculateFinancialRuleStats(
  rule: FinancialRule,
  monthData: MonthData
): FinancialRuleStats {
  // Calcular renda total (todas as entradas)
  const totalIncome = monthData.incomes.reduce((sum, income) => sum + income.value, 0);

  // Calcular gastos essenciais (categorias mapeadas como "essentials")
  const essentialsExpenses = monthData.expenses
    .filter((expense) => rule.categoryMapping[expense.category] === 'essentials')
    .reduce((sum, expense) => sum + expense.value, 0);

  // Calcular gastos de estilo de vida (categorias mapeadas como "lifestyle")
  const lifestyleExpenses = monthData.expenses
    .filter((expense) => rule.categoryMapping[expense.category] === 'lifestyle')
    .reduce((sum, expense) => sum + expense.value, 0);

  // Calcular investimentos (todos os investimentos)
  const totalInvestments = monthData.investments.reduce((sum, inv) => sum + inv.value, 0);

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

/**
 * Calcula projeção baseada em padrões semanais
 */
export function calculateProjection(
  rule: FinancialRule,
  monthData: MonthData,
  currentDate: Date = new Date()
): FinancialRuleStats['projection'] {
  // Verificar se o mês já acabou
  const today = currentDate;
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfMonth = today.getDate();

  // Se o mês já acabou, não há projeção
  if (dayOfMonth >= daysInMonth) {
    return undefined;
  }

  // Calcular semanas passadas e semanas totais
  const weeksPassed = Math.ceil(dayOfMonth / 7);
  const totalWeeks = Math.ceil(daysInMonth / 7);

  // Calcular valores atuais
  const totalIncome = monthData.incomes.reduce((sum, income) => sum + income.value, 0);
  const essentialsExpenses = monthData.expenses
    .filter((expense) => rule.categoryMapping[expense.category] === 'essentials')
    .reduce((sum, expense) => sum + expense.value, 0);
  const lifestyleExpenses = monthData.expenses
    .filter((expense) => rule.categoryMapping[expense.category] === 'lifestyle')
    .reduce((sum, expense) => sum + expense.value, 0);
  const totalInvestments = monthData.investments.reduce((sum, inv) => sum + inv.value, 0);

  // Calcular média semanal atual
  const essentialsWeekly = weeksPassed > 0 ? essentialsExpenses / weeksPassed : 0;
  const lifestyleWeekly = weeksPassed > 0 ? lifestyleExpenses / weeksPassed : 0;
  const investmentsWeekly = weeksPassed > 0 ? totalInvestments / weeksPassed : 0;

  // Projetar para o mês inteiro
  const essentialsProjected = essentialsWeekly * totalWeeks;
  const lifestyleProjected = lifestyleWeekly * totalWeeks;
  const investmentsProjected = investmentsWeekly * totalWeeks;

  // Calcular percentuais projetados
  const essentialsProjectedPercent = totalIncome > 0 ? (essentialsProjected / totalIncome) * 100 : 0;
  const lifestyleProjectedPercent = totalIncome > 0 ? (lifestyleProjected / totalIncome) * 100 : 0;
  const investmentsProjectedPercent = totalIncome > 0 ? (investmentsProjected / totalIncome) * 100 : 0;

  return {
    essentials: essentialsProjectedPercent,
    lifestyle: lifestyleProjectedPercent,
    investments: investmentsProjectedPercent,
  };
}
