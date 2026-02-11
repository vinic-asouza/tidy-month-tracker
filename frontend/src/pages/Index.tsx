import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Wallet, BarChart3, Menu, X, Sparkles, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthNavigator } from '@/components/MonthNavigator';
import { SummaryCards } from '@/components/SummaryCards';
import { IncomeSection } from '@/components/IncomeSection';
import { ExpenseSection } from '@/components/ExpenseSection';
import { CreditCardSection } from '@/components/CreditCardSection';
import { InvestmentSection } from '@/components/InvestmentSection';
import { Statistics } from '@/components/Statistics';
import { SelectionBottomBar } from '@/components/SelectionBottomBar';
import { useSupabaseFinance } from '@/hooks/useSupabaseFinance';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type View = 'dashboard' | 'statistics';

const Index = () => {
  const [view, setView] = useState<View>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [yearData, setYearData] = useState<ReturnType<typeof useSupabaseFinance>['monthData'][]>([]);
  const [loadingYearData, setLoadingYearData] = useState(false);
  const lastReloadRef = useRef<number>(0);
  const lastMonthDataRef = useRef<string>(''); // Para rastrear mudanças reais nos dados
  
  // Selection state for items
  const [selectedIncomeIds, setSelectedIncomeIds] = useState<Set<string>>(new Set());
  const [selectedInvestmentIds, setSelectedInvestmentIds] = useState<Set<string>>(new Set());
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  
  const { signOut } = useAuth();
  
  const {
    loading,
    monthLoading, // Loading específico para mudanças de mês
    currentMonth,
    setCurrentMonth,
    monthData,
    settings,
    creditCards,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    deleteInstallmentExpense,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    getCreditCardTotal,
    canDeleteCard,
    cardNameExists,
    getCardPaidStatus,
    setCardPaidStatus,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addInvestmentTag,
    updateInvestmentTag,
    deleteInvestmentTag,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    addIncomeTag,
    updateIncomeTag,
    deleteIncomeTag,
    getYearData,
  } = useSupabaseFinance();

  const currentYear = parseInt(currentMonth.split('-')[0]);

  // Recarregar dados anuais quando o mês mudar e estivermos na view de estatísticas
  useEffect(() => {
    if (view === 'statistics' && !loadingYearData && yearData.length === 0) {
      const loadYearData = async () => {
        setLoadingYearData(true);
        const data = await getYearData(currentYear);
        setYearData(data);
        setLoadingYearData(false);
      };
      loadYearData();
    }
  }, [currentYear, view, loadingYearData, yearData.length, getYearData]);

  // Recarregar dados anuais quando monthData mudar (itens marcados/desmarcados)
  // e estivermos na view de estatísticas, com debounce para evitar muitas chamadas
  useEffect(() => {
    if (view !== 'statistics' || loadingYearData) return;

    // Cria uma string única baseada nos IDs dos itens marcados para detectar mudanças reais
    const currentDataHash = JSON.stringify({
      incomes: monthData.incomes.filter(i => i.received).map(i => i.id).sort(),
      expenses: monthData.expenses.filter(e => e.paid).map(e => e.id).sort(),
      investments: monthData.investments.filter(i => i.invested).map(i => i.id).sort(),
    });

    // Se os dados não mudaram realmente, não recarregar
    if (currentDataHash === lastMonthDataRef.current) return;

    lastMonthDataRef.current = currentDataHash;

    const now = Date.now();
    const timeSinceLastReload = now - lastReloadRef.current;
    const debounceTime = 2000; // 2 segundos de debounce

    // Se já recarregamos recentemente, aguardar o tempo restante
    const remainingTime = Math.max(0, debounceTime - timeSinceLastReload);

    const timeoutId = setTimeout(async () => {
      lastReloadRef.current = Date.now();
      setLoadingYearData(true);
      const data = await getYearData(currentYear);
      setYearData(data);
      setLoadingYearData(false);
    }, remainingTime);

    return () => clearTimeout(timeoutId);
  }, [view, currentYear, monthData, loadingYearData, getYearData]);

  const handleViewChange = async (newView: View) => {
    setView(newView);
    setMobileMenuOpen(false);
    
    // Sempre recarregar os dados anuais quando acessar a view de estatísticas
    // para garantir que os dados estejam atualizados (incluindo itens marcados/desmarcados)
    if (newView === 'statistics') {
      setLoadingYearData(true);
      const data = await getYearData(currentYear);
      setYearData(data);
      setLoadingYearData(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logout realizado com sucesso!');
  };

  // Wrapper for canDeleteCard to handle async
  const canDeleteCardSync = (cardName: string): boolean => {
    // For sync compatibility, check current month expenses only
    return !monthData.expenses.some(e => e.paymentMethod === cardName);
  };

  // Selection handlers
  const handleIncomeSelectionChange = useCallback((ids: Set<string>) => {
    setSelectedIncomeIds(ids);
  }, []);

  const handleInvestmentSelectionChange = useCallback((ids: Set<string>) => {
    setSelectedInvestmentIds(ids);
  }, []);

  const handleExpenseSelectionChange = useCallback((ids: Set<string>) => {
    setSelectedExpenseIds(ids);
  }, []);

  const handleClearAllSelections = useCallback(() => {
    setSelectedIncomeIds(new Set());
    setSelectedInvestmentIds(new Set());
    setSelectedExpenseIds(new Set());
  }, []);

  // Calculate selection summary
  const selectionSummary = useMemo(() => {
    const incomesTotal = monthData.incomes
      .filter(income => selectedIncomeIds.has(income.id))
      .reduce((sum, income) => sum + income.value, 0);
    
    const investmentsTotal = monthData.investments
      .filter(investment => selectedInvestmentIds.has(investment.id))
      .reduce((sum, investment) => sum + investment.value, 0);
    
    const expensesTotal = monthData.expenses
      .filter(expense => selectedExpenseIds.has(expense.id))
      .reduce((sum, expense) => sum + expense.value, 0);

    return {
      incomes: incomesTotal,
      investments: investmentsTotal,
      expenses: expensesTotal,
    };
  }, [monthData.incomes, monthData.investments, monthData.expenses, selectedIncomeIds, selectedInvestmentIds, selectedExpenseIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasSelections = selectionSummary.incomes > 0 || selectionSummary.investments > 0 || selectionSummary.expenses > 0;

  return (
    <div className={`min-h-screen bg-background gradient-subtle ${hasSelections ? 'pb-24' : ''}`}>
      {/* Header Flutuante */}
      <header 
        className="sticky top-4 z-50 mx-4 mt-4 rounded-2xl glass border border-border/50 card-shadow"
        style={{ '--header-height': '64px' } as React.CSSProperties}
      >
        <div className="container mx-auto px-4 py-3">
          {/* Layout: Logo | Seletor de Mês (centro) | Navegação + Logout */}
          <div className="flex items-center justify-between gap-4">
            {/* Esquerda: Logo + Nome */}
            <div className="flex items-center gap-3 flex-shrink-0">
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

            {/* Centro: Seletor de Mês */}
            <div className="flex-1 flex justify-center min-w-0">
              <MonthNavigator
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            </div>

            {/* Direita: Navegação + Logout */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl">
                  <Button
                    variant={view === 'dashboard' ? 'default' : 'ghost'}
                    onClick={() => handleViewChange('dashboard')}
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
                    onClick={() => handleViewChange('statistics')}
                    className={`gap-2 rounded-lg transition-all ${
                      view === 'statistics' 
                        ? 'gradient-primary shadow-glow text-primary-foreground' 
                        : 'hover:bg-background/80'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Estatísticas
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </nav>

              {/* Mobile Menu Button */}
              <div className="flex md:hidden items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden pt-3 pb-1 flex gap-2 animate-fade-in">
              <Button
                variant={view === 'dashboard' ? 'default' : 'outline'}
                onClick={() => handleViewChange('dashboard')}
                className={`flex-1 gap-2 rounded-xl ${
                  view === 'dashboard' ? 'gradient-primary shadow-glow' : ''
                }`}
              >
                <Wallet className="h-4 w-4" />
                Controle
              </Button>
              <Button
                variant={view === 'statistics' ? 'default' : 'outline'}
                onClick={() => handleViewChange('statistics')}
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

      {/* Conteúdo - scrollável, loading apenas aqui */}
      <main className="container mx-auto px-4 py-6">
        {view === 'dashboard' ? (
          monthLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="animate-fade-in space-y-6">
              {/* Summary Cards */}
              <SummaryCards 
                monthData={monthData}
                creditCards={creditCards}
                getCardPaidStatus={getCardPaidStatus}
              />

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
                    onAddTag={addIncomeTag}
                    onUpdateTag={updateIncomeTag}
                    onDeleteTag={deleteIncomeTag}
                    selectedIds={selectedIncomeIds}
                    onSelectionChange={handleIncomeSelectionChange}
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
                    getCardPaidStatus={getCardPaidStatus}
                    onAddCategory={addExpenseCategory}
                    onUpdateCategory={updateExpenseCategory}
                    onDeleteCategory={deleteExpenseCategory}
                    selectedIds={selectedExpenseIds}
                    onSelectionChange={handleExpenseSelectionChange}
                  />
                </div>

                {/* Right Column - Sticky Credit Cards */}
                <div className="space-y-6">
                  <InvestmentSection
                    investments={monthData.investments}
                    tags={settings.investmentTags}
                    onAdd={addInvestment}
                    onUpdate={updateInvestment}
                    onDelete={deleteInvestment}
                    onAddTag={addInvestmentTag}
                    onUpdateTag={updateInvestmentTag}
                    onDeleteTag={deleteInvestmentTag}
                    selectedIds={selectedInvestmentIds}
                    onSelectionChange={handleInvestmentSelectionChange}
                  />
                  <div className="lg:sticky lg:top-[calc(var(--header-height,64px)+3.5rem)]">
                    <CreditCardSection
                      creditCards={creditCards}
                      currentMonth={currentMonth}
                      onAdd={addCreditCard}
                      onUpdate={updateCreditCard}
                      onDelete={deleteCreditCard}
                      getCardTotal={getCreditCardTotal}
                      canDeleteCard={canDeleteCardSync}
                      cardNameExists={cardNameExists}
                      getCardPaidStatus={getCardPaidStatus}
                      setCardPaidStatus={setCardPaidStatus}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          monthLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="animate-fade-in">
              {loadingYearData && yearData.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Statistics
                  yearData={yearData}
                  currentYear={currentYear}
                  monthData={monthData}
                  settings={settings}
                  creditCards={creditCards}
                  isLoading={loadingYearData && yearData.length > 0}
                />
              )}
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12 py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Controle Financeiro Pessoal</span>
            <span className="text-border">•</span>
            <span>Dados sincronizados na nuvem</span>
          </div>
        </div>
      </footer>

      {/* Selection Bottom Bar */}
      <SelectionBottomBar 
        summary={selectionSummary} 
        onClearAll={handleClearAllSelections}
      />
    </div>
  );
};

export default Index;
