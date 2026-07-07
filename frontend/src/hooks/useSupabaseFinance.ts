/**
 * Hook para gerenciar dados financeiros com React Query.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  IncomeEntry,
  Expense,
  CreditCard,
  Investment,
  MonthData,
  FinanceSettings,
  getEmptyMonthData,
  DEFAULT_INCOME_TAGS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INVESTMENT_TAGS,
  DEFAULT_PAYMENT_METHODS,
} from '@/types/finance';
import type { Account, AccountBalance, UpsertAccountBalanceInput } from '@/types/domain';
import { financeKeys } from '@/lib/financeQueryKeys';
import {
  fetchMonthBundle,
  fetchYearData,
  fetchMonthsRange,
  type MonthBundle,
} from '@/services/financeQueries';
import {
  getMonthIndex,
  patchYearDataMonth,
  toMonthSnapshot,
} from '@/utils/business/yearDataSync';
import { getAccountHistoryFetchRange } from '@/utils/business/accounts';
import { calculateRemainingMonths, getYearRefreshMonths } from '@/utils/business/repeatMonths';
import { calculateRemainingInstallments } from '@/utils/business/installments';
import {
  getCreditCardInvoiceSummary,
  getInvoicePaymentOperation,
  isCreditCardExpense,
} from '@/utils/business/creditCards';
import { formatDateToYYYYMMDD } from '@/lib/utils';
import { startSaveTiming } from '@/utils/perf/saveTiming';
import * as accountsService from '@/services/accounts';
import * as accountBalancesService from '@/services/accountBalances';
import * as incomesService from '@/services/incomes';
import * as expensesService from '@/services/expenses';
import * as investmentsService from '@/services/investments';
import * as creditCardsService from '@/services/creditCards';
import * as settingsService from '@/services/settings';
import * as accountOperationsService from '@/services/accountOperations';

type UseSupabaseFinanceOptions = {
  statisticsEnabled?: boolean;
};

export const useSupabaseFinance = (options: UseSupabaseFinanceOptions = {}) => {
  const { statisticsEnabled = false } = options;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [earliestMovementMonth, setEarliestMovementMonth] = useState<string | null>(null);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [settings, setSettings] = useState<FinanceSettings>({
    incomeTags: DEFAULT_INCOME_TAGS,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    investmentTags: DEFAULT_INVESTMENT_TAGS,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
  });

  const currentYear = parseInt(currentMonth.split('-')[0], 10);
  const userId = user?.id ?? '';

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await settingsService.getSettings(user.id);
      setSettings(data);
    } catch {
      toast.error('Erro ao carregar configurações');
    }
  }, [user]);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await accountsService.getAccounts(user.id);
      setAccounts(data);
    } catch {
      toast.error('Erro ao carregar carteiras');
    }
  }, [user]);

  const fetchAccountBalances = useCallback(async () => {
    if (!user) return;
    try {
      const data = await accountBalancesService.getAccountBalances(user.id);
      setAccountBalances(data);
    } catch {
      toast.error('Erro ao carregar saldos de carteiras');
    }
  }, [user]);

  const fetchEarliestMovementMonth = useCallback(async () => {
    if (!user) return;
    try {
      const month = await accountsService.getEarliestAccountMovementMonth(user.id);
      setEarliestMovementMonth(month);
    } catch {
      setEarliestMovementMonth(null);
    }
  }, [user]);

  const refreshEarliestMovementMonthIfAccountLinked = useCallback(
    (accountId?: string | null) => {
      if (accountId) void fetchEarliestMovementMonth();
    },
    [fetchEarliestMovementMonth]
  );

  const refreshEarliestMovementMonthIfAccountChanged = useCallback(
    (updates: { accountId?: string | null }) => {
      if (updates.accountId !== undefined) void fetchEarliestMovementMonth();
    },
    [fetchEarliestMovementMonth]
  );

  const fetchCreditCards = useCallback(async () => {
    if (!user) return;
    try {
      const data = await creditCardsService.getCreditCards(user.id);
      setCreditCards(data);
    } catch {
      toast.error('Erro ao carregar cartões');
    }
  }, [user]);

  useEffect(() => {
    if (!user || initialLoadDone) return;

    const loadInitialData = async () => {
      await Promise.all([
        fetchSettings(),
        fetchCreditCards(),
        fetchAccounts(),
        fetchAccountBalances(),
        fetchEarliestMovementMonth(),
      ]);
      setInitialLoadDone(true);
    };

    loadInitialData();
  }, [user, initialLoadDone, fetchSettings, fetchCreditCards, fetchAccounts, fetchAccountBalances, fetchEarliestMovementMonth]);

  const monthQuery = useQuery({
    queryKey: financeKeys.month(userId, currentMonth),
    queryFn: () => fetchMonthBundle(userId, currentMonth, creditCards),
    enabled: !!user && initialLoadDone,
    staleTime: 30_000,
  });

  const yearQuery = useQuery({
    queryKey: [...financeKeys.year(userId, currentYear), creditCards.length] as const,
    queryFn: () => fetchYearData(userId, currentYear, creditCards),
    enabled: !!user && initialLoadDone && statisticsEnabled,
    staleTime: 5 * 60_000,
  });

  const accountHistoryRange = useMemo(
    () =>
      getAccountHistoryFetchRange(
        accounts.map((a) => a.id),
        accountBalances,
        currentMonth,
        earliestMovementMonth
      ),
    [accounts, accountBalances, currentMonth, earliestMovementMonth]
  );

  const accountHistoryQuery = useQuery({
    queryKey: [
      ...financeKeys.accountHistory(
        userId,
        accountHistoryRange?.from ?? '',
        accountHistoryRange?.to ?? ''
      ),
      creditCards.length,
      currentMonth,
    ] as const,
    queryFn: () =>
      fetchMonthsRange(
        userId,
        accountHistoryRange!.from,
        accountHistoryRange!.to,
        creditCards
      ),
    enabled:
      !!user &&
      initialLoadDone &&
      accounts.length > 0 &&
      accountHistoryRange !== null,
    staleTime: 30_000,
  });

  const incomes = monthQuery.data?.incomes ?? [];
  const expenses = monthQuery.data?.expenses ?? [];
  const investments = monthQuery.data?.investments ?? [];
  const accountOperations = monthQuery.data?.accountOperations ?? [];
  const cardMonthlyStatus = monthQuery.data?.cardMonthlyStatuses ?? {};
  const yearData = yearQuery.data ?? [];

  const monthKey = financeKeys.month(userId, currentMonth);
  const yearKey = financeKeys.year(userId, currentYear);

  const setMonthBundle = useCallback(
    (updater: (prev: MonthBundle) => MonthBundle) => {
      if (!user) return;
      queryClient.setQueryData<MonthBundle>(monthKey, (prev) => {
        const base: MonthBundle = prev ?? {
          incomes: [],
          expenses: [],
          investments: [],
          cardMonthlyStatuses: {},
          accountOperations: [],
        };
        return updater(base);
      });
    },
    [user, queryClient, monthKey]
  );

  const syncInvoicePaymentsForMonth = useCallback(async () => {
    if (!user) return;

    const bundle = queryClient.getQueryData<MonthBundle>(monthKey);
    if (!bundle) return;

    const ops = bundle.accountOperations ?? [];
    const paidCardIds = Object.entries(bundle.cardMonthlyStatuses ?? {})
      .filter(([, paid]) => paid)
      .map(([id]) => id);

    for (const cardId of paidCardIds) {
      const card = creditCards.find((c) => c.id === cardId);
      if (!card) continue;

      const total = getCreditCardInvoiceSummary(card.name, {
        incomes: bundle.incomes,
        expenses: bundle.expenses,
        investments: bundle.investments,
        accountOperations: ops,
      }).total;

      const existing = getInvoicePaymentOperation(ops, cardId);
      if (!existing) continue;

      try {
        if (total <= 0) {
          await accountOperationsService.deleteInvoicePaymentByCard(
            user.id,
            cardId,
            currentMonth
          );
          setMonthBundle((prev) => ({
            ...prev,
            accountOperations: (prev.accountOperations ?? []).filter(
              (op) => op.id !== existing.id
            ),
          }));
        } else if (existing.amount !== total) {
          const updated = await accountOperationsService.updateInvoicePayment(
            existing.id,
            user.id,
            { amount: total }
          );
          setMonthBundle((prev) => ({
            ...prev,
            accountOperations: (prev.accountOperations ?? []).map((op) =>
              op.id === existing.id ? updated : op
            ),
          }));
        }
      } catch {
        // falha silenciosa; próximo refetch corrige
      }
    }
  }, [user, queryClient, monthKey, creditCards, currentMonth, setMonthBundle]);

  const patchYearFromCurrentMonth = useCallback(() => {
    if (!user || !statisticsEnabled) return;
    const existing = queryClient.getQueryData<MonthData[]>(yearKey);
    if (!existing || existing.length !== 12) return;

    const snapshot = toMonthSnapshot(
      { incomes, expenses, investments, accountOperations },
      cardMonthlyStatus
    );
    const monthIndex = getMonthIndex(currentMonth);
    queryClient.setQueryData(
      yearKey,
      patchYearDataMonth(existing, monthIndex, snapshot)
    );
  }, [
    user,
    statisticsEnabled,
    queryClient,
    yearKey,
    incomes,
    expenses,
    investments,
    accountOperations,
    cardMonthlyStatus,
    currentMonth,
  ]);

  useEffect(() => {
    patchYearFromCurrentMonth();
  }, [patchYearFromCurrentMonth]);

  const refreshYearMonths = useCallback(
    async (yearMonths: string[]) => {
      if (!user) return;

      const monthsInYear = yearMonths.filter(
        (yearMonth) => parseInt(yearMonth.split('-')[0], 10) === currentYear
      );
      if (monthsInYear.length === 0) return;

      await Promise.all(
        monthsInYear.map(async (yearMonth) => {
          try {
            const bundle = await fetchMonthBundle(user.id, yearMonth, creditCards);
            const monthIndex = getMonthIndex(yearMonth);
            queryClient.setQueryData<MonthData[]>(yearKey, (old) => {
              if (!old || old.length !== 12) return old;
              return patchYearDataMonth(
                old,
                monthIndex,
                toMonthSnapshot(bundle, bundle.cardMonthlyStatuses)
              );
            });
          } catch {
            // ignora falha pontual
          }
        })
      );
    },
    [user, creditCards, currentYear, queryClient, yearKey]
  );

  const fetchMonthForYear = useCallback(
    async (yearMonth: string): Promise<MonthData> => {
      if (!user) return getEmptyMonthData();

      const bundle = await fetchMonthBundle(user.id, yearMonth, creditCards);
      const snapshot = toMonthSnapshot(bundle, bundle.cardMonthlyStatuses);

      if (
        statisticsEnabled &&
        parseInt(yearMonth.split('-')[0], 10) === currentYear
      ) {
        const monthIndex = getMonthIndex(yearMonth);
        queryClient.setQueryData<MonthData[]>(yearKey, (old) => {
          if (!old || old.length !== 12) return old;
          return patchYearDataMonth(old, monthIndex, snapshot);
        });
      }

      return snapshot;
    },
    [user, creditCards, statisticsEnabled, currentYear, queryClient, yearKey]
  );

  const invalidateCurrentMonth = useCallback(async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ queryKey: monthKey });
  }, [user, queryClient, monthKey]);

  const refreshAffectedYearMonths = useCallback(
    async (applyToAllMonths: boolean, extraMonths: string[] = []) => {
      const months = getYearRefreshMonths(currentMonth, applyToAllMonths, extraMonths);
      const otherMonths = months.filter((month) => month !== currentMonth);
      if (otherMonths.length === 0) return;
      await refreshYearMonths(otherMonths);
    },
    [currentMonth, refreshYearMonths]
  );

  const scheduleSyncInvoicePayments = useCallback(() => {
    void syncInvoicePaymentsForMonth().catch(() => {
      toast.error('Erro ao sincronizar pagamentos de fatura');
    });
  }, [syncInvoicePaymentsForMonth]);

  const scheduleRefreshYearMonths = useCallback(
    (yearMonths: string[]) => {
      const otherMonths = yearMonths.filter((month) => month !== currentMonth);
      if (otherMonths.length === 0) return;
      void refreshYearMonths(otherMonths).catch(() => {
        toast.error('Erro ao atualizar dados do ano');
      });
    },
    [currentMonth, refreshYearMonths]
  );

  const scheduleRefreshAffectedYearMonths = useCallback(
    (applyToAllMonths: boolean, extraMonths: string[] = []) => {
      void refreshAffectedYearMonths(applyToAllMonths, extraMonths).catch(() => {
        toast.error('Erro ao atualizar meses afetados');
      });
    },
    [refreshAffectedYearMonths]
  );

  const getYearData = useCallback(
    async (year: number): Promise<MonthData[]> => {
      if (!user) return Array(12).fill(getEmptyMonthData());

      const data = await fetchYearData(user.id, year, creditCards);
      if (year === currentYear) {
        queryClient.setQueryData(yearKey, data);
      }
      return data;
    },
    [user, creditCards, currentYear, queryClient, yearKey]
  );

  const addIncome = useCallback(
    async (income: Omit<IncomeEntry, 'id'>): Promise<boolean> => {
      if (!user) return false;

      const timing = startSaveTiming('addIncome');
      const tempId = `temp-${Date.now()}`;
      const optimistic: IncomeEntry = { id: tempId, ...income };

      setMonthBundle((prev) => ({
        ...prev,
        incomes: [...prev.incomes, optimistic],
      }));

      try {
        const created = await incomesService.createIncome({
          ...income,
          userId: user.id,
          yearMonth: currentMonth,
          displayOrder: incomes.length,
        });

        setMonthBundle((prev) => ({
          ...prev,
          incomes: prev.incomes
            .filter((i) => i.id !== tempId)
            .concat(created),
        }));

        timing.mark('apiDone');

        if (income.repeatAllMonths) {
          const months = calculateRemainingMonths(currentMonth);
          scheduleRefreshYearMonths([currentMonth, ...months]);
        }

        refreshEarliestMovementMonthIfAccountLinked(income.accountId);
        timing.mark('syncDone');
        timing.end();
        return true;
      } catch {
        toast.error('Erro ao adicionar entrada');
        setMonthBundle((prev) => ({
          ...prev,
          incomes: prev.incomes.filter((i) => i.id !== tempId),
        }));
        timing.end();
        return false;
      }
    },
    [user, currentMonth, incomes.length, setMonthBundle, scheduleRefreshYearMonths, refreshEarliestMovementMonthIfAccountLinked]
  );

  const updateIncome = useCallback(
    async (
      id: string,
      updates: Partial<IncomeEntry>,
      applyToAllMonths = false
    ): Promise<boolean> => {
      if (!user) return false;

      const previous = monthQuery.data?.incomes ?? [];
      setMonthBundle((prev) => ({
        ...prev,
        incomes: prev.incomes.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      }));

      try {
        await incomesService.updateIncome({
          id,
          userId: user.id,
          updates,
          applyToAllMonths,
        });
        if (applyToAllMonths) {
          scheduleRefreshAffectedYearMonths(true);
        }
        refreshEarliestMovementMonthIfAccountChanged(updates);
        return true;
      } catch {
        toast.error('Erro ao atualizar entrada');
        setMonthBundle((prev) => ({ ...prev, incomes: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.incomes, setMonthBundle, scheduleRefreshAffectedYearMonths, refreshEarliestMovementMonthIfAccountChanged]
  );

  const deleteIncome = useCallback(
    async (id: string, applyToAllMonths = false): Promise<boolean> => {
      if (!user) return false;

      const income = monthQuery.data?.incomes.find((i) => i.id === id);
      const sourceOpId = income?.sourceOperationId;

      const previousIncomes = monthQuery.data?.incomes ?? [];
      const previousOps = monthQuery.data?.accountOperations ?? [];

      setMonthBundle((prev) => ({
        ...prev,
        incomes: prev.incomes.filter((i) => i.id !== id),
      }));

      try {
        if (sourceOpId) {
          const target = previousOps.find((op) => op.id === sourceOpId);
          const idsToRemove = target?.transferGroupId
            ? previousOps
                .filter((op) => op.transferGroupId === target.transferGroupId)
                .map((op) => op.id)
            : [sourceOpId];

          setMonthBundle((prev) => ({
            ...prev,
            accountOperations: (prev.accountOperations ?? []).filter(
              (op) => !idsToRemove.includes(op.id)
            ),
          }));

          await accountOperationsService.deleteAccountOperation(sourceOpId, user.id);
          return true;
        }

        await incomesService.deleteIncome(id, user.id, applyToAllMonths);
        if (applyToAllMonths) {
          scheduleRefreshAffectedYearMonths(true);
        }
        return true;
      } catch {
        toast.error('Erro ao excluir entrada');
        setMonthBundle((prev) => ({
          ...prev,
          incomes: previousIncomes,
          accountOperations: previousOps,
        }));
        return false;
      }
    },
    [
      user,
      monthQuery.data?.incomes,
      monthQuery.data?.accountOperations,
      setMonthBundle,
      scheduleRefreshAffectedYearMonths,
    ]
  );

  const reorderIncomes = useCallback(
    async (newIncomes: IncomeEntry[]) => {
      if (!user) return;
      setMonthBundle((prev) => ({ ...prev, incomes: newIncomes }));
      try {
        await incomesService.reorderIncomes(newIncomes, user.id, currentMonth);
      } catch {
        toast.error('Erro ao reordenar entradas');
      }
    },
    [user, currentMonth, setMonthBundle]
  );

  const addExpense = useCallback(
    async (expense: Omit<Expense, 'id'>): Promise<Expense | null> => {
      if (!user) return null;

      const timing = startSaveTiming('addExpense');
      const sanitized: Omit<Expense, 'id'> = isCreditCardExpense(
        { ...expense, id: '' },
        creditCards
      )
        ? { ...expense, accountId: undefined }
        : expense;

      const tempId = `temp-${Date.now()}`;
      const optimistic: Expense = { id: tempId, ...sanitized };

      setMonthBundle((prev) => ({
        ...prev,
        expenses: [...prev.expenses, optimistic],
      }));

      try {
        const created = await expensesService.createExpense({
          ...sanitized,
          userId: user.id,
          yearMonth: currentMonth,
          displayOrder: expenses.length,
        });

        setMonthBundle((prev) => ({
          ...prev,
          expenses: prev.expenses
            .filter((e) => e.id !== tempId)
            .concat(created),
        }));

        timing.mark('apiDone');

        const needsMultiMonthRefresh =
          (sanitized.type === 'fixed' && sanitized.repeatAllMonths) ||
          (sanitized.type === 'installment' &&
            sanitized.currentInstallment != null &&
            sanitized.totalInstallments != null);

        if (needsMultiMonthRefresh) {
          const affectedMonths = [currentMonth];
          if (sanitized.type === 'fixed' && sanitized.repeatAllMonths) {
            affectedMonths.push(...calculateRemainingMonths(currentMonth));
          }
          if (
            sanitized.type === 'installment' &&
            sanitized.currentInstallment != null &&
            sanitized.totalInstallments != null
          ) {
            const installments = calculateRemainingInstallments(
              currentMonth,
              sanitized.currentInstallment,
              sanitized.totalInstallments
            );
            affectedMonths.push(...installments.map((i) => i.yearMonth));
          }
          scheduleRefreshAffectedYearMonths(false, affectedMonths);
        }

        refreshEarliestMovementMonthIfAccountLinked(sanitized.accountId);
        scheduleSyncInvoicePayments();
        timing.mark('syncDone');
        timing.end();
        return created;
      } catch {
        toast.error('Erro ao adicionar gasto');
        setMonthBundle((prev) => ({
          ...prev,
          expenses: prev.expenses.filter((e) => e.id !== tempId),
        }));
        timing.end();
        return null;
      }
    },
    [
      user,
      currentMonth,
      expenses.length,
      creditCards,
      setMonthBundle,
      scheduleRefreshAffectedYearMonths,
      refreshEarliestMovementMonthIfAccountLinked,
      scheduleSyncInvoicePayments,
    ]
  );

  const updateExpense = useCallback(
    async (
      id: string,
      updates: Partial<Expense>,
      applyToAllMonths = false
    ): Promise<boolean> => {
      if (!user) return false;

      const timing = startSaveTiming('updateExpense');
      const previous = monthQuery.data?.expenses ?? [];
      const current = previous.find((e) => e.id === id);
      const sanitized: Partial<Expense> = isCreditCardExpense(
        {
          ...(current ?? {
            id,
            type: 'variable',
            category: '',
            description: '',
            paymentMethod: '',
            value: 0,
            paid: false,
          }),
          ...updates,
        },
        creditCards
      )
        ? { ...updates, accountId: undefined }
        : updates;

      setMonthBundle((prev) => ({
        ...prev,
        expenses: prev.expenses.map((e) =>
          e.id === id ? { ...e, ...sanitized } : e
        ),
      }));

      try {
        await expensesService.updateExpense({
          id,
          userId: user.id,
          updates: sanitized,
          applyToAllMonths,
        });
        timing.mark('apiDone');
        if (applyToAllMonths) {
          scheduleRefreshAffectedYearMonths(true);
        }
        refreshEarliestMovementMonthIfAccountChanged(sanitized);
        scheduleSyncInvoicePayments();
        timing.mark('syncDone');
        timing.end();
        return true;
      } catch {
        toast.error('Erro ao atualizar gasto');
        setMonthBundle((prev) => ({ ...prev, expenses: previous }));
        timing.end();
        return false;
      }
    },
    [user, monthQuery.data?.expenses, creditCards, setMonthBundle, scheduleRefreshAffectedYearMonths, refreshEarliestMovementMonthIfAccountChanged, scheduleSyncInvoicePayments]
  );

  const deleteExpense = useCallback(
    async (id: string, applyToAllMonths = false): Promise<boolean> => {
      if (!user) return false;

      const previous = monthQuery.data?.expenses ?? [];
      setMonthBundle((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== id),
      }));

      try {
        await expensesService.deleteExpense(id, user.id, applyToAllMonths);
        if (applyToAllMonths) {
          scheduleRefreshAffectedYearMonths(true);
        }
        scheduleSyncInvoicePayments();
        return true;
      } catch {
        toast.error('Erro ao excluir gasto');
        setMonthBundle((prev) => ({ ...prev, expenses: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.expenses, setMonthBundle, scheduleRefreshAffectedYearMonths, scheduleSyncInvoicePayments]
  );

  const deleteInstallmentExpense = useCallback(
    async (expense: Expense): Promise<boolean> => {
      if (!user) return false;

      const previous = monthQuery.data?.expenses ?? [];
      setMonthBundle((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== expense.id),
      }));

      try {
        await expensesService.deleteInstallmentExpense(expense, user.id);
        void invalidateCurrentMonth().catch(() => {
          toast.error('Erro ao atualizar dados do mês');
        });
        scheduleSyncInvoicePayments();
        return true;
      } catch {
        toast.error('Erro ao excluir parcelas');
        setMonthBundle((prev) => ({ ...prev, expenses: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.expenses, setMonthBundle, invalidateCurrentMonth, scheduleSyncInvoicePayments]
  );

  const reorderExpenses = useCallback(
    async (newExpenses: Expense[]) => {
      if (!user) return;
      setMonthBundle((prev) => ({ ...prev, expenses: newExpenses }));
      try {
        await expensesService.reorderExpenses(newExpenses, user.id);
      } catch {
        toast.error('Erro ao reordenar gastos');
      }
    },
    [user, setMonthBundle]
  );

  const addCreditCard = useCallback(
    async (card: Omit<CreditCard, 'id'>): Promise<boolean> => {
      if (!user) return false;

      const tempId = `temp-${Date.now()}`;
      const optimistic: CreditCard = { id: tempId, ...card };
      setCreditCards((prev) => [...prev, optimistic]);

      try {
        const created = await creditCardsService.createCreditCard({
          ...card,
          userId: user.id,
          displayOrder: creditCards.length,
        });
        setCreditCards((prev) =>
          prev.filter((c) => c.id !== tempId).concat(created)
        );
        return true;
      } catch {
        toast.error('Erro ao adicionar cartão');
        setCreditCards((prev) => prev.filter((c) => c.id !== tempId));
        return false;
      }
    },
    [user, creditCards.length]
  );

  const updateCreditCard = useCallback(
    async (id: string, updates: Partial<CreditCard>): Promise<boolean> => {
      if (!user) return false;

      const previousCards = [...creditCards];
      setCreditCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );

      try {
        await creditCardsService.updateCreditCard({
          id,
          userId: user.id,
          updates,
        });
        if (updates.name !== undefined) {
          void invalidateCurrentMonth().catch(() => {
            toast.error('Erro ao atualizar dados do mês');
          });
        }
        return true;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro ao atualizar cartão';
        toast.error(errorMessage);
        setCreditCards(previousCards);
        return false;
      }
    },
    [user, creditCards, invalidateCurrentMonth]
  );

  const deleteCreditCard = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const previousCards = [...creditCards];
      setCreditCards((prev) => prev.filter((c) => c.id !== id));

      try {
        await creditCardsService.deleteCreditCard(id, user.id);
        return true;
      } catch {
        toast.error('Erro ao excluir cartão');
        setCreditCards(previousCards);
        return false;
      }
    },
    [user, creditCards]
  );

  const getCreditCardTotal = useCallback(
    (cardName: string): number => {
      return expenses
        .filter((e) => e.paymentMethod === cardName)
        .reduce((sum, e) => sum + e.value, 0);
    },
    [expenses]
  );

  const canDeleteCard = useCallback(
    async (cardName: string): Promise<boolean> => {
      if (!user) return true;
      try {
        return await creditCardsService.canDeleteCreditCard(cardName, user.id);
      } catch {
        return false;
      }
    },
    [user]
  );

  const cardNameExists = useCallback(
    (name: string, excludeId?: string): boolean => {
      return creditCards.some(
        (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== excludeId
      );
    },
    [creditCards]
  );

  const getCardPaidStatus = useCallback(
    (cardId: string): boolean => cardMonthlyStatus[cardId] || false,
    [cardMonthlyStatus]
  );

  const addAccount = useCallback(
    async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account | null> => {
      if (!user) return null;

      const tempId = `temp-${Date.now()}`;
      const optimistic: Account = { id: tempId, ...account };
      setAccounts((prev) => [...prev, optimistic]);

      try {
        const created = await accountsService.createAccount({
          ...account,
          userId: user.id,
          displayOrder: accounts.length,
        });
        setAccounts((prev) => [...prev.filter((a) => a.id !== tempId), created]);
        void fetchEarliestMovementMonth();
        return created;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao adicionar carteira';
        toast.error(message);
        setAccounts((prev) => prev.filter((a) => a.id !== tempId));
        return null;
      }
    },
    [user, accounts.length, fetchEarliestMovementMonth]
  );

  const updateAccount = useCallback(
    async (id: string, updates: Partial<Omit<Account, 'id'>>): Promise<boolean> => {
      if (!user) return false;

      const previousAccounts = [...accounts];
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
      );

      try {
        await accountsService.updateAccount(id, user.id, updates);
        return true;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao atualizar carteira';
        toast.error(message);
        setAccounts(previousAccounts);
        return false;
      }
    },
    [user, accounts]
  );

  const deleteAccount = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const previousAccounts = [...accounts];
      const previousBalances = [...accountBalances];
      setAccounts((prev) => prev.filter((a) => a.id !== id));

      try {
        await accountsService.deleteAccount(id, user.id);
        setAccountBalances((prev) => prev.filter((b) => b.accountId !== id));
        setMonthBundle((prev) => ({
          ...prev,
          incomes: prev.incomes.map((income) =>
            income.accountId === id ? { ...income, accountId: undefined } : income
          ),
          expenses: prev.expenses.map((expense) =>
            expense.accountId === id ? { ...expense, accountId: undefined } : expense
          ),
          investments: prev.investments.map((investment) =>
            investment.accountId === id ? { ...investment, accountId: undefined } : investment
          ),
        }));
        await invalidateCurrentMonth();
        await queryClient.invalidateQueries({
          queryKey: ['finance', 'accountHistory', user.id],
        });
        return true;
      } catch {
        toast.error('Erro ao excluir carteira');
        setAccounts(previousAccounts);
        setAccountBalances(previousBalances);
        return false;
      }
    },
    [user, accounts, accountBalances, setMonthBundle, invalidateCurrentMonth, queryClient]
  );

  const accountNameExists = useCallback(
    (name: string, excludeId?: string): boolean => {
      return accounts.some(
        (a) => a.name.toLowerCase() === name.toLowerCase() && a.id !== excludeId
      );
    },
    [accounts]
  );

  const upsertAccountBalance = useCallback(
    async (accountId: string, yearMonth: string, balance: number): Promise<boolean> => {
      if (!user) return false;

      const existing = accountBalances.find(
        (b) => b.accountId === accountId && b.yearMonth === yearMonth
      );
      const tempBalance: AccountBalance = existing
        ? { ...existing, balance }
        : {
            id: `temp-${Date.now()}`,
            accountId,
            userId: user.id,
            yearMonth,
            balance,
          };

      setAccountBalances((prev) => {
        const filtered = prev.filter(
          (b) => !(b.accountId === accountId && b.yearMonth === yearMonth)
        );
        return [...filtered, tempBalance];
      });

      try {
        const saved = await accountBalancesService.upsertAccountBalance({
          accountId,
          userId: user.id,
          yearMonth,
          balance,
        } as UpsertAccountBalanceInput);

        setAccountBalances((prev) => {
          const filtered = prev.filter(
            (b) => !(b.accountId === accountId && b.yearMonth === yearMonth)
          );
          return [...filtered, saved];
        });
        return true;
      } catch {
        setAccountBalances((prev) => {
          const filtered = prev.filter(
            (b) => !(b.accountId === accountId && b.yearMonth === yearMonth)
          );
          if (existing) return [...filtered, existing];
          return filtered;
        });
        toast.error('Erro ao salvar saldo da carteira');
        return false;
      }
    },
    [user, accountBalances]
  );

  const addInvestment = useCallback(
    async (investment: Omit<Investment, 'id'>): Promise<boolean> => {
      if (!user) return false;

      const timing = startSaveTiming('addInvestment');
      const tempId = `temp-${Date.now()}`;
      const optimistic: Investment = { id: tempId, ...investment };

      setMonthBundle((prev) => ({
        ...prev,
        investments: [...prev.investments, optimistic],
      }));

      try {
        const created = await investmentsService.createInvestment({
          ...investment,
          userId: user.id,
          yearMonth: currentMonth,
          displayOrder: investments.length,
        });

        setMonthBundle((prev) => ({
          ...prev,
          investments: prev.investments
            .filter((i) => i.id !== tempId)
            .concat(created),
        }));

        timing.mark('apiDone');

        if (investment.repeatAllMonths) {
          const months = calculateRemainingMonths(currentMonth);
          scheduleRefreshYearMonths([currentMonth, ...months]);
        }

        refreshEarliestMovementMonthIfAccountLinked(investment.accountId);
        timing.mark('syncDone');
        timing.end();
        return true;
      } catch {
        toast.error('Erro ao adicionar investimento');
        setMonthBundle((prev) => ({
          ...prev,
          investments: prev.investments.filter((i) => i.id !== tempId),
        }));
        timing.end();
        return false;
      }
    },
    [user, currentMonth, investments.length, setMonthBundle, scheduleRefreshYearMonths, refreshEarliestMovementMonthIfAccountLinked]
  );

  const updateInvestment = useCallback(
    async (
      id: string,
      updates: Partial<Investment>,
      applyToAllMonths = false
    ): Promise<boolean> => {
      if (!user) return false;

      const previous = monthQuery.data?.investments ?? [];
      setMonthBundle((prev) => ({
        ...prev,
        investments: prev.investments.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      }));

      try {
        await investmentsService.updateInvestment({
          id,
          userId: user.id,
          updates,
          applyToAllMonths,
        });
        if (applyToAllMonths) {
          scheduleRefreshAffectedYearMonths(true);
        }
        refreshEarliestMovementMonthIfAccountChanged(updates);
        return true;
      } catch {
        toast.error('Erro ao atualizar investimento');
        setMonthBundle((prev) => ({ ...prev, investments: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.investments, setMonthBundle, scheduleRefreshAffectedYearMonths, refreshEarliestMovementMonthIfAccountChanged]
  );

  const deleteInvestment = useCallback(
    async (id: string, applyToAllMonths = false): Promise<boolean> => {
      if (!user) return false;

      const previous = monthQuery.data?.investments ?? [];
      setMonthBundle((prev) => ({
        ...prev,
        investments: prev.investments.filter((i) => i.id !== id),
      }));

      try {
        await investmentsService.deleteInvestment(id, user.id, applyToAllMonths);
        if (applyToAllMonths) {
          scheduleRefreshAffectedYearMonths(true);
        }
        return true;
      } catch {
        toast.error('Erro ao excluir investimento');
        setMonthBundle((prev) => ({ ...prev, investments: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.investments, setMonthBundle, scheduleRefreshAffectedYearMonths]
  );

  const reorderInvestments = useCallback(
    async (newInvestments: Investment[]) => {
      if (!user) return;
      setMonthBundle((prev) => ({ ...prev, investments: newInvestments }));
      try {
        await investmentsService.reorderInvestments(newInvestments, user.id);
      } catch {
        toast.error('Erro ao reordenar investimentos');
      }
    },
    [user, setMonthBundle]
  );

  const addInvestmentTag = useCallback(
    async (tag: string) => {
      if (!user) return;
      const newTags = [...settings.investmentTags, tag];
      try {
        await settingsService.updateInvestmentTags(user.id, newTags);
        setSettings((prev) => ({ ...prev, investmentTags: newTags }));
      } catch {
        toast.error('Erro ao adicionar tag');
      }
    },
    [user, settings.investmentTags]
  );

  const updateInvestmentTag = useCallback(
    async (oldTag: string, newTag: string) => {
      if (!user) return;
      const newTags = settings.investmentTags.map((t) =>
        t === oldTag ? newTag : t
      );
      try {
        await settingsService.updateInvestmentTags(user.id, newTags);
        await settingsService.updateInvestmentTagInInvestments(
          user.id,
          oldTag,
          newTag
        );
        setSettings((prev) => ({ ...prev, investmentTags: newTags }));
        setMonthBundle((prev) => ({
          ...prev,
          investments: prev.investments.map((inv) =>
            inv.tag === oldTag ? { ...inv, tag: newTag } : inv
          ),
        }));
      } catch {
        toast.error('Erro ao atualizar tag');
      }
    },
    [user, settings.investmentTags, setMonthBundle]
  );

  const deleteInvestmentTag = useCallback(
    async (tag: string) => {
      if (!user) return;
      const newTags = settings.investmentTags.filter((t) => t !== tag);
      try {
        await settingsService.updateInvestmentTags(user.id, newTags);
        setSettings((prev) => ({ ...prev, investmentTags: newTags }));
      } catch {
        toast.error('Erro ao excluir tag');
      }
    },
    [user, settings.investmentTags]
  );

  const addIncomeTag = useCallback(
    async (tag: string) => {
      if (!user) return;
      const newTags = [...settings.incomeTags, tag];
      try {
        await settingsService.updateIncomeTags(user.id, newTags);
        setSettings((prev) => ({ ...prev, incomeTags: newTags }));
      } catch {
        toast.error('Erro ao adicionar categoria');
      }
    },
    [user, settings.incomeTags]
  );

  const updateIncomeTag = useCallback(
    async (oldTag: string, newTag: string) => {
      if (!user) return;
      const newTags = settings.incomeTags.map((t) =>
        t === oldTag ? newTag : t
      );
      try {
        await settingsService.updateIncomeTags(user.id, newTags);
        await settingsService.updateIncomeTagInIncomes(user.id, oldTag, newTag);
        setSettings((prev) => ({ ...prev, incomeTags: newTags }));
        setMonthBundle((prev) => ({
          ...prev,
          incomes: prev.incomes.map((income) =>
            income.tag === oldTag ? { ...income, tag: newTag } : income
          ),
        }));
      } catch {
        toast.error('Erro ao atualizar categoria');
      }
    },
    [user, settings.incomeTags, setMonthBundle]
  );

  const deleteIncomeTag = useCallback(
    async (tag: string) => {
      if (!user) return;
      const newTags = settings.incomeTags.filter((t) => t !== tag);
      try {
        await settingsService.updateIncomeTags(user.id, newTags);
        setSettings((prev) => ({ ...prev, incomeTags: newTags }));
      } catch {
        toast.error('Erro ao excluir categoria');
      }
    },
    [user, settings.incomeTags]
  );

  const addExpenseCategory = useCallback(
    async (category: string) => {
      if (!user) return;
      const newCategories = [...settings.expenseCategories, category];
      try {
        await settingsService.updateExpenseCategories(user.id, newCategories);
        setSettings((prev) => ({ ...prev, expenseCategories: newCategories }));
      } catch {
        toast.error('Erro ao adicionar categoria de gasto');
      }
    },
    [user, settings.expenseCategories]
  );

  const updateExpenseCategory = useCallback(
    async (oldCategory: string, newCategory: string) => {
      if (!user) return;
      const newCategories = settings.expenseCategories.map((c) =>
        c === oldCategory ? newCategory : c
      );
      try {
        await settingsService.updateExpenseCategories(user.id, newCategories);
        await settingsService.updateExpenseCategoryInExpenses(
          user.id,
          oldCategory,
          newCategory
        );
        setSettings((prev) => ({ ...prev, expenseCategories: newCategories }));
        setMonthBundle((prev) => ({
          ...prev,
          expenses: prev.expenses.map((expense) =>
            expense.category === oldCategory
              ? { ...expense, category: newCategory }
              : expense
          ),
        }));
      } catch {
        toast.error('Erro ao atualizar categoria de gasto');
      }
    },
    [user, settings.expenseCategories, setMonthBundle]
  );

  const deleteExpenseCategory = useCallback(
    async (category: string) => {
      if (!user) return;
      const newCategories = settings.expenseCategories.filter(
        (c) => c !== category
      );
      try {
        await settingsService.updateExpenseCategories(user.id, newCategories);
        setSettings((prev) => ({ ...prev, expenseCategories: newCategories }));
      } catch {
        toast.error('Erro ao excluir categoria de gasto');
      }
    },
    [user, settings.expenseCategories]
  );

  const invalidateAccountHistory = useCallback(async () => {
    if (!user || !accountHistoryRange) return;
    await queryClient.invalidateQueries({
      queryKey: financeKeys.accountHistory(
        userId,
        accountHistoryRange.from,
        accountHistoryRange.to
      ),
    });
  }, [user, accountHistoryRange, queryClient, userId]);

  const scheduleInvalidateAccountHistory = useCallback(() => {
    void invalidateAccountHistory().catch(() => {
      toast.error('Erro ao atualizar histórico de carteiras');
    });
  }, [invalidateAccountHistory]);

  const payCardInvoice = useCallback(
    async (
      cardId: string,
      paymentAccountId: string | null,
      operationDate?: string
    ): Promise<boolean> => {
      if (!user) return false;

      const timing = startSaveTiming('payCardInvoice');
      const card = creditCards.find((c) => c.id === cardId);
      if (!card) return false;

      const opDate = operationDate ?? formatDateToYYYYMMDD(new Date());
      const bundle = queryClient.getQueryData<MonthBundle>(monthKey);
      const summary = getCreditCardInvoiceSummary(card.name, {
        incomes: bundle?.incomes ?? incomes,
        expenses: bundle?.expenses ?? expenses,
        investments: bundle?.investments ?? investments,
        accountOperations: bundle?.accountOperations ?? accountOperations,
      });
      const existing = getInvoicePaymentOperation(
        bundle?.accountOperations ?? accountOperations,
        cardId
      );
      const previousStatuses = { ...cardMonthlyStatus };
      const previousOps = [...(bundle?.accountOperations ?? accountOperations)];

      setMonthBundle((prev) => {
        let nextOps = prev.accountOperations ?? [];
        if (summary.total > 0) {
          const optimisticOp = existing
            ? {
                ...existing,
                sourceAccountId: paymentAccountId,
                amount: summary.total,
                operationDate: opDate,
              }
            : {
                id: `temp-invoice-${cardId}`,
                type: 'invoice_payment' as const,
                sourceAccountId: paymentAccountId,
                destinationAccountId: null,
                transferGroupId: null,
                creditCardId: cardId,
                amount: summary.total,
                yearMonth: currentMonth,
                operationDate: opDate,
                description: `Fatura ${card.name}`,
              };
          nextOps = existing
            ? nextOps.map((op) => (op.id === existing.id ? optimisticOp : op))
            : [...nextOps, optimisticOp];
        }
        return {
          ...prev,
          cardMonthlyStatuses: { ...prev.cardMonthlyStatuses, [cardId]: true },
          accountOperations: nextOps,
        };
      });

      try {
        await creditCardsService.setCardMonthlyStatus(
          user.id,
          cardId,
          currentMonth,
          true
        );

        if (summary.total > 0) {
          if (existing && !existing.id.startsWith('temp-')) {
            const updated = await accountOperationsService.updateInvoicePayment(
              existing.id,
              user.id,
              {
                sourceAccountId: paymentAccountId,
                amount: summary.total,
                description: `Fatura ${card.name}`,
              }
            );
            setMonthBundle((prev) => ({
              ...prev,
              accountOperations: (prev.accountOperations ?? []).map((op) =>
                op.id === existing.id ? updated : op
              ),
            }));
          } else {
            const created = await accountOperationsService.createInvoicePayment({
              userId: user.id,
              sourceAccountId: paymentAccountId,
              creditCardId: cardId,
              amount: summary.total,
              yearMonth: currentMonth,
              operationDate: opDate,
              description: `Fatura ${card.name}`,
            });
            setMonthBundle((prev) => ({
              ...prev,
              accountOperations: (prev.accountOperations ?? [])
                .filter((op) => op.id !== `temp-invoice-${cardId}`)
                .concat(created),
            }));
          }
          scheduleInvalidateAccountHistory();
        }

        timing.mark('apiDone');
        timing.mark('syncDone');
        timing.end();
        return true;
      } catch {
        setMonthBundle((prev) => ({
          ...prev,
          cardMonthlyStatuses: previousStatuses,
          accountOperations: previousOps,
        }));
        toast.error('Erro ao registrar pagamento da fatura');
        timing.end();
        return false;
      }
    },
    [
      user,
      creditCards,
      queryClient,
      monthKey,
      incomes,
      expenses,
      investments,
      accountOperations,
      cardMonthlyStatus,
      currentMonth,
      setMonthBundle,
      scheduleInvalidateAccountHistory,
    ]
  );

  const unpayCardInvoice = useCallback(
    async (cardId: string): Promise<boolean> => {
      if (!user) return false;

      const existing = getInvoicePaymentOperation(accountOperations, cardId);
      const previousStatuses = { ...cardMonthlyStatus };
      const previousOps = [...accountOperations];

      setMonthBundle((prev) => ({
        ...prev,
        cardMonthlyStatuses: { ...prev.cardMonthlyStatuses, [cardId]: false },
        accountOperations: (prev.accountOperations ?? []).filter(
          (op) => !(op.type === 'invoice_payment' && op.creditCardId === cardId)
        ),
      }));

      try {
        if (existing) {
          await accountOperationsService.deleteInvoicePaymentByCard(
            user.id,
            cardId,
            currentMonth
          );
          scheduleInvalidateAccountHistory();
        }
        await creditCardsService.setCardMonthlyStatus(
          user.id,
          cardId,
          currentMonth,
          false
        );
        return true;
      } catch {
        setMonthBundle((prev) => ({
          ...prev,
          cardMonthlyStatuses: previousStatuses,
          accountOperations: previousOps,
        }));
        toast.error('Erro ao desmarcar fatura');
        return false;
      }
    },
    [
      user,
      accountOperations,
      cardMonthlyStatus,
      currentMonth,
      setMonthBundle,
      scheduleInvalidateAccountHistory,
    ]
  );

  const setCardPaidStatus = useCallback(
    async (cardId: string, paid: boolean): Promise<boolean> => {
      if (paid) {
        return payCardInvoice(cardId, null);
      }
      return unpayCardInvoice(cardId);
    },
    [payCardInvoice, unpayCardInvoice]
  );

  const createWithdrawal = useCallback(
    async (
      sourceAccountId: string,
      amount: number,
      operationDate: string,
      description?: string,
      destinationAccountId?: string | null
    ): Promise<boolean> => {
      if (!user) return false;

      const timing = startSaveTiming('createWithdrawal');
      let createdOps: import('@/types/domain').AccountOperation[] = [];

      try {
        let linkedOperationId: string;

        if (destinationAccountId) {
          const created = await accountOperationsService.createTransfer({
            userId: user.id,
            sourceAccountId,
            destinationAccountId,
            amount,
            yearMonth: currentMonth,
            operationDate,
            description: description ?? 'Resgate',
          });
          const transferIn = created.find((op) => op.type === 'transfer_in');
          if (!transferIn) {
            throw new Error('Operação de resgate incompleta');
          }
          linkedOperationId = transferIn.id;
          createdOps = created;
        } else {
          const created = await accountOperationsService.createWithdrawal({
            userId: user.id,
            sourceAccountId,
            amount,
            yearMonth: currentMonth,
            operationDate,
            description,
          });
          linkedOperationId = created.id;
          createdOps = [created];
        }

        const incomeDescription = description?.trim() || 'Resgate de investimentos';
        const createdIncome = await incomesService.createResgateIncome({
          userId: user.id,
          yearMonth: currentMonth,
          description: incomeDescription,
          value: amount,
          date: operationDate,
          accountId: destinationAccountId ?? null,
          sourceOperationId: linkedOperationId,
          displayOrder: incomes.length,
        });

        setMonthBundle((prev) => ({
          ...prev,
          accountOperations: [...(prev.accountOperations ?? []), ...createdOps],
          incomes: [...prev.incomes, createdIncome],
        }));

        timing.mark('apiDone');
        scheduleInvalidateAccountHistory();
        timing.mark('syncDone');
        timing.end();
        toast.success(
          'Resgate registrado. Entrada criada em Entradas; resumo e regra 50/30/20 atualizados.'
        );
        return true;
      } catch {
        for (const op of createdOps) {
          try {
            await accountOperationsService.deleteAccountOperation(op.id, user.id);
          } catch {
            // best-effort rollback
          }
        }
        toast.error('Erro ao registrar resgate');
        timing.end();
        return false;
      }
    },
    [user, currentMonth, incomes.length, setMonthBundle, scheduleInvalidateAccountHistory]
  );

  const createTransfer = useCallback(
    async (
      sourceAccountId: string | null,
      destinationAccountId: string | null,
      amount: number,
      operationDate: string,
      description?: string
    ): Promise<boolean> => {
      if (!user) return false;
      if (!sourceAccountId && !destinationAccountId) return false;
      if (sourceAccountId && destinationAccountId && sourceAccountId === destinationAccountId) {
        return false;
      }

      const timing = startSaveTiming('createTransfer');

      try {
        const created = await accountOperationsService.createTransfer({
          userId: user.id,
          sourceAccountId,
          destinationAccountId,
          amount,
          yearMonth: currentMonth,
          operationDate,
          description,
        });

        setMonthBundle((prev) => ({
          ...prev,
          accountOperations: [...(prev.accountOperations ?? []), ...created],
        }));
        timing.mark('apiDone');
        scheduleInvalidateAccountHistory();
        timing.mark('syncDone');
        timing.end();
        return true;
      } catch {
        toast.error('Erro ao registrar transferência');
        timing.end();
        return false;
      }
    },
    [user, currentMonth, setMonthBundle, scheduleInvalidateAccountHistory]
  );

  const deleteOperation = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const currentOps = monthQuery.data?.accountOperations ?? [];
      const currentIncomes = monthQuery.data?.incomes ?? [];
      const target = currentOps.find((op) => op.id === id);
      const idsToRemove = target?.transferGroupId
        ? currentOps
            .filter((op) => op.transferGroupId === target.transferGroupId)
            .map((op) => op.id)
        : [id];

      const previousOps = currentOps;
      const previousIncomes = currentIncomes;

      setMonthBundle((prev) => ({
        ...prev,
        accountOperations: (prev.accountOperations ?? []).filter(
          (op) => !idsToRemove.includes(op.id)
        ),
        incomes: prev.incomes.filter(
          (income) =>
            !income.sourceOperationId || !idsToRemove.includes(income.sourceOperationId)
        ),
      }));

      try {
        await accountOperationsService.deleteAccountOperation(id, user.id);
        scheduleInvalidateAccountHistory();
        return true;
      } catch {
        toast.error('Erro ao excluir operação');
        setMonthBundle((prev) => ({
          ...prev,
          accountOperations: previousOps,
          incomes: previousIncomes,
        }));
        return false;
      }
    },
    [
      user,
      monthQuery.data?.accountOperations,
      monthQuery.data?.incomes,
      setMonthBundle,
      scheduleInvalidateAccountHistory,
    ]
  );

  const monthData: MonthData = useMemo(
    () => ({ incomes, expenses, investments, accountOperations }),
    [incomes, expenses, investments, accountOperations]
  );

  const accountHistoryMonths = useMemo(() => {
    const merged: Record<string, MonthData> = {
      ...(accountHistoryQuery.data ?? {}),
    };
    merged[currentMonth] = {
      ...monthData,
      cardMonthlyStatuses: cardMonthlyStatus,
    };
    return merged;
  }, [accountHistoryQuery.data, currentMonth, monthData, cardMonthlyStatus]);

  const loading = !initialLoadDone || (monthQuery.isLoading && !monthQuery.data);
  const monthRefetching = monthQuery.isFetching && !!monthQuery.data;
  const loadingYearData =
    yearQuery.isLoading || (yearQuery.isFetching && yearData.length > 0);

  return {
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
    yearData,
    loadingYearData,
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
    getCardPaidStatus,
    setCardPaidStatus,
    payCardInvoice,
    unpayCardInvoice,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    reorderInvestments,
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
    fetchMonthForYear,
    refreshData: invalidateCurrentMonth,
  };
};
