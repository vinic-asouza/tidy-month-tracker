/**
 * Tipos de domínio - Independentes de implementação (Supabase, API, etc)
 * 
 * Estes tipos representam as entidades do domínio da aplicação.
 * Eles são usados em toda a aplicação, exceto nos serviços que fazem
 * a conversão entre tipos de domínio e tipos de infraestrutura.
 * 
 * NOTA: Por compatibilidade, mantemos aliases para os tipos antigos
 * em finance.ts. Eventualmente podemos remover finance.ts e usar apenas domain.ts.
 */

export interface Income {
  id: string;
  description: string;
  value: number;
  tag: string;
  date: string | null;
  received: boolean;
  repeatAllMonths?: boolean;
  baseIncomeId?: string;
  createdAt?: string;
}

export interface Expense {
  id: string;
  type: 'fixed' | 'variable' | 'installment';
  category: string;
  description: string;
  paymentMethod: string;
  value: number;
  paid: boolean;
  date?: string | null;
  repeatAllMonths?: boolean;
  baseExpenseId?: string;
  currentInstallment?: number;
  totalInstallments?: number;
  createdAt?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  color: string;
  paid: boolean;
}

export interface Investment {
  id: string;
  description: string;
  value: number;
  tag: string;
  date: string | null;
  invested: boolean;
  repeatAllMonths?: boolean;
  baseInvestmentId?: string;
  createdAt?: string;
}

export interface MonthData {
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  cardMonthlyStatuses?: Record<string, boolean>; // Map de cardId -> paid status para o mês
}

export interface FinanceSettings {
  incomeTags: string[];
  expenseCategories: string[];
  investmentTags: string[];
  paymentMethods: string[];
}

export interface FinancialRule {
  id: string;
  userId: string;
  essentialsPercentage: number;
  lifestylePercentage: number;
  investmentsPercentage: number;
  categoryMapping: Record<string, 'essentials' | 'lifestyle'>;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinancialRuleInput {
  essentialsPercentage: number;
  lifestylePercentage: number;
  investmentsPercentage: number;
  categoryMapping: Record<string, 'essentials' | 'lifestyle'>;
  isCustom: boolean;
}

export interface UpdateFinancialRuleInput {
  essentialsPercentage?: number;
  lifestylePercentage?: number;
  investmentsPercentage?: number;
  categoryMapping?: Record<string, 'essentials' | 'lifestyle'>;
  isCustom?: boolean;
}

export interface FinancialRuleStats {
  essentials: {
    target: number; // percentual
    current: number; // percentual
    targetValue: number; // valor em R$
    currentValue: number; // valor em R$
    difference: number; // diferença percentual
    differenceValue: number; // diferença em R$
  };
  lifestyle: {
    target: number;
    current: number;
    targetValue: number;
    currentValue: number;
    difference: number;
    differenceValue: number;
  };
  investments: {
    target: number;
    current: number;
    targetValue: number;
    currentValue: number;
    difference: number;
    differenceValue: number;
  };
  projection?: {
    essentials: number;
    lifestyle: number;
    investments: number;
  };
}

export interface CreditCardMonthlyStatus {
  creditCardId: string;
  yearMonth: string;
  paid: boolean;
}
