import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Wallet, BarChart3, Menu, Sparkles, LogOut, Loader2, Moon, Sun, Plus, TrendingUp, TrendingDown, PiggyBank, CreditCard } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { MonthNavigator } from '@/components/MonthNavigator';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MonthSummarySection } from '@/components/MonthSummarySection';
import { MonthRecordsSection, RecordsTab } from '@/components/MonthRecordsSection';
import { Statistics } from '@/components/Statistics';
import { SelectionBottomBar } from '@/components/SelectionBottomBar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSupabaseFinance } from '@/hooks/useSupabaseFinance';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type View = 'dashboard' | 'statistics';

const Index = () => {
  const [view, setView] = useState<View>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [yearData, setYearData] = useState<ReturnType<typeof useSupabaseFinance>['monthData'][]>([]);
  const [loadingYearData, setLoadingYearData] = useState(false);
  const lastReloadRef = useRef<number>(0);
  const lastMonthDataRef = useRef<string>(''); // Para rastrear mudanças reais nos dados
  
  // Selection state for items
  const [selectedIncomeIds, setSelectedIncomeIds] = useState<Set<string>>(new Set());
  const [selectedInvestmentIds, setSelectedInvestmentIds] = useState<Set<string>>(new Set());
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());

  // FAB: tipo de registro a adicionar (abre o dialog da seção correspondente)
  type AddDialogType = 'income' | 'expense' | 'investment' | 'card' | null;
  const [addDialogType, setAddDialogType] = useState<AddDialogType>(null);
  const [fabPopoverOpen, setFabPopoverOpen] = useState(false);
  const [recordsTab, setRecordsTab] = useState<RecordsTab>('expense');
  
  const { signOut } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const themeTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleThemeToggle = useCallback(() => {
    if (themeTransitionTimerRef.current) clearTimeout(themeTransitionTimerRef.current);
    setIsThemeTransitioning(true);
    setTheme(isDark ? 'light' : 'dark');
    themeTransitionTimerRef.current = setTimeout(() => {
      themeTransitionTimerRef.current = null;
      setIsThemeTransitioning(false);
    }, 400);
  }, [isDark, setTheme]);

  useEffect(() => {
    return () => {
      if (themeTransitionTimerRef.current) clearTimeout(themeTransitionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (addDialogType === 'income') setRecordsTab('income');
    else if (addDialogType === 'expense' || addDialogType === 'card') setRecordsTab('expense');
    else if (addDialogType === 'investment') setRecordsTab('investment');
  }, [addDialogType]);
  
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
    setMobileSidebarOpen(false);
    
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
      {/* Overlay de loading na troca de tema */}
      {isThemeTransitioning && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          aria-hidden="true"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full glass border-b border-border"
        style={{ '--header-height': '64px' } as React.CSSProperties}
      >
        <div className="container mx-auto px-4 py-3 relative">
          {/* Layout: Logo (esq) | Seletor de Mês (centro absoluto) | Navegação + Logout (dir) */}
          <div className="flex items-center justify-between gap-4">
            {/* Esquerda: Logo + Nome */}
            <BrandMark className="hidden sm:flex" />
            <BrandMark size="sm" showText={false} className="sm:hidden" />

            {/* Centro: Seletor de Mês (centralizado no centro absoluto do header) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <MonthNavigator
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            </div>

            {/* Direita: Navegação + Logout */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
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
                    Mensal
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
                    Anual
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThemeToggle}
                  className="h-10 w-10 rounded-md hover:bg-muted"
                  title={isDark ? 'Modo claro' : 'Modo escuro'}
                  disabled={isThemeTransitioning}
                >
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-10 w-10 rounded-md hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </nav>

            {/* Mobile: Menu lateral (hambúrguer abre sidebar) */}
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} modal={false}>
              <div className="flex md:hidden items-center gap-2">
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-md"
                    aria-label="Abrir menu de navegação"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </div>
              <SheetContent
                side="right"
                className="flex h-dvh max-h-dvh max-w-xs flex-col gap-0 border-l border-border/60 bg-background/95 px-0 py-0 backdrop-blur-xl"
              >
                <div className="flex shrink-0 items-center border-b border-border/60 px-4 py-4">
                  <BrandMark size="sm" subtitle="Seu painel financeiro" />
                </div>

                <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-4">
                  <div className="space-y-2">
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Navegação
                    </p>
                    <Button
                      variant={view === 'dashboard' ? 'default' : 'ghost'}
                      className={`w-full justify-start gap-3 rounded-md text-sm ${
                        view === 'dashboard'
                          ? 'gradient-primary text-primary-foreground shadow-glow'
                          : 'bg-muted/40 hover:bg-muted'
                      }`}
                      onClick={() => handleViewChange('dashboard')}
                    >
                      <Wallet className="h-4 w-4" />
                      <span>Visão mensal</span>
                    </Button>
                    <Button
                      variant={view === 'statistics' ? 'default' : 'ghost'}
                      className={`w-full justify-start gap-3 rounded-md text-sm ${
                        view === 'statistics'
                          ? 'gradient-primary text-primary-foreground shadow-glow'
                          : 'bg-muted/40 hover:bg-muted'
                      }`}
                      onClick={() => handleViewChange('statistics')}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Visão anual</span>
                    </Button>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border/40">
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Preferências
                    </p>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 rounded-md text-sm hover:bg-muted"
                      onClick={handleThemeToggle}
                      disabled={isThemeTransitioning}
                    >
                      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      <span>{isDark ? 'Modo claro' : 'Modo escuro'}</span>
                    </Button>
                  </div>
                </nav>

                <div className="shrink-0 border-t border-border/60 px-4 py-4">
                  <Button
                    variant="destructive"
                    className="h-11 w-full justify-center gap-2 rounded-lg text-sm font-semibold shadow-lg shadow-destructive/30 hover:shadow-destructive/40"
                    onClick={async () => {
                      await handleSignOut();
                      setMobileSidebarOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            </div>
          </div>
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
            <div className="animate-fade-in space-y-5">
              <MonthSummarySection
                currentMonth={currentMonth}
                monthData={monthData}
                settings={settings}
              />
              <MonthRecordsSection
                currentMonth={currentMonth}
                activeTab={recordsTab}
                onTabChange={setRecordsTab}
                incomes={monthData.incomes}
                expenses={monthData.expenses}
                investments={monthData.investments}
                incomeTags={settings.incomeTags}
                expenseCategories={settings.expenseCategories}
                paymentMethods={settings.paymentMethods}
                investmentTags={settings.investmentTags}
                creditCards={creditCards}
                selectedIncomeIds={selectedIncomeIds}
                selectedExpenseIds={selectedExpenseIds}
                selectedInvestmentIds={selectedInvestmentIds}
                onIncomeSelectionChange={handleIncomeSelectionChange}
                onExpenseSelectionChange={handleExpenseSelectionChange}
                onInvestmentSelectionChange={handleInvestmentSelectionChange}
                addIncome={addIncome}
                updateIncome={updateIncome}
                deleteIncome={deleteIncome}
                addExpense={addExpense}
                updateExpense={updateExpense}
                deleteExpense={deleteExpense}
                deleteInstallmentExpense={deleteInstallmentExpense}
                addInvestment={addInvestment}
                updateInvestment={updateInvestment}
                deleteInvestment={deleteInvestment}
                addCreditCard={addCreditCard}
                updateCreditCard={updateCreditCard}
                deleteCreditCard={deleteCreditCard}
                getCreditCardTotal={getCreditCardTotal}
                canDeleteCard={canDeleteCardSync}
                cardNameExists={cardNameExists}
                getCardPaidStatus={getCardPaidStatus}
                setCardPaidStatus={setCardPaidStatus}
                addIncomeTag={addIncomeTag}
                updateIncomeTag={updateIncomeTag}
                deleteIncomeTag={deleteIncomeTag}
                addExpenseCategory={addExpenseCategory}
                updateExpenseCategory={updateExpenseCategory}
                deleteExpenseCategory={deleteExpenseCategory}
                addInvestmentTag={addInvestmentTag}
                updateInvestmentTag={updateInvestmentTag}
                deleteInvestmentTag={deleteInvestmentTag}
                addDialogType={addDialogType}
                onAddDialogClose={() => setAddDialogType(null)}
              />
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
                  creditCards={creditCards}
                  isLoading={loadingYearData && yearData.length > 0}
                />
              )}
            </div>
          )
        )}

        {/* FAB: Adicionar item — centralizado, efeito glass e hover scale */}
        {view === 'dashboard' && (
          <div
            className="fixed left-0 right-0 z-40 flex justify-center pointer-events-none px-4"
            style={{ bottom: hasSelections ? '5.5rem' : '1.5rem' }}
          >
            <Popover open={fabPopoverOpen} onOpenChange={setFabPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  className={`h-12 px-4 gap-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 pointer-events-auto ${
                    isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
                  }`}
                  aria-label="Adicionar item"
                >
                  <Plus className="h-5 w-5" />
                  Adicionar item
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-56 p-2 rounded-md glass border border-border/50"
                align="center"
                side="top"
                sideOffset={8}
              >
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Adicionar
                </p>
                <div className="grid gap-0.5">
                  <Button
                    variant="ghost"
                    className="justify-start gap-2 rounded-lg text-income hover:bg-income-light hover:text-income"
                    onClick={() => {
                      setAddDialogType('income');
                      setFabPopoverOpen(false);
                    }}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Entrada
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start gap-2 rounded-lg text-expense hover:bg-expense-light hover:text-expense"
                    onClick={() => {
                      setAddDialogType('expense');
                      setFabPopoverOpen(false);
                    }}
                  >
                    <TrendingDown className="h-4 w-4" />
                    Gasto
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start gap-2 rounded-lg text-investment hover:bg-investment-light hover:text-investment"
                    onClick={() => {
                      setAddDialogType('investment');
                      setFabPopoverOpen(false);
                    }}
                  >
                    <PiggyBank className="h-4 w-4" />
                    Investimento
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start gap-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      setAddDialogType('card');
                      setFabPopoverOpen(false);
                    }}
                  >
                    <CreditCard className="h-4 w-4" />
                    Cartão
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
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
