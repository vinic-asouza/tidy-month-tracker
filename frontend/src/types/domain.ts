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

export type AccountType = 'checking' | 'savings' | 'investment' | 'cash' | 'other';

/** Papel operacional da carteira no fluxo patrimonial. */
export type AccountRole = 'movement' | 'investment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  role: AccountRole;
  color: string | null;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountBalance {
  id: string;
  accountId: string;
  userId: string;
  yearMonth: string;
  balance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertAccountBalanceInput {
  accountId: string;
  userId: string;
  yearMonth: string;
  balance: number;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  role: AccountRole;
  color?: string | null;
  displayOrder?: number;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  role?: AccountRole;
  color?: string | null;
}

export interface Income {
  id: string;
  description: string;
  value: number;
  tag: string;
  date: string | null;
  received: boolean;
  repeatAllMonths?: boolean;
  baseIncomeId?: string;
  accountId?: string;
  sourceOperationId?: string | null;
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
  accountId?: string;
  createdAt?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  color: string;
  paid: boolean;
  dueDay?: number | null;
  creditLimit?: number | null;
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
  /** Carteira de movimentação ou Saldo Livre (`null`) de onde saiu o aporte */
  sourceAccountId?: string | null;
  /** Carteira de investimentos (destino da posição) */
  accountId?: string;
  createdAt?: string;
}

export type AccountOperationType =
  | 'withdrawal'
  | 'transfer_out'
  | 'transfer_in'
  | 'invoice_payment';

export interface AccountOperation {
  id: string;
  type: AccountOperationType;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  transferGroupId: string | null;
  creditCardId: string | null;
  amount: number;
  yearMonth: string;
  operationDate: string;
  description: string | null;
  createdAt?: string;
}

export interface CreateWithdrawalInput {
  userId: string;
  sourceAccountId: string;
  amount: number;
  yearMonth: string;
  operationDate: string;
  description?: string | null;
}

export interface CreateTransferInput {
  userId: string;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  amount: number;
  yearMonth: string;
  operationDate: string;
  description?: string | null;
}

export interface CreateInvoicePaymentInput {
  userId: string;
  sourceAccountId: string | null;
  creditCardId: string;
  amount: number;
  yearMonth: string;
  operationDate: string;
  description?: string | null;
}

export interface UpdateInvoicePaymentInput {
  sourceAccountId?: string | null;
  amount?: number;
  description?: string | null;
}

export interface MonthData {
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  cardMonthlyStatuses?: Record<string, boolean>; // Map de cardId -> paid status para o mês
  accountOperations?: AccountOperation[];
}

export interface FinanceSettings {
  incomeTags: string[];
  expenseCategories: string[];
  investmentTags: string[];
  paymentMethods: string[];
}

export type WishUrgency = 'low' | 'medium' | 'high';
export type WishStatus = 'active' | 'conquered' | 'expired';

export interface WishItem {
  id: string;
  description: string;
  value: number;
  urgency: WishUrgency;
  startMonth: string;
  targetMonth: string;
  status: WishStatus;
  conqueredMonth?: string;
  linkedExpenseId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWishItemInput {
  description: string;
  value: number;
  urgency: WishUrgency;
  startMonth: string;
  targetMonth: string;
}

export interface UpdateWishItemInput {
  description?: string;
  value?: number;
  urgency?: WishUrgency;
  targetMonth?: string;
  status?: WishStatus;
  conqueredMonth?: string | null;
  linkedExpenseId?: string | null;
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
  totalIncome: number;
  totalEffectiveExpenses: number;
  unclassifiedValue: number;
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
