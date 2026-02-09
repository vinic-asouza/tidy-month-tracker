/**
 * Hook para gerenciar dados financeiros
 * 
 * Usa serviços para acessar dados, mantendo desacoplamento do Supabase.
 * A interface pública é mantida para compatibilidade com componentes existentes.
 */

import { useState, useEffect, useCallback } from 'react';
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

// Importar serviços
import * as incomesService from '@/services/incomes';
import * as expensesService from '@/services/expenses';
import * as investmentsService from '@/services/investments';
import * as creditCardsService from '@/services/creditCards';
import * as settingsService from '@/services/settings';

export const useSupabaseFinance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // State for current month data
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [cardMonthlyStatus, setCardMonthlyStatus] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<FinanceSettings>({
    incomeTags: DEFAULT_INCOME_TAGS,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    investmentTags: DEFAULT_INVESTMENT_TAGS,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
  });

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const data = await settingsService.getSettings(user.id);
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [user]);

  // Fetch credit cards (global)
  const fetchCreditCards = useCallback(async () => {
    if (!user) return;

    try {
      const data = await creditCardsService.getCreditCards(user.id);
      setCreditCards(data);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
    }
  }, [user]);

  // Fetch month data
  const fetchMonthData = useCallback(async (yearMonth: string, showLoading = true) => {
    if (!user) return;

    if (showLoading) {
      setLoading(true);
    }

    try {
      const [incomesData, expensesData, investmentsData] = await Promise.all([
        incomesService.getIncomes(user.id, yearMonth),
        expensesService.getExpenses(user.id, yearMonth),
        investmentsService.getInvestments(user.id, yearMonth),
      ]);

      setIncomes(incomesData);
      setExpenses(expensesData);
      setInvestments(investmentsData);
    } catch (error) {
      console.error('Error fetching month data:', error);
      toast.error('Erro ao carregar dados do mês');
    } finally {
      if (showLoading) {
        setLoading(false);
        setInitialLoadDone(true);
      }
    }
  }, [user]);

  // Fetch card monthly status
  const fetchCardMonthlyStatus = useCallback(async (yearMonth: string) => {
    if (!user) return;

    try {
      const statusMap = await creditCardsService.getAllCardMonthlyStatuses(user.id, yearMonth, creditCards);
      setCardMonthlyStatus(statusMap);
    } catch (error) {
      console.error('Error fetching card monthly status:', error);
    }
  }, [user, creditCards]);

  // Initial load - executa apenas uma vez quando user é definido
  useEffect(() => {
    if (!user || initialLoadDone) return;

    const loadInitialData = async () => {
      await Promise.all([
        fetchSettings(),
        fetchCreditCards(),
        fetchMonthData(currentMonth, true),
        fetchCardMonthlyStatus(currentMonth),
      ]);
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Apenas user como dependência para evitar loops

  // Efeito separado para mudanças de mês (após load inicial)
  useEffect(() => {
    if (!user || !initialLoadDone) return;

    const loadMonthData = async () => {
      await Promise.all([
        fetchMonthData(currentMonth, false),
        fetchCardMonthlyStatus(currentMonth),
      ]);
    };

    loadMonthData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, initialLoadDone, user]); // Apenas quando mês ou estado inicial mudar

  // Income operations
  const addIncome = useCallback(async (income: Omit<IncomeEntry, 'id'>): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticIncome: IncomeEntry = {
      id: tempId,
      ...income,
    };
    setIncomes((prev) => [...prev, optimisticIncome]);

    try {
      await incomesService.createIncome({
        ...income,
        userId: user.id,
        yearMonth: currentMonth,
        displayOrder: incomes.length,
      });

      // Silently refresh to get actual data
      await fetchMonthData(currentMonth, false);
      return true;
    } catch (error) {
      toast.error('Erro ao adicionar entrada');
      console.error(error);
      // Rollback
      setIncomes((prev) => prev.filter((i) => i.id !== tempId));
      return false;
    }
  }, [user, currentMonth, incomes.length, fetchMonthData]);

  const updateIncome = useCallback(async (id: string, updates: Partial<IncomeEntry>, applyToAllMonths = false): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const previousIncomes = [...incomes];
    setIncomes((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );

    try {
      await incomesService.updateIncome({
        id,
        userId: user.id,
        updates,
        applyToAllMonths,
      });
      // Se aplicou em todos os meses, recarrega os dados
      if (applyToAllMonths) {
        await fetchMonthData(currentMonth, false);
      }
      return true;
    } catch (error) {
      toast.error('Erro ao atualizar entrada');
      console.error(error);
      // Rollback
      setIncomes(previousIncomes);
      return false;
    }
  }, [user, incomes, currentMonth, fetchMonthData]);

  const deleteIncome = useCallback(async (id: string, applyToAllMonths = false): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const previousIncomes = [...incomes];
    setIncomes((prev) => prev.filter((i) => i.id !== id));

    try {
      await incomesService.deleteIncome(id, user.id, applyToAllMonths);
      // Se aplicou em todos os meses, recarrega os dados
      if (applyToAllMonths) {
        await fetchMonthData(currentMonth, false);
      }
      return true;
    } catch (error) {
      toast.error('Erro ao excluir entrada');
      console.error(error);
      // Rollback
      setIncomes(previousIncomes);
      return false;
    }
  }, [user, incomes, currentMonth, fetchMonthData]);

  const reorderIncomes = useCallback(async (newIncomes: IncomeEntry[]) => {
    if (!user) return;

    setIncomes(newIncomes);

    try {
      await incomesService.reorderIncomes(newIncomes, user.id, currentMonth);
    } catch (error) {
      console.error('Error reordering incomes:', error);
      toast.error('Erro ao reordenar entradas');
    }
  }, [user, currentMonth]);

  // Expense operations
  const addExpense = useCallback(async (expense: Omit<Expense, 'id'>): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticExpense: Expense = {
      id: tempId,
      ...expense,
    };
    setExpenses((prev) => [...prev, optimisticExpense]);

    try {
      await expensesService.createExpense({
        ...expense,
        userId: user.id,
        yearMonth: currentMonth,
        displayOrder: expenses.length,
      });

      // Silently refresh to get actual data
      await fetchMonthData(currentMonth, false);
      return true;
    } catch (error) {
      toast.error('Erro ao adicionar gasto');
      console.error(error);
      // Rollback
      setExpenses((prev) => prev.filter((e) => e.id !== tempId));
      return false;
    }
  }, [user, currentMonth, expenses.length, fetchMonthData]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>, applyToAllMonths = false): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const previousExpenses = [...expenses];
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );

    try {
      await expensesService.updateExpense({
        id,
        userId: user.id,
        updates,
        applyToAllMonths,
      });
      // Se aplicou em todos os meses, recarrega os dados
      if (applyToAllMonths) {
        await fetchMonthData(currentMonth, false);
      }
      return true;
    } catch (error) {
      toast.error('Erro ao atualizar gasto');
      console.error(error);
      // Rollback
      setExpenses(previousExpenses);
      return false;
    }
  }, [user, expenses, currentMonth, fetchMonthData]);

  const deleteExpense = useCallback(async (id: string, applyToAllMonths = false): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const previousExpenses = [...expenses];
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    try {
      await expensesService.deleteExpense(id, user.id, applyToAllMonths);
      // Se aplicou em todos os meses, recarrega os dados
      if (applyToAllMonths) {
        await fetchMonthData(currentMonth, false);
      }
      return true;
    } catch (error) {
      toast.error('Erro ao excluir gasto');
      console.error(error);
      // Rollback
      setExpenses(previousExpenses);
      return false;
    }
  }, [user, expenses, currentMonth, fetchMonthData]);

  const deleteInstallmentExpense = useCallback(async (expense: Expense): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update - remove all related installments from current view
    const previousExpenses = [...expenses];
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id));

    try {
      await expensesService.deleteInstallmentExpense(expense, user.id);
      return true;
    } catch (error) {
      toast.error('Erro ao excluir parcelas');
      console.error(error);
      // Rollback
      setExpenses(previousExpenses);
      return false;
    }
  }, [user, expenses]);

  const reorderExpenses = useCallback(async (newExpenses: Expense[]) => {
    if (!user) return;

    setExpenses(newExpenses);

    try {
      await expensesService.reorderExpenses(newExpenses, user.id);
    } catch (error) {
      console.error('Error reordering expenses:', error);
      toast.error('Erro ao reordenar gastos');
    }
  }, [user]);

  // Credit Card operations
  const addCreditCard = useCallback(async (card: Omit<CreditCard, 'id'>): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticCard: CreditCard = {
      id: tempId,
      ...card,
    };
    setCreditCards((prev) => [...prev, optimisticCard]);

    try {
      await creditCardsService.createCreditCard({
        ...card,
        userId: user.id,
        displayOrder: creditCards.length,
      });

      // Silently refresh to get actual ID
      await fetchCreditCards();
      return true;
    } catch (error) {
      toast.error('Erro ao adicionar cartão');
      console.error(error);
      // Rollback
      setCreditCards((prev) => prev.filter((c) => c.id !== tempId));
      return false;
    }
  }, [user, creditCards.length, fetchCreditCards]);

  const updateCreditCard = useCallback(async (id: string, updates: Partial<CreditCard>): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
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
      // Se o nome foi alterado, recarrega os dados do mês para atualizar os gastos
      if (updates.name !== undefined) {
        await fetchMonthData(currentMonth, false);
      }
      return true;
    } catch (error: any) {
      // Mostra mensagem específica do backend se disponível
      const errorMessage = error?.message || 'Erro ao atualizar cartão';
      toast.error(errorMessage);
      console.error(error);
      // Rollback
      setCreditCards(previousCards);
      return false;
    }
  }, [user, creditCards, currentMonth, fetchMonthData]);

  const deleteCreditCard = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const previousCards = [...creditCards];
    setCreditCards((prev) => prev.filter((c) => c.id !== id));

    try {
      await creditCardsService.deleteCreditCard(id, user.id);
      return true;
    } catch (error) {
      toast.error('Erro ao excluir cartão');
      console.error(error);
      // Rollback
      setCreditCards(previousCards);
      return false;
    }
  }, [user, creditCards]);

  const getCreditCardTotal = useCallback((cardName: string): number => {
    return expenses
      .filter((e) => e.paymentMethod === cardName)
      .reduce((sum, e) => sum + e.value, 0);
  }, [expenses]);

  const canDeleteCard = useCallback(async (cardName: string): Promise<boolean> => {
    if (!user) return true;

    try {
      return await creditCardsService.canDeleteCreditCard(cardName, user.id);
    } catch (error) {
      console.error(error);
      return false;
    }
  }, [user]);

  const cardNameExists = useCallback((name: string, excludeId?: string): boolean => {
    return creditCards.some(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== excludeId
    );
  }, [creditCards]);

  // Card monthly paid status
  const getCardPaidStatus = useCallback((cardId: string): boolean => {
    return cardMonthlyStatus[cardId] || false;
  }, [cardMonthlyStatus]);

  const setCardPaidStatus = useCallback(async (cardId: string, paid: boolean): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    setCardMonthlyStatus(prev => ({ ...prev, [cardId]: paid }));

    try {
      await creditCardsService.setCardMonthlyStatus(
        user.id,
        cardId,
        currentMonth,
        paid
      );
      return true;
    } catch (error) {
      console.error('Error updating card paid status:', error);
      // Rollback
      setCardMonthlyStatus(prev => ({ ...prev, [cardId]: !paid }));
      return false;
    }
  }, [user, currentMonth]);

  // Investment operations
  const addInvestment = useCallback(async (investment: Omit<Investment, 'id'>): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticInvestment: Investment = {
      id: tempId,
      ...investment,
    };
    setInvestments((prev) => [...prev, optimisticInvestment]);

    try {
      await investmentsService.createInvestment({
        ...investment,
        userId: user.id,
        yearMonth: currentMonth,
        displayOrder: investments.length,
      });

      // Silently refresh to get actual ID
      await fetchMonthData(currentMonth, false);
      return true;
    } catch (error) {
      toast.error('Erro ao adicionar investimento');
      console.error(error);
      // Rollback
      setInvestments((prev) => prev.filter((i) => i.id !== tempId));
      return false;
    }
  }, [user, currentMonth, investments.length, fetchMonthData]);

  const updateInvestment = useCallback(async (id: string, updates: Partial<Investment>, applyToAllMonths = false): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const previousInvestments = [...investments];
    setInvestments((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );

    try {
      await investmentsService.updateInvestment({
        id,
        userId: user.id,
        updates,
        applyToAllMonths,
      });
      // Se aplicou em todos os meses, recarrega os dados
      if (applyToAllMonths) {
        await fetchMonthData(currentMonth, false);
      }
      return true;
    } catch (error) {
      toast.error('Erro ao atualizar investimento');
      console.error(error);
      // Rollback
      setInvestments(previousInvestments);
      return false;
    }
  }, [user, investments, currentMonth, fetchMonthData]);

  const deleteInvestment = useCallback(async (id: string, applyToAllMonths = false): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const previousInvestments = [...investments];
    setInvestments((prev) => prev.filter((i) => i.id !== id));

    try {
      await investmentsService.deleteInvestment(id, user.id, applyToAllMonths);
      // Se aplicou em todos os meses, recarrega os dados
      if (applyToAllMonths) {
        await fetchMonthData(currentMonth, false);
      }
      return true;
    } catch (error) {
      toast.error('Erro ao excluir investimento');
      console.error(error);
      // Rollback
      setInvestments(previousInvestments);
      return false;
    }
  }, [user, investments, currentMonth, fetchMonthData]);

  const reorderInvestments = useCallback(async (newInvestments: Investment[]) => {
    if (!user) return;

    setInvestments(newInvestments);

    try {
      await investmentsService.reorderInvestments(newInvestments, user.id);
    } catch (error) {
      console.error('Error reordering investments:', error);
      toast.error('Erro ao reordenar investimentos');
    }
  }, [user]);

  // Investment tags management
  const addInvestmentTag = useCallback(async (tag: string) => {
    if (!user) return;

    const newTags = [...settings.investmentTags, tag];

    try {
      await settingsService.updateInvestmentTags(user.id, newTags);
      setSettings((prev) => ({ ...prev, investmentTags: newTags }));
    } catch (error) {
      toast.error('Erro ao adicionar tag');
      console.error(error);
    }
  }, [user, settings.investmentTags]);

  const updateInvestmentTag = useCallback(async (oldTag: string, newTag: string) => {
    if (!user) return;

    const newTags = settings.investmentTags.map((t) => (t === oldTag ? newTag : t));

    try {
      await settingsService.updateInvestmentTags(user.id, newTags);
      await settingsService.updateInvestmentTagInInvestments(user.id, oldTag, newTag);
      setSettings((prev) => ({ ...prev, investmentTags: newTags }));
      await fetchMonthData(currentMonth);
    } catch (error) {
      toast.error('Erro ao atualizar tag');
      console.error(error);
    }
  }, [user, settings.investmentTags, currentMonth, fetchMonthData]);

  const deleteInvestmentTag = useCallback(async (tag: string) => {
    if (!user) return;

    const newTags = settings.investmentTags.filter((t) => t !== tag);

    try {
      await settingsService.updateInvestmentTags(user.id, newTags);
      setSettings((prev) => ({ ...prev, investmentTags: newTags }));
    } catch (error) {
      toast.error('Erro ao excluir tag');
      console.error(error);
    }
  }, [user, settings.investmentTags]);

  // Get year data for statistics
  const getYearData = useCallback(async (year: number): Promise<MonthData[]> => {
    if (!user) return Array(12).fill(getEmptyMonthData());

    const monthsData: MonthData[] = [];

    for (let m = 1; m <= 12; m++) {
      const yearMonth = `${year}-${String(m).padStart(2, '0')}`;

      try {
        const [incomesData, expensesData, investmentsData] = await Promise.all([
          incomesService.getIncomes(user.id, yearMonth),
          expensesService.getExpenses(user.id, yearMonth),
          investmentsService.getInvestments(user.id, yearMonth),
        ]);

        monthsData.push({
          incomes: incomesData,
          expenses: expensesData,
          investments: investmentsData,
        });
      } catch (error) {
        console.error(`Error fetching data for ${yearMonth}:`, error);
        monthsData.push(getEmptyMonthData());
      }
    }

    return monthsData;
  }, [user]);

  const monthData: MonthData = {
    incomes,
    expenses,
    investments,
  };

  return {
    loading,
    currentMonth,
    setCurrentMonth,
    monthData,
    settings,
    creditCards,
    // Income
    addIncome,
    updateIncome,
    deleteIncome,
    reorderIncomes,
    // Expense
    addExpense,
    updateExpense,
    deleteExpense,
    deleteInstallmentExpense,
    reorderExpenses,
    // Credit Card
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    getCreditCardTotal,
    canDeleteCard,
    cardNameExists,
    getCardPaidStatus,
    setCardPaidStatus,
    // Investment
    addInvestment,
    updateInvestment,
    deleteInvestment,
    reorderInvestments,
    // Investment tags
    addInvestmentTag,
    updateInvestmentTag,
    deleteInvestmentTag,
    // Stats
    getYearData,
    // Refresh
    refreshData: () => fetchMonthData(currentMonth),
  };
};
