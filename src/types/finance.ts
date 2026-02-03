export interface IncomeEntry {
  id: string;
  description: string;
  value: number;
  tags: string[];
  date: string;
}

export interface Expense {
  id: string;
  type: 'fixed' | 'variable' | 'installment';
  category: string;
  description: string;
  date?: string;
  paymentMethod: string;
  value: number;
  paid: boolean;
  installment?: string; // e.g., "2/10"
}

export interface CreditCard {
  id: string;
  name: string;
  paid: boolean;
}

export interface Investment {
  id: string;
  description: string;
  value: number;
  tags: string[];
  date: string;
}

export interface MonthData {
  incomes: IncomeEntry[];
  expenses: Expense[];
  creditCards: CreditCard[];
  investments: Investment[];
}

export interface FinanceSettings {
  incomeTags: string[];
  expenseCategories: string[];
  investmentTags: string[];
  paymentMethods: string[];
}

export interface FinanceData {
  months: { [yearMonth: string]: MonthData };
  settings: FinanceSettings;
}

export const DEFAULT_INCOME_TAGS = [
  'Salário',
  'Benefício',
  'Pagamento de terceiros',
  'Freelance',
  'Resgate de investimentos',
  'Outros',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Outros',
];

export const DEFAULT_INVESTMENT_TAGS = [
  'Banco A',
  'Banco B',
  'Corretora',
  'Outros',
];

export const DEFAULT_PAYMENT_METHODS = [
  'Dinheiro',
  'Pix',
  'Débito',
  'Boleto',
];

export const getEmptyMonthData = (): MonthData => ({
  incomes: [],
  expenses: [],
  creditCards: [],
  investments: [],
});
