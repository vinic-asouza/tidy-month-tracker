import { useState } from 'react';
import { Wallet, BarChart3, Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthNavigator } from '@/components/MonthNavigator';
import { SummaryCards } from '@/components/SummaryCards';
import { IncomeSection } from '@/components/IncomeSection';
import { ExpenseSection } from '@/components/ExpenseSection';
import { CreditCardSection } from '@/components/CreditCardSection';
import { InvestmentSection } from '@/components/InvestmentSection';
import { Statistics } from '@/components/Statistics';
import { useFinanceData } from '@/hooks/useFinanceData';

type View = 'dashboard' | 'statistics';

const Index = () => {
  const [view, setView] = useState<View>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const {
    currentMonth,
    setCurrentMonth,
    monthData,
    settings,
    creditCards,
    addIncome,
    updateIncome,
    deleteIncome,
    reorderIncomes,
    addExpense,
    updateExpense,
    deleteExpense,
    deleteInstallmentExpense,
    reorderExpenses,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    getCreditCardTotal,
    canDeleteCard,
    cardNameExists,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    reorderInvestments,
    addInvestmentTag,
    updateInvestmentTag,
    deleteInvestmentTag,
    getYearData,
  } = useFinanceData();

  const currentYear = parseInt(currentMonth.split('-')[0]);

  return (
    <div className="min-h-screen bg-background gradient-subtle">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                  <Wallet className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-income rounded-full border-2 border-background animate-pulse-soft" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold tracking-tight">Minhas Finanças</h1>
                <p className="text-xs text-muted-foreground">Controle financeiro pessoal</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-xl">
              <Button
                variant={view === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setView('dashboard')}
                className={`gap-2 rounded-lg transition-all ${
                  view === 'dashboard' 
                    ? 'gradient-primary shadow-glow text-primary-foreground' 
                    : 'hover:bg-background/80'
                }`}
              >
                <Wallet className="h-4 w-4" />
                Controle
              </Button>
              <Button
                variant={view === 'statistics' ? 'default' : 'ghost'}
                onClick={() => setView('statistics')}
                className={`gap-2 rounded-lg transition-all ${
                  view === 'statistics' 
                    ? 'gradient-primary shadow-glow text-primary-foreground' 
                    : 'hover:bg-background/80'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Estatísticas
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden pt-3 pb-1 flex gap-2 animate-fade-in">
              <Button
                variant={view === 'dashboard' ? 'default' : 'outline'}
                onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}
                className={`flex-1 gap-2 rounded-xl ${
                  view === 'dashboard' ? 'gradient-primary shadow-glow' : ''
                }`}
              >
                <Wallet className="h-4 w-4" />
                Controle
              </Button>
              <Button
                variant={view === 'statistics' ? 'default' : 'outline'}
                onClick={() => { setView('statistics'); setMobileMenuOpen(false); }}
                className={`flex-1 gap-2 rounded-xl ${
                  view === 'statistics' ? 'gradient-primary shadow-glow' : ''
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Estatísticas
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Month Navigator */}
        <MonthNavigator
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />

        {view === 'dashboard' ? (
          <div className="animate-fade-in">
            {/* Summary Cards */}
            <SummaryCards monthData={monthData} />

            {/* Main Grid */}
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              {/* Left Column */}
              <div className="space-y-6">
                <IncomeSection
                  incomes={monthData.incomes}
                  tags={settings.incomeTags}
                  onAdd={addIncome}
                  onUpdate={updateIncome}
                  onDelete={deleteIncome}
                  onReorder={reorderIncomes}
                />
                <ExpenseSection
                  expenses={monthData.expenses}
                  categories={settings.expenseCategories}
                  paymentMethods={settings.paymentMethods}
                  creditCards={creditCards}
                  onAdd={addExpense}
                  onUpdate={updateExpense}
                  onDelete={deleteExpense}
                  onDeleteInstallment={deleteInstallmentExpense}
                  onReorder={reorderExpenses}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <CreditCardSection
                  creditCards={creditCards}
                  onAdd={addCreditCard}
                  onUpdate={updateCreditCard}
                  onDelete={deleteCreditCard}
                  getCardTotal={getCreditCardTotal}
                  canDeleteCard={canDeleteCard}
                  cardNameExists={cardNameExists}
                />
                <InvestmentSection
                  investments={monthData.investments}
                  tags={settings.investmentTags}
                  onAdd={addInvestment}
                  onUpdate={updateInvestment}
                  onDelete={deleteInvestment}
                  onReorder={reorderInvestments}
                  onAddTag={addInvestmentTag}
                  onUpdateTag={updateInvestmentTag}
                  onDeleteTag={deleteInvestmentTag}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <Statistics
              monthData={monthData}
              yearData={getYearData(currentYear)}
              currentYear={currentYear}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12 py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Controle Financeiro Pessoal</span>
            <span className="text-border">•</span>
            <span>Dados salvos localmente</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;