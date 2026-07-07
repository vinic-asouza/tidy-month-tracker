import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { Wallet, BarChart3, Menu, Sparkles, LogOut, Loader2, Moon, Sun, Plus, TrendingUp, TrendingDown, PiggyBank, CreditCard, Calendar, Gift } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { MonthNavigator, getCurrentMonthKey, isCurrentMonthKey } from '@/components/MonthNavigator';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AccountStrip } from '@/components/AccountStrip';
import { MonthSummarySection } from '@/components/MonthSummarySection';
import { MonthRecordsSection, RecordsTab } from '@/components/MonthRecordsSection';
import { SelectionBottomBar } from '@/components/SelectionBottomBar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FinancialGlossaryDialog } from '@/components/FinancialGlossaryDialog';
import { useSupabaseFinance } from '@/hooks/useSupabaseFinance';
import { useWishItems } from '@/hooks/useWishItems';
import { useAuth } from '@/contexts/AuthContext';
import type { WishItem } from '@/types/domain';
import type { Expense } from '@/types/finance';
import { toast } from 'sonner';
import { isExpenseEffectivelyPaid } from '@/utils/business/monthTotals';
import { getWishRealizedMetrics } from '@/utils/business/wishItems';
import { showSelectionHintIfNeeded } from '@/utils/selectionHint';
import { cn } from '@/lib/utils';

const Statistics = lazy(() =>
  import('@/components/Statistics').then((m) => ({ default: m.Statistics }))
);

type View = 'dashboard' | 'statistics';

const Index = () => {
  const [view, setView] = useState<View>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Selection state for items
  const [selectedIncomeIds, setSelectedIncomeIds] = useState<Set<string>>(new Set());
  const [selectedInvestmentIds, setSelectedInvestmentIds] = useState<Set<string>>(new Set());
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());

  // FAB: tipo de registro a adicionar (abre o dialog da seção correspondente)
  type AddDialogType = 'income' | 'expense' | 'investment' | 'card' | 'wish' | 'account' | null;
  const [addDialogType, setAddDialogType] = useState<AddDialogType>(null);
  const [expenseDraft, setExpenseDraft] = useState<Partial<Expense> | null>(null);
  const [pendingWishConquer, setPendingWishConquer] = useState<WishItem | null>(null);
  const [fabPopoverOpen, setFabPopoverOpen] = useState(false);
  const [recordsTab, setRecordsTab] = useState<RecordsTab>('expense');
  const [monthAnnouncer, setMonthAnnouncer] = useState('');
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
    }, 150);
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
    else if (addDialogType === 'wish') setRecordsTab('wish');
    // 'account' não muda aba — abre o AccountStrip diretamente
  }, [addDialogType]);
  
  const {
    loading,
    monthRefetching,
    currentMonth,
    setCurrentMonth,
    monthData,
    settings,
    accounts,
    accountBalances,
    accountHistoryMonths,
    creditCards,
    cardMonthlyStatus,
    addAccount,
    updateAccount,
    deleteAccount,
    accountNameExists,
    upsertAccountBalance,
    createWithdrawal,
    createTransfer,
    deleteOperation,
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
    payCardInvoice,
    unpayCardInvoice,
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
    yearData,
    loadingYearData,
  } = useSupabaseFinance({ statisticsEnabled: view === 'statistics' });

  const {
    wishes,
    visibleWishes,
    loading: wishesLoading,
    isRefetching: wishesRefetching,
    addWish,
    updateWish,
    removeWish,
    conquerWish,
    renewWish,
  } = useWishItems(currentMonth);

  const wishRealizedMetrics = useMemo(
    () => getWishRealizedMetrics(wishes, currentMonth, monthData.expenses),
    [wishes, currentMonth, monthData.expenses]
  );

  const wishConquerPlannedValue = pendingWishConquer?.value;

  const handleWishConquer = useCallback(
    async (wish: WishItem, options: { createExpense: boolean }) => {
      if (options.createExpense) {
        setPendingWishConquer(wish);
        setExpenseDraft({
          description: wish.description,
          type: 'variable',
        });
        setRecordsTab('expense');
      } else {
        await conquerWish(wish.id, currentMonth);
      }
    },
    [conquerWish, currentMonth]
  );

  const handleAddExpense = useCallback(
    async (expense: Omit<Expense, 'id'>) => {
      const created = await addExpense(expense);
      if (!created) return null;

      if (pendingWishConquer) {
        const conquered = await conquerWish(
          pendingWishConquer.id,
          currentMonth,
          created.id
        );
        if (!conquered) {
          toast.error(
            'Gasto salvo, mas o desejo não foi marcado como conquistado. Você pode conquistá-lo manualmente ou excluir o gasto.'
          );
          return created;
        }
        setPendingWishConquer(null);
      }

      return created;
    },
    [addExpense, pendingWishConquer, conquerWish, currentMonth]
  );

  const handleExpenseDraftConsumed = useCallback((cancelled = true) => {
    if (cancelled && pendingWishConquer) {
      toast.info('Registro de gasto cancelado. O desejo continua ativo.');
      setPendingWishConquer(null);
    }
    setExpenseDraft(null);
  }, [pendingWishConquer]);

  useEffect(() => {
    if (recordsTab !== 'expense' && (pendingWishConquer || expenseDraft)) {
      handleExpenseDraftConsumed();
    }
  }, [recordsTab]); // eslint-disable-line react-hooks/exhaustive-deps -- pending/expenseDraft lidos no closure

  useEffect(() => {
    if (pendingWishConquer || expenseDraft) {
      handleExpenseDraftConsumed();
    }
  }, [currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps -- cleanup ao trocar mês com pendência ativa

  const currentYear = parseInt(currentMonth.split('-')[0]);

  useEffect(() => {
    if (!monthRefetching && currentMonth) {
      const [year, month] = currentMonth.split('-');
      const monthNames = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
      ];
      setMonthAnnouncer(`${monthNames[parseInt(month, 10) - 1]} de ${year}`);
    }
  }, [currentMonth, monthRefetching]);

  const handleClearAllSelections = useCallback(() => {
    setSelectedIncomeIds(new Set());
    setSelectedInvestmentIds(new Set());
    setSelectedExpenseIds(new Set());
  }, []);

  // Limpar seleções ao trocar de mês
  useEffect(() => {
    handleClearAllSelections();
  }, [currentMonth, handleClearAllSelections]);

  const handleViewChange = (newView: View) => {
    setView(newView);
    setMobileSidebarOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
    } catch {
      toast.error('Erro ao sair. Tente novamente.');
    }
  };

  // Selection handlers
  const handleIncomeSelectionChange = useCallback((ids: Set<string>) => {
    if (ids.size > selectedIncomeIds.size) showSelectionHintIfNeeded();
    setSelectedIncomeIds(ids);
  }, [selectedIncomeIds.size]);

  const handleInvestmentSelectionChange = useCallback((ids: Set<string>) => {
    if (ids.size > selectedInvestmentIds.size) showSelectionHintIfNeeded();
    setSelectedInvestmentIds(ids);
  }, [selectedInvestmentIds.size]);

  const handleExpenseSelectionChange = useCallback((ids: Set<string>) => {
    if (ids.size > selectedExpenseIds.size) showSelectionHintIfNeeded();
    setSelectedExpenseIds(ids);
  }, [selectedExpenseIds.size]);

  // Calculate selection summary
  const selectionSummary = useMemo(() => {
    const incomesTotal = monthData.incomes
      .filter((income) => selectedIncomeIds.has(income.id) && income.received)
      .reduce((sum, income) => sum + income.value, 0);

    const investmentsTotal = monthData.investments
      .filter((investment) => selectedInvestmentIds.has(investment.id) && investment.invested)
      .reduce((sum, investment) => sum + investment.value, 0);

    const expensesTotal = monthData.expenses
      .filter(
        (expense) =>
          selectedExpenseIds.has(expense.id) &&
          isExpenseEffectivelyPaid(expense, creditCards, cardMonthlyStatus)
      )
      .reduce((sum, expense) => sum + expense.value, 0);

    return {
      incomes: incomesTotal,
      investments: investmentsTotal,
      expenses: expensesTotal,
    };
  }, [
    monthData.incomes,
    monthData.investments,
    monthData.expenses,
    selectedIncomeIds,
    selectedInvestmentIds,
    selectedExpenseIds,
    creditCards,
    cardMonthlyStatus,
  ]);

  const selectedCount =
    selectedIncomeIds.size + selectedInvestmentIds.size + selectedExpenseIds.size;

  const effectiveSelectedCount = useMemo(() => {
    let count = 0;
    monthData.incomes.forEach((i) => {
      if (selectedIncomeIds.has(i.id) && i.received) count++;
    });
    monthData.investments.forEach((i) => {
      if (selectedInvestmentIds.has(i.id) && i.invested) count++;
    });
    monthData.expenses.forEach((e) => {
      if (
        selectedExpenseIds.has(e.id) &&
        isExpenseEffectivelyPaid(e, creditCards, cardMonthlyStatus)
      ) {
        count++;
      }
    });
    return count;
  }, [
    monthData.incomes,
    monthData.investments,
    monthData.expenses,
    selectedIncomeIds,
    selectedInvestmentIds,
    selectedExpenseIds,
    creditCards,
    cardMonthlyStatus,
  ]);

  const selectionPlannedTotal = useMemo(() => {
    const incomes = monthData.incomes
      .filter((i) => selectedIncomeIds.has(i.id))
      .reduce((sum, i) => sum + i.value, 0);
    const investments = monthData.investments
      .filter((i) => selectedInvestmentIds.has(i.id))
      .reduce((sum, i) => sum + i.value, 0);
    const expenses = monthData.expenses
      .filter((e) => selectedExpenseIds.has(e.id))
      .reduce((sum, e) => sum + e.value, 0);
    return incomes + investments + expenses;
  }, [
    monthData.incomes,
    monthData.investments,
    monthData.expenses,
    selectedIncomeIds,
    selectedInvestmentIds,
    selectedExpenseIds,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasSelections = selectedCount > 0;

  const handleFabOpenChange = (open: boolean) => {
    if (open && view === 'statistics') {
      handleViewChange('dashboard');
    }
    setFabPopoverOpen(open);
  };

  const showFab = view === 'dashboard' || view === 'statistics';

  return (
    <div className={`min-h-screen bg-background gradient-subtle ${hasSelections ? 'pb-24' : ''}`}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full glass border-b border-border"
        style={{ '--header-height': '64px' } as React.CSSProperties}
      >
        <div className="container mx-auto px-4 py-2 sm:py-3 relative">
          {/* Layout: Logo + Mês (esq mobile) | Mês centralizado (desktop) | Navegação (dir) */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Esquerda: Logo + Seletor de Mês (mobile) */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-initial">
              <BrandMark className="hidden sm:flex shrink-0" />
              <BrandMark size="sm" showText={false} className="sm:hidden shrink-0" />
              <div className="sm:hidden min-w-0 flex-1">
                <MonthNavigator
                  compact
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
              </div>
            </div>

            {/* Centro: Seletor de Mês + atalho mês atual (desktop) */}
            <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-2">
              <MonthNavigator
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
              {!isCurrentMonthKey(currentMonth) && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentMonth(getCurrentMonthKey())}
                  className="gap-2 rounded-md hover:bg-muted text-sm shrink-0"
                  aria-label="Ir para mês atual"
                >
                  <Calendar className="h-4 w-4" />
                  Ir para mês atual
                </Button>
              )}
            </div>

            {/* Direita: Navegação + Logout */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                  <Button
                    variant={view === 'dashboard' ? 'default' : 'ghost'}
                    onClick={() => handleViewChange('dashboard')}
                    aria-current={view === 'dashboard' ? 'page' : undefined}
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
                    aria-current={view === 'statistics' ? 'page' : undefined}
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
                  aria-label={isDark ? 'Modo claro' : 'Modo escuro'}
                >
                  {isThemeTransitioning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isDark ? (
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

            {/* Mobile: atalho Mensal/Anual + menu */}
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <div className="flex md:hidden items-center gap-1.5">
                {!isCurrentMonthKey(currentMonth) && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(getCurrentMonthKey())}
                    className="h-9 w-9 rounded-md border-primary/30 text-primary hover:bg-accent hover:text-accent-foreground"
                    aria-label="Ir para mês atual"
                    title="Mês atual"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex items-center gap-0.5 p-0.5 bg-muted/50 rounded-lg">
                  <Button
                    variant={view === 'dashboard' ? 'default' : 'ghost'}
                    size="icon"
                    className={`h-9 w-9 rounded-md ${view === 'dashboard' ? 'gradient-primary text-primary-foreground shadow-glow' : ''}`}
                    onClick={() => handleViewChange('dashboard')}
                    aria-label="Visão mensal"
                    aria-current={view === 'dashboard' ? 'page' : undefined}
                  >
                    <Wallet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === 'statistics' ? 'default' : 'ghost'}
                    size="icon"
                    className={`h-9 w-9 rounded-md ${view === 'statistics' ? 'gradient-primary text-primary-foreground shadow-glow' : ''}`}
                    onClick={() => handleViewChange('statistics')}
                    aria-label="Visão anual"
                    aria-current={view === 'statistics' ? 'page' : undefined}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>
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
                      Ajuda
                    </p>
                    <FinancialGlossaryDialog
                      trigger={
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 rounded-md text-sm hover:bg-muted"
                          onClick={() => setMobileSidebarOpen(false)}
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Como lemos seus números</span>
                        </Button>
                      }
                    />
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
      <main className="container mx-auto px-4 py-6" aria-live="polite" aria-atomic="true">
        <span className="sr-only">{monthAnnouncer}</span>
        {monthRefetching && (
          <div
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Atualizando dados do mês…
          </div>
        )}
        {view === 'dashboard' ? (
            <div className={cn('space-y-5', monthRefetching && 'opacity-60 transition-opacity')}>
              <MonthSummarySection
                currentMonth={currentMonth}
                monthData={monthData}
                settings={settings}
                creditCards={creditCards}
                cardMonthlyStatuses={cardMonthlyStatus}
              />
              <AccountStrip
            accounts={accounts}
            accountBalances={accountBalances}
            accountHistoryMonths={accountHistoryMonths}
            currentMonth={currentMonth}
            monthData={monthData}
            creditCards={creditCards}
            cardMonthlyStatuses={cardMonthlyStatus}
            onAdd={addAccount}
            onUpdate={updateAccount}
            onDelete={deleteAccount}
            onUpsertBalance={upsertAccountBalance}
            onCreateWithdrawal={createWithdrawal}
            onCreateTransfer={createTransfer}
            onDeleteOperation={deleteOperation}
            accountNameExists={accountNameExists}
            openAddDialog={addDialogType === 'account'}
            onAddDialogClose={() => setAddDialogType(null)}
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
                accounts={accounts}
                accountOperations={monthData.accountOperations}
                cardMonthlyStatuses={cardMonthlyStatus}
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
                addExpense={handleAddExpense}
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
                canDeleteCard={canDeleteCard}
                cardNameExists={cardNameExists}
                getCardPaidStatus={getCardPaidStatus}
                payCardInvoice={payCardInvoice}
                unpayCardInvoice={unpayCardInvoice}
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
                onRequestAddAccount={() => setAddDialogType('account')}
                expenseDraft={expenseDraft}
                onExpenseDraftConsumed={handleExpenseDraftConsumed}
                wishConquerPlannedValue={wishConquerPlannedValue}
                wishRealizedTotal={wishRealizedMetrics.total}
                wishRealizedCount={wishRealizedMetrics.count}
                allWishes={wishes}
                pendingWishCount={visibleWishes.length}
                wishesLoading={wishesLoading}
                wishesRefetching={wishesRefetching}
                onAddWish={addWish}
                onUpdateWish={updateWish}
                onRemoveWish={removeWish}
                onConquerWish={handleWishConquer}
                onRenewWish={renewWish}
              />
            </div>
        ) : (
            <div className={cn(monthRefetching && 'opacity-60 transition-opacity')}>
              {loadingYearData && yearData.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  }
                >
                  <Statistics
                    yearData={yearData}
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                    creditCards={creditCards}
                    settings={settings}
                    isLoading={loadingYearData && yearData.length > 0}
                  />
                </Suspense>
              )}
            </div>
        )}

        {/* FAB: Adicionar item — visível na visão mensal e anual */}
        {showFab && (
          <div
            className="fixed left-0 right-0 z-40 flex justify-center pointer-events-none px-4"
            style={{ bottom: hasSelections ? '5.5rem' : '1.5rem' }}
          >
            <Popover open={fabPopoverOpen} onOpenChange={handleFabOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  className={`h-12 px-4 gap-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 pointer-events-auto ${
                    isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
                  }`}
                  aria-label={view === 'statistics' ? 'Adicionar item na visão mensal' : 'Adicionar item'}
                >
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline">
                    {view === 'statistics' ? 'Adicionar na visão mensal' : 'Adicionar item'}
                  </span>
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
                    className="justify-start gap-2 rounded-lg text-primary hover:bg-primary/10 hover:text-primary"
                    onClick={() => {
                      setAddDialogType('wish');
                      setFabPopoverOpen(false);
                    }}
                  >
                    <Gift className="h-4 w-4" />
                    Desejo
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start gap-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      setAddDialogType('account');
                      setFabPopoverOpen(false);
                    }}
                  >
                    <Wallet className="h-4 w-4" />
                    Carteira
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
      <footer className="border-t border-border/50 mt-8 py-4 bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Controle Financeiro Pessoal</span>
          <span className="hidden sm:inline text-border">•</span>
          <FinancialGlossaryDialog />
        </div>
      </footer>

      <SelectionBottomBar
        summary={selectionSummary}
        selectedCount={selectedCount}
        effectiveSelectedCount={effectiveSelectedCount}
        plannedTotal={selectionPlannedTotal}
        onClearAll={handleClearAllSelections}
      />
    </div>
  );
};

export default Index;
