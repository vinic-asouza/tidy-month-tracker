import { useState } from 'react';
import { Wallet, BarChart3, Menu, X } from 'lucide-react';
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
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    getCreditCardTotal,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addTag,
    getYearData,
  } = useFinanceData();

  const currentYear = parseInt(currentMonth.split('-')[0]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold hidden sm:block">Minhas Finanças</h1>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant={view === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setView('dashboard')}
                className="gap-2"
              >
                <Wallet className="h-4 w-4" />
                Controle
              </Button>
              <Button
                variant={view === 'statistics' ? 'default' : 'ghost'}
                onClick={() => setView('statistics')}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Estatísticas
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden pt-3 pb-1 flex gap-2">
              <Button
                variant={view === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}
                className="flex-1 gap-2"
              >
                <Wallet className="h-4 w-4" />
                Controle
              </Button>
              <Button
                variant={view === 'statistics' ? 'default' : 'ghost'}
                onClick={() => { setView('statistics'); setMobileMenuOpen(false); }}
                className="flex-1 gap-2"
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
          <>
            {/* Summary Cards */}
            <SummaryCards monthData={monthData} />

            {/* Main Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <IncomeSection
                  incomes={monthData.incomes}
                  tags={settings.incomeTags}
                  onAdd={addIncome}
                  onUpdate={updateIncome}
                  onDelete={deleteIncome}
                  onAddTag={(tag) => addTag('income', tag)}
                  onRemoveTag={() => {}}
                />
                <ExpenseSection
                  expenses={monthData.expenses}
                  categories={settings.expenseCategories}
                  paymentMethods={[...settings.paymentMethods, ...monthData.creditCards.map(c => c.name)]}
                  onAdd={addExpense}
                  onUpdate={updateExpense}
                  onDelete={deleteExpense}
                  onAddCategory={(cat) => addTag('expense', cat)}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <CreditCardSection
                  creditCards={monthData.creditCards}
                  onAdd={addCreditCard}
                  onUpdate={updateCreditCard}
                  onDelete={deleteCreditCard}
                  getCardTotal={getCreditCardTotal}
                />
                <InvestmentSection
                  investments={monthData.investments}
                  tags={settings.investmentTags}
                  onAdd={addInvestment}
                  onUpdate={updateInvestment}
                  onDelete={deleteInvestment}
                  onAddTag={(tag) => addTag('investment', tag)}
                />
              </div>
            </div>
          </>
        ) : (
          <Statistics
            monthData={monthData}
            yearData={getYearData(currentYear)}
            currentYear={currentYear}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Controle Financeiro Pessoal • Dados salvos localmente
        </div>
      </footer>
    </div>
  );
};

export default Index;
