import type { CreditCard, Expense, Income, Investment } from '@/types/domain';

export interface CreateIncomeParams extends Omit<Income, 'id'> {
  userId?: string;
  yearMonth: string;
  displayOrder?: number;
}

export interface UpdateIncomeParams {
  id: string;
  userId?: string;
  updates: Partial<Omit<Income, 'id'>>;
  applyToAllMonths?: boolean;
}

export interface CreateExpenseParams extends Omit<Expense, 'id'> {
  userId?: string;
  yearMonth: string;
  displayOrder?: number;
}

export interface UpdateExpenseParams {
  id: string;
  userId?: string;
  updates: Partial<Omit<Expense, 'id'>>;
  applyToAllMonths?: boolean;
}

export interface CreateInvestmentParams extends Omit<Investment, 'id'> {
  userId?: string;
  yearMonth: string;
  displayOrder?: number;
}

export interface UpdateInvestmentParams {
  id: string;
  userId?: string;
  updates: Partial<Omit<Investment, 'id'>>;
  applyToAllMonths?: boolean;
}

export interface CreateCreditCardParams extends Omit<CreditCard, 'id'> {
  userId?: string;
  displayOrder?: number;
}

export interface UpdateCreditCardParams {
  id: string;
  userId?: string;
  updates: Partial<Omit<CreditCard, 'id'>>;
}
