import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { IncomeSection } from '@/components/IncomeSection';
import { ExpenseSection } from '@/components/ExpenseSection';
import { InvestmentSection } from '@/components/InvestmentSection';
import { CreditCardStrip } from '@/components/CreditCardStrip';
import { SectionSurface } from '@/components/layout/SectionSurface';
import { CreditCard, Expense, IncomeEntry, Investment } from '@/types/finance';
import { cn, formatRecordsMonthTitle } from '@/lib/utils';

export type RecordsTab = 'income' | 'expense' | 'investment';

interface MonthRecordsSectionProps {
  currentMonth: string;
  activeTab: RecordsTab;
  onTabChange: (tab: RecordsTab) => void;
  incomes: IncomeEntry[];
  expenses: Expense[];
  investments: Investment[];
  incomeTags: string[];
  expenseCategories: string[];
  paymentMethods: string[];
  investmentTags: string[];
  creditCards: CreditCard[];
  selectedIncomeIds: Set<string>;
  selectedExpenseIds: Set<string>;
  selectedInvestmentIds: Set<string>;
  onIncomeSelectionChange: (ids: Set<string>) => void;
  onExpenseSelectionChange: (ids: Set<string>) => void;
  onInvestmentSelectionChange: (ids: Set<string>) => void;
  addIncome: (income: Omit<IncomeEntry, 'id'>) => Promise<boolean> | boolean;
  updateIncome: (id: string, updates: Partial<IncomeEntry>, applyToAllMonths?: boolean) => Promise<boolean> | boolean;
  deleteIncome: (id: string, applyToAllMonths?: boolean) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<boolean> | boolean;
  updateExpense: (id: string, updates: Partial<Expense>, applyToAllMonths?: boolean) => Promise<boolean> | boolean;
  deleteExpense: (id: string, applyToAllMonths?: boolean) => void;
  deleteInstallmentExpense: (expense: Expense) => void;
  addInvestment: (investment: Omit<Investment, 'id'>) => Promise<boolean> | boolean;
  updateInvestment: (id: string, updates: Partial<Investment>, applyToAllMonths?: boolean) => Promise<boolean> | boolean;
  deleteInvestment: (id: string, applyToAllMonths?: boolean) => void;
  addCreditCard: (card: Omit<CreditCard, 'id'>) => Promise<boolean> | boolean;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => Promise<boolean> | boolean;
  deleteCreditCard: (id: string) => void;
  getCreditCardTotal: (cardName: string) => number;
  canDeleteCard: (cardName: string) => Promise<boolean>;
  cardNameExists: (name: string, excludeId?: string) => boolean;
  getCardPaidStatus: (cardId: string) => boolean;
  setCardPaidStatus: (cardId: string, paid: boolean) => Promise<boolean>;
  addIncomeTag: (tag: string) => void;
  updateIncomeTag: (oldTag: string, newTag: string) => void;
  deleteIncomeTag: (tag: string) => void;
  addExpenseCategory: (category: string) => Promise<void> | void;
  updateExpenseCategory: (oldCategory: string, newCategory: string) => Promise<void> | void;
  deleteExpenseCategory: (category: string) => Promise<void> | void;
  addInvestmentTag: (tag: string) => void;
  updateInvestmentTag: (oldTag: string, newTag: string) => void;
  deleteInvestmentTag: (tag: string) => void;
  addDialogType: 'income' | 'expense' | 'investment' | 'card' | null;
  onAddDialogClose: () => void;
}

export const MonthRecordsSection = ({
  currentMonth,
  activeTab,
  onTabChange,
  incomes,
  expenses,
  investments,
  incomeTags,
  expenseCategories,
  paymentMethods,
  investmentTags,
  creditCards,
  selectedIncomeIds,
  selectedExpenseIds,
  selectedInvestmentIds,
  onIncomeSelectionChange,
  onExpenseSelectionChange,
  onInvestmentSelectionChange,
  addIncome,
  updateIncome,
  deleteIncome,
  addExpense,
  updateExpense,
  deleteExpense,
  deleteInstallmentExpense,
  addInvestment,
  updateInvestment,
  deleteInvestment,
  addCreditCard,
  updateCreditCard,
  deleteCreditCard,
  getCreditCardTotal,
  canDeleteCard,
  cardNameExists,
  getCardPaidStatus,
  setCardPaidStatus,
  addIncomeTag,
  updateIncomeTag,
  deleteIncomeTag,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  addInvestmentTag,
  updateInvestmentTag,
  deleteInvestmentTag,
  addDialogType,
  onAddDialogClose,
}: MonthRecordsSectionProps) => {
  const tabs = [
    {
      value: 'income' as const,
      label: 'Entradas',
      icon: TrendingUp,
      count: incomes.length,
      color: 'data-[state=active]:text-income',
    },
    {
      value: 'expense' as const,
      label: 'Gastos',
      icon: TrendingDown,
      count: expenses.length,
      color: 'data-[state=active]:text-expense',
    },
    {
      value: 'investment' as const,
      label: 'Investimentos',
      icon: PiggyBank,
      count: investments.length,
      color: 'data-[state=active]:text-investment',
    },
  ];

  return (
    <SectionSurface
      title={formatRecordsMonthTitle(currentMonth)}
      subtitle="Entradas, gastos e investimentos"
    >
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as RecordsTab)}>
        <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-lg grid grid-cols-3 gap-1 overflow-x-auto">
          {tabs.map(({ value, label, icon: Icon, count, color }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                'rounded-md gap-1.5 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm',
                color
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
              <Badge
                variant="secondary"
                className="h-5 min-w-[1.25rem] px-1 text-[10px] font-semibold tabular-nums"
              >
                {count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4 focus-visible:outline-none">
          {activeTab === 'income' && (
            <IncomeSection
              variant="embedded"
              incomes={incomes}
              tags={incomeTags}
              onAdd={addIncome}
              onUpdate={updateIncome}
              onDelete={deleteIncome}
              onAddTag={addIncomeTag}
              onUpdateTag={updateIncomeTag}
              onDeleteTag={deleteIncomeTag}
              selectedIds={selectedIncomeIds}
              onSelectionChange={onIncomeSelectionChange}
              openAddDialog={addDialogType === 'income'}
              onAddDialogClose={onAddDialogClose}
            />
          )}

          {activeTab === 'expense' && (
            <div className="space-y-5">
              <CreditCardStrip
                creditCards={creditCards}
                onAdd={addCreditCard}
                onUpdate={updateCreditCard}
                onDelete={deleteCreditCard}
                getCardTotal={getCreditCardTotal}
                canDeleteCard={canDeleteCard}
                cardNameExists={cardNameExists}
                getCardPaidStatus={getCardPaidStatus}
                setCardPaidStatus={setCardPaidStatus}
                openAddDialog={addDialogType === 'card'}
                onAddDialogClose={onAddDialogClose}
              />
              <Separator />
              <ExpenseSection
                variant="embedded"
                expenses={expenses}
                categories={expenseCategories}
                paymentMethods={paymentMethods}
                creditCards={creditCards}
                onAdd={addExpense}
                onUpdate={updateExpense}
                onDelete={deleteExpense}
                onDeleteInstallment={deleteInstallmentExpense}
                getCardPaidStatus={getCardPaidStatus}
                onAddCategory={addExpenseCategory}
                onUpdateCategory={updateExpenseCategory}
                onDeleteCategory={deleteExpenseCategory}
                selectedIds={selectedExpenseIds}
                onSelectionChange={onExpenseSelectionChange}
                openAddDialog={addDialogType === 'expense'}
                onAddDialogClose={onAddDialogClose}
              />
            </div>
          )}

          {activeTab === 'investment' && (
            <InvestmentSection
              variant="embedded"
              investments={investments}
              tags={investmentTags}
              onAdd={addInvestment}
              onUpdate={updateInvestment}
              onDelete={deleteInvestment}
              onAddTag={addInvestmentTag}
              onUpdateTag={updateInvestmentTag}
              onDeleteTag={deleteInvestmentTag}
              selectedIds={selectedInvestmentIds}
              onSelectionChange={onInvestmentSelectionChange}
              openAddDialog={addDialogType === 'investment'}
              onAddDialogClose={onAddDialogClose}
            />
          )}
        </div>
      </Tabs>
    </SectionSurface>
  );
};
