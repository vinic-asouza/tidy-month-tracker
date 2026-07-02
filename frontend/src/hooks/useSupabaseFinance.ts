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
import { calculateRemainingMonths } from '@/utils/business/repeatMonths';
import { calculateRemainingInstallments } from '@/utils/business/installments';
import * as accountsService from '@/services/accounts';
import * as accountBalancesService from '@/services/accountBalances';
import * as incomesService from '@/services/incomes';
import * as expensesService from '@/services/expenses';
import * as investmentsService from '@/services/investments';
import * as creditCardsService from '@/services/creditCards';
import * as settingsService from '@/services/settings';

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
        };
        return updater(base);
      });
    },
    [user, queryClient, monthKey]
  );

  const patchYearFromCurrentMonth = useCallback(() => {
    if (!user || !statisticsEnabled) return;
    const existing = queryClient.getQueryData<MonthData[]>(yearKey);
    if (!existing || existing.length !== 12) return;

    const snapshot = toMonthSnapshot(
      { incomes, expenses, investments },
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
    cardMonthlyStatus,
    currentMonth,
  ]);

  useEffect(() => {
    patchYearFromCurrentMonth();
  }, [patchYearFromCurrentMonth]);

  const refreshYearMonths = useCallback(
    async (yearMonths: string[]) => {
      if (!user) return;

      for (const yearMonth of yearMonths) {
        if (parseInt(yearMonth.split('-')[0], 10) !== currentYear) continue;

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
      }
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

        if (income.repeatAllMonths) {
          const months = calculateRemainingMonths(currentMonth);
          await refreshYearMonths([currentMonth, ...months]);
        }

        refreshEarliestMovementMonthIfAccountLinked(income.accountId);
        return true;
      } catch {
        toast.error('Erro ao adicionar entrada');
        setMonthBundle((prev) => ({
          ...prev,
          incomes: prev.incomes.filter((i) => i.id !== tempId),
        }));
        return false;
      }
    },
    [user, currentMonth, incomes.length, setMonthBundle, refreshYearMonths, refreshEarliestMovementMonthIfAccountLinked]
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
          await invalidateCurrentMonth();
          await refreshYearMonths([
            currentMonth,
            ...calculateRemainingMonths(currentMonth),
          ]);
        }
        refreshEarliestMovementMonthIfAccountChanged(updates);
        return true;
      } catch {
        toast.error('Erro ao atualizar entrada');
        setMonthBundle((prev) => ({ ...prev, incomes: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.incomes, setMonthBundle, invalidateCurrentMonth, refreshYearMonths, currentMonth, refreshEarliestMovementMonthIfAccountChanged]
  );

  const deleteIncome = useCallback(
    async (id: string, applyToAllMonths = false): Promise<boolean> => {
      if (!user) return false;

      const previous = monthQuery.data?.incomes ?? [];
      setMonthBundle((prev) => ({
        ...prev,
        incomes: prev.incomes.filter((i) => i.id !== id),
      }));

      try {
        await incomesService.deleteIncome(id, user.id, applyToAllMonths);
        if (applyToAllMonths) {
          await invalidateCurrentMonth();
        }
        return true;
      } catch {
        toast.error('Erro ao excluir entrada');
        setMonthBundle((prev) => ({ ...prev, incomes: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.incomes, setMonthBundle, invalidateCurrentMonth]
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

      const tempId = `temp-${Date.now()}`;
      const optimistic: Expense = { id: tempId, ...expense };

      setMonthBundle((prev) => ({
        ...prev,
        expenses: [...prev.expenses, optimistic],
      }));

      try {
        const created = await expensesService.createExpense({
          ...expense,
          userId: user.id,
          yearMonth: currentMonth,
          displayOrder: expenses.length,
        });

        const needsMultiMonthRefresh =
          (expense.type === 'fixed' && expense.repeatAllMonths) ||
          (expense.type === 'installment' &&
            expense.currentInstallment != null &&
            expense.totalInstallments != null);

        if (needsMultiMonthRefresh) {
          await invalidateCurrentMonth();
          const affectedMonths = [currentMonth];
          if (expense.type === 'fixed' && expense.repeatAllMonths) {
            affectedMonths.push(...calculateRemainingMonths(currentMonth));
          }
          if (
            expense.type === 'installment' &&
            expense.currentInstallment != null &&
            expense.totalInstallments != null
          ) {
            const installments = calculateRemainingInstallments(
              currentMonth,
              expense.currentInstallment,
              expense.totalInstallments
            );
            affectedMonths.push(...installments.map((i) => i.yearMonth));
          }
          await refreshYearMonths([...new Set(affectedMonths)]);
        } else {
          setMonthBundle((prev) => ({
            ...prev,
            expenses: prev.expenses
              .filter((e) => e.id !== tempId)
              .concat(created),
          }));
        }

        refreshEarliestMovementMonthIfAccountLinked(expense.accountId);
        return created;
      } catch {
        toast.error('Erro ao adicionar gasto');
        setMonthBundle((prev) => ({
          ...prev,
          expenses: prev.expenses.filter((e) => e.id !== tempId),
        }));
        return null;
      }
    },
    [
      user,
      currentMonth,
      expenses.length,
      setMonthBundle,
      invalidateCurrentMonth,
      refreshYearMonths,
      refreshEarliestMovementMonthIfAccountLinked,
    ]
  );

  const updateExpense = useCallback(
    async (
      id: string,
      updates: Partial<Expense>,
      applyToAllMonths = false
    ): Promise<boolean> => {
      if (!user) return false;

      const previous = monthQuery.data?.expenses ?? [];
      setMonthBundle((prev) => ({
        ...prev,
        expenses: prev.expenses.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      }));

      try {
        await expensesService.updateExpense({
          id,
          userId: user.id,
          updates,
          applyToAllMonths,
        });
        if (applyToAllMonths) {
          await invalidateCurrentMonth();
          await refreshYearMonths([
            currentMonth,
            ...calculateRemainingMonths(currentMonth),
          ]);
        }
        refreshEarliestMovementMonthIfAccountChanged(updates);
        return true;
      } catch {
        toast.error('Erro ao atualizar gasto');
        setMonthBundle((prev) => ({ ...prev, expenses: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.expenses, setMonthBundle, invalidateCurrentMonth, refreshYearMonths, currentMonth, refreshEarliestMovementMonthIfAccountChanged]
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
          await invalidateCurrentMonth();
        }
        return true;
      } catch {
        toast.error('Erro ao excluir gasto');
        setMonthBundle((prev) => ({ ...prev, expenses: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.expenses, setMonthBundle, invalidateCurrentMonth]
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
        await invalidateCurrentMonth();
        return true;
      } catch {
        toast.error('Erro ao excluir parcelas');
        setMonthBundle((prev) => ({ ...prev, expenses: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.expenses, setMonthBundle, invalidateCurrentMonth]
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
        await creditCardsService.createCreditCard({
          ...card,
          userId: user.id,
          displayOrder: creditCards.length,
        });
        await fetchCreditCards();
        return true;
      } catch {
        toast.error('Erro ao adicionar cartão');
        setCreditCards((prev) => prev.filter((c) => c.id !== tempId));
        return false;
      }
    },
    [user, creditCards.length, fetchCreditCards]
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
          await invalidateCurrentMonth();
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

  const setCardPaidStatus = useCallback(
    async (cardId: string, paid: boolean): Promise<boolean> => {
      if (!user) return false;

      setMonthBundle((prev) => ({
        ...prev,
        cardMonthlyStatuses: { ...prev.cardMonthlyStatuses, [cardId]: paid },
      }));

      try {
        await creditCardsService.setCardMonthlyStatus(
          user.id,
          cardId,
          currentMonth,
          paid
        );
        return true;
      } catch {
        setMonthBundle((prev) => ({
          ...prev,
          cardMonthlyStatuses: {
            ...prev.cardMonthlyStatuses,
            [cardId]: !paid,
          },
        }));
        return false;
      }
    },
    [user, currentMonth, setMonthBundle]
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

        if (investment.repeatAllMonths) {
          const months = calculateRemainingMonths(currentMonth);
          await refreshYearMonths([currentMonth, ...months]);
        }

        refreshEarliestMovementMonthIfAccountLinked(investment.accountId);
        return true;
      } catch {
        toast.error('Erro ao adicionar investimento');
        setMonthBundle((prev) => ({
          ...prev,
          investments: prev.investments.filter((i) => i.id !== tempId),
        }));
        return false;
      }
    },
    [user, currentMonth, investments.length, setMonthBundle, refreshYearMonths, refreshEarliestMovementMonthIfAccountLinked]
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
          await invalidateCurrentMonth();
          await refreshYearMonths([
            currentMonth,
            ...calculateRemainingMonths(currentMonth),
          ]);
        }
        refreshEarliestMovementMonthIfAccountChanged(updates);
        return true;
      } catch {
        toast.error('Erro ao atualizar investimento');
        setMonthBundle((prev) => ({ ...prev, investments: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.investments, setMonthBundle, invalidateCurrentMonth, refreshYearMonths, currentMonth, refreshEarliestMovementMonthIfAccountChanged]
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
          await invalidateCurrentMonth();
        }
        return true;
      } catch {
        toast.error('Erro ao excluir investimento');
        setMonthBundle((prev) => ({ ...prev, investments: previous }));
        return false;
      }
    },
    [user, monthQuery.data?.investments, setMonthBundle, invalidateCurrentMonth]
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

  const monthData: MonthData = useMemo(
    () => ({ incomes, expenses, investments }),
    [incomes, expenses, investments]
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
