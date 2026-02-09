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
  date: string;
  received: boolean;
  repeatAllMonths?: boolean;
  baseIncomeId?: string;
}

export interface Expense {
  id: string;
  type: 'fixed' | 'variable' | 'installment';
  category: string;
  description: string;
  paymentMethod: string;
  value: number;
  paid: boolean;
  repeatAllMonths?: boolean;
  baseExpenseId?: string;
  currentInstallment?: number;
  totalInstallments?: number;
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
  date: string;
  invested: boolean;
  repeatAllMonths?: boolean;
  baseInvestmentId?: string;
}

export interface MonthData {
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
}

export interface FinanceSettings {
  incomeTags: string[];
  expenseCategories: string[];
  investmentTags: string[];
  paymentMethods: string[];
}

export interface CreditCardMonthlyStatus {
  creditCardId: string;
  yearMonth: string;
  paid: boolean;
}
