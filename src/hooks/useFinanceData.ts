import { useState, useEffect, useCallback } from 'react';
import {
  FinanceData,
  MonthData,
  IncomeEntry,
  Expense,
  CreditCard,
  Investment,
  getEmptyMonthData,
  DEFAULT_INCOME_TAGS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INVESTMENT_TAGS,
  DEFAULT_PAYMENT_METHODS,
} from '@/types/finance';

const STORAGE_KEY = 'finance-data';

const getInitialData = (): FinanceData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Handle legacy format migration
    if (!parsed.months) {
      return {
        months: {},
        settings: parsed.settings || {
          incomeTags: DEFAULT_INCOME_TAGS,
          expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
          investmentTags: DEFAULT_INVESTMENT_TAGS,
          paymentMethods: DEFAULT_PAYMENT_METHODS,
        },
      };
    }
    return parsed;
  }
  return {
    months: {},
    settings: {
      incomeTags: DEFAULT_INCOME_TAGS,
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      investmentTags: DEFAULT_INVESTMENT_TAGS,
      paymentMethods: DEFAULT_PAYMENT_METHODS,
    },
  };
};

export const useFinanceData = () => {
  const [data, setData] = useState<FinanceData>(getInitialData);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const getMonthData = useCallback((yearMonth: string): MonthData => {
    return data.months[yearMonth] || getEmptyMonthData();
  }, [data]);

  const updateMonthData = useCallback((yearMonth: string, monthData: MonthData) => {
    setData(prev => ({
      ...prev,
      months: {
        ...prev.months,
        [yearMonth]: monthData,
      },
    }));
  }, []);

  // Income operations
  const addIncome = useCallback((income: Omit<IncomeEntry, 'id'>) => {
    const monthData = getMonthData(currentMonth);
    const newIncome: IncomeEntry = {
      ...income,
      id: crypto.randomUUID(),
    };
    updateMonthData(currentMonth, {
      ...monthData,
      incomes: [...monthData.incomes, newIncome],
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  const updateIncome = useCallback((id: string, updates: Partial<IncomeEntry>) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      incomes: monthData.incomes.map(i => i.id === id ? { ...i, ...updates } : i),
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  const deleteIncome = useCallback((id: string) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      incomes: monthData.incomes.filter(i => i.id !== id),
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  // Expense operations
  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    const monthData = getMonthData(currentMonth);
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
    };
    updateMonthData(currentMonth, {
      ...monthData,
      expenses: [...monthData.expenses, newExpense],
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      expenses: monthData.expenses.map(e => e.id === id ? { ...e, ...updates } : e),
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  const deleteExpense = useCallback((id: string) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      expenses: monthData.expenses.filter(e => e.id !== id),
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  // Credit Card operations
  const addCreditCard = useCallback((card: Omit<CreditCard, 'id'>) => {
    const monthData = getMonthData(currentMonth);
    const newCard: CreditCard = {
      ...card,
      id: crypto.randomUUID(),
    };
    updateMonthData(currentMonth, {
      ...monthData,
      creditCards: [...monthData.creditCards, newCard],
    });
    // Add to payment methods
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        paymentMethods: prev.settings.paymentMethods.includes(card.name)
          ? prev.settings.paymentMethods
          : [...prev.settings.paymentMethods, card.name],
      },
    }));
  }, [currentMonth, getMonthData, updateMonthData]);

  const updateCreditCard = useCallback((id: string, updates: Partial<CreditCard>) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      creditCards: monthData.creditCards.map(c => c.id === id ? { ...c, ...updates } : c),
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  const deleteCreditCard = useCallback((id: string) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      creditCards: monthData.creditCards.filter(c => c.id !== id),
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  // Investment operations
  const addInvestment = useCallback((investment: Omit<Investment, 'id'>) => {
    const monthData = getMonthData(currentMonth);
    const newInvestment: Investment = {
      ...investment,
      id: crypto.randomUUID(),
    };
    updateMonthData(currentMonth, {
      ...monthData,
      investments: [...monthData.investments, newInvestment],
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  const updateInvestment = useCallback((id: string, updates: Partial<Investment>) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      investments: monthData.investments.map(i => i.id === id ? { ...i, ...updates } : i),
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  const deleteInvestment = useCallback((id: string) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      investments: monthData.investments.filter(i => i.id !== id),
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  // Settings operations
  const addTag = useCallback((type: 'income' | 'expense' | 'investment', tag: string) => {
    setData(prev => {
      const key = type === 'income' ? 'incomeTags' : type === 'expense' ? 'expenseCategories' : 'investmentTags';
      if (prev.settings[key].includes(tag)) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          [key]: [...prev.settings[key], tag],
        },
      };
    });
  }, []);

  const removeTag = useCallback((type: 'income' | 'expense' | 'investment', tag: string) => {
    setData(prev => {
      const key = type === 'income' ? 'incomeTags' : type === 'expense' ? 'expenseCategories' : 'investmentTags';
      return {
        ...prev,
        settings: {
          ...prev.settings,
          [key]: prev.settings[key].filter(t => t !== tag),
        },
      };
    });
  }, []);

  const getCreditCardTotal = useCallback((cardName: string): number => {
    const monthData = getMonthData(currentMonth);
    return monthData.expenses
      .filter(e => e.paymentMethod === cardName)
      .reduce((sum, e) => sum + e.value, 0);
  }, [currentMonth, getMonthData]);

  // Get all data for year
  const getYearData = useCallback((year: number) => {
    const months: MonthData[] = [];
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      months.push(getMonthData(key));
    }
    return months;
  }, [getMonthData]);

  return {
    data,
    currentMonth,
    setCurrentMonth,
    monthData: getMonthData(currentMonth),
    settings: data.settings,
    // Income
    addIncome,
    updateIncome,
    deleteIncome,
    // Expense
    addExpense,
    updateExpense,
    deleteExpense,
    // Credit Card
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    getCreditCardTotal,
    // Investment
    addInvestment,
    updateInvestment,
    deleteInvestment,
    // Settings
    addTag,
    removeTag,
    // Stats
    getYearData,
    getMonthData,
  };
};
