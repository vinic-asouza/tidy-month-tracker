// Re-export dos tipos de domínio para compatibilidade
// Nota: Mantido para compatibilidade com código existente
// Componentes podem migrar gradualmente para usar tipos de domain.ts diretamente
import type {
  Income,
  Expense as DomainExpense,
  CreditCard as DomainCreditCard,
  Investment as DomainInvestment,
  MonthData as DomainMonthData,
  FinanceSettings as DomainFinanceSettings,
  AccountType,
} from './domain';

export type { Account, AccountType } from './domain';

// Aliases para manter compatibilidade com código existente
export type IncomeEntry = Income;
export type Expense = DomainExpense;
export type CreditCard = DomainCreditCard;
export type Investment = DomainInvestment;
export type MonthData = DomainMonthData;
export type FinanceSettings = DomainFinanceSettings;

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

export interface AccountTypeConfig {
  value: AccountType;
  label: string;
  icon: string;
}

export const DEFAULT_ACCOUNT_TYPES: AccountTypeConfig[] = [
  { value: 'checking', label: 'Conta Corrente', icon: 'building-2' },
  { value: 'savings', label: 'Poupança', icon: 'piggy-bank' },
  { value: 'investment', label: 'Corretora / Investimentos', icon: 'trending-up' },
  { value: 'cash', label: 'Dinheiro', icon: 'banknote' },
  { value: 'other', label: 'Outro', icon: 'wallet' },
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
  cardMonthlyStatuses: {},
});
