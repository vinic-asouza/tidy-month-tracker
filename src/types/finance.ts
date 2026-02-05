export interface IncomeEntry {
  id: string;
  description: string;
  value: number;
  tag: string; // Changed from tags[] to single tag
  date: string;
  repeatAllMonths?: boolean;
  baseIncomeId?: string; // Reference to the original income if this is a repeated entry
}

export interface Expense {
  id: string;
  type: 'fixed' | 'variable' | 'installment';
  category: string;
  description: string;
  paymentMethod: string;
  value: number;
  paid: boolean;
  repeatAllMonths?: boolean; // For fixed expenses
  baseExpenseId?: string; // Reference to the original expense if this is a repeated entry
  currentInstallment?: number; // e.g., 3
  totalInstallments?: number; // e.g., 10
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
  tag: string; // Changed from tags[] to single tag
  date: string;
}

export interface MonthData {
  incomes: IncomeEntry[];
  expenses: Expense[];
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
  creditCards: CreditCard[]; // Global credit cards
}

export const DEFAULT_INCOME_TAGS = [
  'Salário',
  'Benefício',
  'Extra',
  'Bonificação',
  'Pagamento de terceiros',
  'Freelance',
  'Resgate de investimentos',
  'Rendimentos',
  'Presente',
  'Outros',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Moradia',
  'Contas pessoais',
  'Compras Gerais',
  'Vestuário',
  'Assinaturas',
  'Trabalho',
  'Serviços Gerais',
  'Mercado',
  'Lanches',
  'Combustível',
  'Transporte',
  'Carro',
  'Presentes',
  'Lazer',
  'Estilo de Vida',
  'Consultas Médicas',
  'Suplementação',
  'Remédios',
  'Educação',
  'Viagem',
  'Empréstimos',
  'Doação',
  'Taxas',
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

export const CARD_COLORS = [
  { id: 'violet', name: 'Violeta', class: 'from-violet-500 to-purple-600' },
  { id: 'orange', name: 'Laranja', class: 'from-orange-500 to-red-500' },
  { id: 'emerald', name: 'Esmeralda', class: 'from-emerald-500 to-teal-600' },
  { id: 'blue', name: 'Azul', class: 'from-blue-500 to-indigo-600' },
  { id: 'pink', name: 'Rosa', class: 'from-pink-500 to-rose-600' },
  { id: 'yellow', name: 'Amarelo', class: 'from-yellow-400 to-amber-500' },
  { id: 'slate', name: 'Cinza', class: 'from-slate-600 to-slate-800' },
  { id: 'cyan', name: 'Ciano', class: 'from-cyan-500 to-blue-500' },
  { id: 'red', name: 'Vermelho', class: 'from-red-500 to-rose-600' },
];

export const getEmptyMonthData = (): MonthData => ({
  incomes: [],
  expenses: [],
  investments: [],
});
