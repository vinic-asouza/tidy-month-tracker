import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export const useSupabaseFinance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // State for current month data
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [settings, setSettings] = useState<FinanceSettings>({
    incomeTags: DEFAULT_INCOME_TAGS,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    investmentTags: DEFAULT_INVESTMENT_TAGS,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
  });

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('finance_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return;
    }

    if (data) {
      setSettings({
        incomeTags: data.income_tags || DEFAULT_INCOME_TAGS,
        expenseCategories: data.expense_categories || DEFAULT_EXPENSE_CATEGORIES,
        investmentTags: data.investment_tags || DEFAULT_INVESTMENT_TAGS,
        paymentMethods: data.payment_methods || DEFAULT_PAYMENT_METHODS,
      });
    }
  }, [user]);

  // Fetch credit cards (global)
  const fetchCreditCards = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (error) {
      console.error('Error fetching credit cards:', error);
      return;
    }

    setCreditCards(
      data?.map((card) => ({
        id: card.id,
        name: card.name,
        color: card.color,
        paid: card.paid,
      })) || []
    );
  }, [user]);

  // Fetch month data
  const fetchMonthData = useCallback(async (yearMonth: string) => {
    if (!user) return;

    setLoading(true);

    const [incomesRes, expensesRes, investmentsRes] = await Promise.all([
      supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .eq('year_month', yearMonth)
        .order('display_order'),
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('year_month', yearMonth)
        .order('display_order'),
      supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .eq('year_month', yearMonth)
        .order('display_order'),
    ]);

    if (incomesRes.error) console.error('Error fetching incomes:', incomesRes.error);
    if (expensesRes.error) console.error('Error fetching expenses:', expensesRes.error);
    if (investmentsRes.error) console.error('Error fetching investments:', investmentsRes.error);

    setIncomes(
      incomesRes.data?.map((i) => ({
        id: i.id,
        description: i.description,
        value: Number(i.value),
        tag: i.tag,
        date: i.date,
        repeatAllMonths: i.repeat_all_months,
        baseIncomeId: i.base_income_id || undefined,
      })) || []
    );

    setExpenses(
      expensesRes.data?.map((e) => ({
        id: e.id,
        type: e.type as 'fixed' | 'variable' | 'installment',
        category: e.category,
        description: e.description,
        paymentMethod: e.payment_method,
        value: Number(e.value),
        paid: e.paid,
        repeatAllMonths: e.repeat_all_months,
        baseExpenseId: e.base_expense_id || undefined,
        currentInstallment: e.current_installment || undefined,
        totalInstallments: e.total_installments || undefined,
      })) || []
    );

    setInvestments(
      investmentsRes.data?.map((i) => ({
        id: i.id,
        description: i.description,
        value: Number(i.value),
        tag: i.tag,
        date: i.date,
      })) || []
    );

    setLoading(false);
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchCreditCards();
      fetchMonthData(currentMonth);
    }
  }, [user, fetchSettings, fetchCreditCards, fetchMonthData, currentMonth]);

  // Income operations
  const addIncome = useCallback(async (income: Omit<IncomeEntry, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('incomes')
      .insert({
        user_id: user.id,
        year_month: currentMonth,
        description: income.description,
        value: income.value,
        tag: income.tag,
        date: income.date,
        repeat_all_months: income.repeatAllMonths || false,
        display_order: incomes.length,
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao adicionar entrada');
      console.error(error);
      return;
    }

    // Handle repeat all months
    if (income.repeatAllMonths && data) {
      const [year] = currentMonth.split('-').map(Number);
      const currentMonthNum = parseInt(currentMonth.split('-')[1]);

      const repeatedIncomes = [];
      for (let m = 1; m <= 12; m++) {
        if (m === currentMonthNum) continue;
        const monthKey = `${year}-${String(m).padStart(2, '0')}`;
        repeatedIncomes.push({
          user_id: user.id,
          year_month: monthKey,
          description: income.description,
          value: income.value,
          tag: income.tag,
          date: income.date,
          repeat_all_months: true,
          base_income_id: data.id,
          display_order: 0,
        });
      }

      if (repeatedIncomes.length > 0) {
        await supabase.from('incomes').insert(repeatedIncomes);
      }
    }

    fetchMonthData(currentMonth);
  }, [user, currentMonth, incomes.length, fetchMonthData]);

  const updateIncome = useCallback(async (id: string, updates: Partial<IncomeEntry>) => {
    if (!user) return;

    const { error } = await supabase
      .from('incomes')
      .update({
        description: updates.description,
        value: updates.value,
        tag: updates.tag,
        repeat_all_months: updates.repeatAllMonths,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao atualizar entrada');
      console.error(error);
      return;
    }

    fetchMonthData(currentMonth);
  }, [user, currentMonth, fetchMonthData]);

  const deleteIncome = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao excluir entrada');
      console.error(error);
      return;
    }

    fetchMonthData(currentMonth);
  }, [user, currentMonth, fetchMonthData]);

  const reorderIncomes = useCallback(async (newIncomes: IncomeEntry[]) => {
    if (!user) return;

    setIncomes(newIncomes);

    const updates = newIncomes.map((income, index) => ({
      id: income.id,
      user_id: user.id,
      year_month: currentMonth,
      description: income.description,
      value: income.value,
      tag: income.tag,
      date: income.date,
      repeat_all_months: income.repeatAllMonths || false,
      display_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('incomes')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }
  }, [user, currentMonth]);

  // Expense operations
  const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        year_month: currentMonth,
        type: expense.type,
        category: expense.category,
        description: expense.description,
        payment_method: expense.paymentMethod,
        value: expense.value,
        paid: expense.paid,
        repeat_all_months: expense.repeatAllMonths || false,
        current_installment: expense.currentInstallment,
        total_installments: expense.totalInstallments,
        display_order: expenses.length,
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao adicionar gasto');
      console.error(error);
      return;
    }

    // Handle repeat all months for fixed expenses
    if (expense.type === 'fixed' && expense.repeatAllMonths && data) {
      const [year] = currentMonth.split('-').map(Number);
      const currentMonthNum = parseInt(currentMonth.split('-')[1]);

      const repeatedExpenses = [];
      for (let m = 1; m <= 12; m++) {
        if (m === currentMonthNum) continue;
        const monthKey = `${year}-${String(m).padStart(2, '0')}`;
        repeatedExpenses.push({
          user_id: user.id,
          year_month: monthKey,
          type: expense.type,
          category: expense.category,
          description: expense.description,
          payment_method: expense.paymentMethod,
          value: expense.value,
          paid: false,
          repeat_all_months: true,
          base_expense_id: data.id,
          display_order: 0,
        });
      }

      if (repeatedExpenses.length > 0) {
        await supabase.from('expenses').insert(repeatedExpenses);
      }
    }

    // Handle installment expenses
    if (expense.type === 'installment' && expense.currentInstallment && expense.totalInstallments && data) {
      const [year, month] = currentMonth.split('-').map(Number);
      const remainingInstallments = expense.totalInstallments - expense.currentInstallment;

      const installmentExpenses = [];
      for (let i = 1; i <= remainingInstallments; i++) {
        let targetMonth = month + i;
        let targetYear = year;

        while (targetMonth > 12) {
          targetMonth -= 12;
          targetYear += 1;
        }

        const monthKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
        installmentExpenses.push({
          user_id: user.id,
          year_month: monthKey,
          type: expense.type,
          category: expense.category,
          description: expense.description,
          payment_method: expense.paymentMethod,
          value: expense.value,
          paid: false,
          base_expense_id: data.id,
          current_installment: expense.currentInstallment + i,
          total_installments: expense.totalInstallments,
          display_order: 0,
        });
      }

      if (installmentExpenses.length > 0) {
        await supabase.from('expenses').insert(installmentExpenses);
      }
    }

    fetchMonthData(currentMonth);
  }, [user, currentMonth, expenses.length, fetchMonthData]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    if (!user) return;

    const { error } = await supabase
      .from('expenses')
      .update({
        category: updates.category,
        description: updates.description,
        payment_method: updates.paymentMethod,
        value: updates.value,
        paid: updates.paid,
        repeat_all_months: updates.repeatAllMonths,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao atualizar gasto');
      console.error(error);
      return;
    }

    fetchMonthData(currentMonth);
  }, [user, currentMonth, fetchMonthData]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao excluir gasto');
      console.error(error);
      return;
    }

    fetchMonthData(currentMonth);
  }, [user, currentMonth, fetchMonthData]);

  const deleteInstallmentExpense = useCallback(async (expense: Expense) => {
    if (!user) return;

    const baseId = expense.baseExpenseId || expense.id;

    // Delete all related installments
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('user_id', user.id)
      .or(`id.eq.${baseId},base_expense_id.eq.${baseId}`);

    if (error) {
      toast.error('Erro ao excluir parcelas');
      console.error(error);
      return;
    }

    fetchMonthData(currentMonth);
  }, [user, currentMonth, fetchMonthData]);

  const reorderExpenses = useCallback(async (newExpenses: Expense[]) => {
    if (!user) return;

    setExpenses(newExpenses);

    for (let i = 0; i < newExpenses.length; i++) {
      await supabase
        .from('expenses')
        .update({ display_order: i })
        .eq('id', newExpenses[i].id);
    }
  }, [user]);

  // Credit Card operations
  const addCreditCard = useCallback(async (card: Omit<CreditCard, 'id'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('credit_cards')
      .insert({
        user_id: user.id,
        name: card.name,
        color: card.color,
        paid: card.paid,
        display_order: creditCards.length,
      });

    if (error) {
      toast.error('Erro ao adicionar cartão');
      console.error(error);
      return;
    }

    fetchCreditCards();
  }, [user, creditCards.length, fetchCreditCards]);

  const updateCreditCard = useCallback(async (id: string, updates: Partial<CreditCard>) => {
    if (!user) return;

    const { error } = await supabase
      .from('credit_cards')
      .update({
        name: updates.name,
        color: updates.color,
        paid: updates.paid,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao atualizar cartão');
      console.error(error);
      return;
    }

    fetchCreditCards();
  }, [user, fetchCreditCards]);

  const deleteCreditCard = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao excluir cartão');
      console.error(error);
      return;
    }

    fetchCreditCards();
  }, [user, fetchCreditCards]);

  const getCreditCardTotal = useCallback((cardName: string): number => {
    return expenses
      .filter((e) => e.paymentMethod === cardName)
      .reduce((sum, e) => sum + e.value, 0);
  }, [expenses]);

  const canDeleteCard = useCallback(async (cardName: string): Promise<boolean> => {
    if (!user) return true;

    const { count, error } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('payment_method', cardName);

    if (error) {
      console.error(error);
      return false;
    }

    return (count || 0) === 0;
  }, [user]);

  const cardNameExists = useCallback((name: string, excludeId?: string): boolean => {
    return creditCards.some(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== excludeId
    );
  }, [creditCards]);

  // Investment operations
  const addInvestment = useCallback(async (investment: Omit<Investment, 'id'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('investments')
      .insert({
        user_id: user.id,
        year_month: currentMonth,
        description: investment.description,
        value: investment.value,
        tag: investment.tag,
        date: investment.date,
        display_order: investments.length,
      });

    if (error) {
      toast.error('Erro ao adicionar investimento');
      console.error(error);
      return;
    }

    fetchMonthData(currentMonth);
  }, [user, currentMonth, investments.length, fetchMonthData]);

  const updateInvestment = useCallback(async (id: string, updates: Partial<Investment>) => {
    if (!user) return;

    const { error } = await supabase
      .from('investments')
      .update({
        description: updates.description,
        value: updates.value,
        tag: updates.tag,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao atualizar investimento');
      console.error(error);
      return;
    }

    fetchMonthData(currentMonth);
  }, [user, currentMonth, fetchMonthData]);

  const deleteInvestment = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao excluir investimento');
      console.error(error);
      return;
    }

    fetchMonthData(currentMonth);
  }, [user, currentMonth, fetchMonthData]);

  const reorderInvestments = useCallback(async (newInvestments: Investment[]) => {
    if (!user) return;

    setInvestments(newInvestments);

    for (let i = 0; i < newInvestments.length; i++) {
      await supabase
        .from('investments')
        .update({ display_order: i })
        .eq('id', newInvestments[i].id);
    }
  }, [user]);

  // Investment tags management
  const addInvestmentTag = useCallback(async (tag: string) => {
    if (!user) return;

    const newTags = [...settings.investmentTags, tag];

    const { error } = await supabase
      .from('finance_settings')
      .update({ investment_tags: newTags })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao adicionar tag');
      console.error(error);
      return;
    }

    setSettings((prev) => ({ ...prev, investmentTags: newTags }));
  }, [user, settings.investmentTags]);

  const updateInvestmentTag = useCallback(async (oldTag: string, newTag: string) => {
    if (!user) return;

    const newTags = settings.investmentTags.map((t) => (t === oldTag ? newTag : t));

    const { error } = await supabase
      .from('finance_settings')
      .update({ investment_tags: newTags })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao atualizar tag');
      console.error(error);
      return;
    }

    // Update all investments with this tag
    await supabase
      .from('investments')
      .update({ tag: newTag })
      .eq('user_id', user.id)
      .eq('tag', oldTag);

    setSettings((prev) => ({ ...prev, investmentTags: newTags }));
    fetchMonthData(currentMonth);
  }, [user, settings.investmentTags, currentMonth, fetchMonthData]);

  const deleteInvestmentTag = useCallback(async (tag: string) => {
    if (!user) return;

    const newTags = settings.investmentTags.filter((t) => t !== tag);

    const { error } = await supabase
      .from('finance_settings')
      .update({ investment_tags: newTags })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao excluir tag');
      console.error(error);
      return;
    }

    setSettings((prev) => ({ ...prev, investmentTags: newTags }));
  }, [user, settings.investmentTags]);

  // Get year data for statistics
  const getYearData = useCallback(async (year: number): Promise<MonthData[]> => {
    if (!user) return Array(12).fill(getEmptyMonthData());

    const monthsData: MonthData[] = [];

    for (let m = 1; m <= 12; m++) {
      const yearMonth = `${year}-${String(m).padStart(2, '0')}`;

      const [incomesRes, expensesRes, investmentsRes] = await Promise.all([
        supabase.from('incomes').select('*').eq('user_id', user.id).eq('year_month', yearMonth),
        supabase.from('expenses').select('*').eq('user_id', user.id).eq('year_month', yearMonth),
        supabase.from('investments').select('*').eq('user_id', user.id).eq('year_month', yearMonth),
      ]);

      monthsData.push({
        incomes:
          incomesRes.data?.map((i) => ({
            id: i.id,
            description: i.description,
            value: Number(i.value),
            tag: i.tag,
            date: i.date,
            repeatAllMonths: i.repeat_all_months,
            baseIncomeId: i.base_income_id || undefined,
          })) || [],
        expenses:
          expensesRes.data?.map((e) => ({
            id: e.id,
            type: e.type as 'fixed' | 'variable' | 'installment',
            category: e.category,
            description: e.description,
            paymentMethod: e.payment_method,
            value: Number(e.value),
            paid: e.paid,
            repeatAllMonths: e.repeat_all_months,
            baseExpenseId: e.base_expense_id || undefined,
            currentInstallment: e.current_installment || undefined,
            totalInstallments: e.total_installments || undefined,
          })) || [],
        investments:
          investmentsRes.data?.map((i) => ({
            id: i.id,
            description: i.description,
            value: Number(i.value),
            tag: i.tag,
            date: i.date,
          })) || [],
      });
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
