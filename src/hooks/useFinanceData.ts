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
  CARD_COLORS,
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
    // Migrate tags[] to tag for incomes and investments
    Object.keys(parsed.months).forEach(monthKey => {
      const month = parsed.months[monthKey];
      if (month.incomes) {
        month.incomes = month.incomes.map((income: IncomeEntry & { tags?: string[] }) => ({
          ...income,
          tag: income.tag || (income.tags && income.tags[0]) || 'Outros',
        }));
      }
      if (month.investments) {
        month.investments = month.investments.map((inv: Investment & { tags?: string[] }) => ({
          ...inv,
          tag: inv.tag || (inv.tags && inv.tags[0]) || 'Outros',
        }));
      }
      // Migrate credit cards to include color
      if (month.creditCards) {
        month.creditCards = month.creditCards.map((card: CreditCard) => ({
          ...card,
          color: card.color || CARD_COLORS[0].id,
        }));
      }
    });
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

    // Handle repeat all months
    if (income.repeatAllMonths) {
      const [year] = currentMonth.split('-').map(Number);
      const currentMonthNum = parseInt(currentMonth.split('-')[1]);
      
      for (let m = 1; m <= 12; m++) {
        if (m === currentMonthNum) continue;
        const monthKey = `${year}-${String(m).padStart(2, '0')}`;
        const targetMonthData = getMonthData(monthKey);
        
        const repeatedIncome: IncomeEntry = {
          ...income,
          id: crypto.randomUUID(),
          baseIncomeId: newIncome.id,
        };
        
        updateMonthData(monthKey, {
          ...targetMonthData,
          incomes: [...targetMonthData.incomes, repeatedIncome],
        });
      }
    }
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

  const reorderIncomes = useCallback((incomes: IncomeEntry[]) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      incomes,
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

    // Handle repeat all months for fixed expenses
    if (expense.type === 'fixed' && expense.repeatAllMonths) {
      const [year] = currentMonth.split('-').map(Number);
      const currentMonthNum = parseInt(currentMonth.split('-')[1]);
      
      for (let m = 1; m <= 12; m++) {
        if (m === currentMonthNum) continue;
        const monthKey = `${year}-${String(m).padStart(2, '0')}`;
        const targetMonthData = getMonthData(monthKey);
        
        const repeatedExpense: Expense = {
          ...expense,
          id: crypto.randomUUID(),
          baseExpenseId: newExpense.id,
          paid: false,
        };
        
        updateMonthData(monthKey, {
          ...targetMonthData,
          expenses: [...targetMonthData.expenses, repeatedExpense],
        });
      }
    }

    // Handle installment expenses
    if (expense.type === 'installment' && expense.currentInstallment && expense.totalInstallments) {
      const [year, month] = currentMonth.split('-').map(Number);
      const remainingInstallments = expense.totalInstallments - expense.currentInstallment;
      
      for (let i = 1; i <= remainingInstallments; i++) {
        let targetMonth = month + i;
        let targetYear = year;
        
        while (targetMonth > 12) {
          targetMonth -= 12;
          targetYear += 1;
        }
        
        const monthKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
        const targetMonthData = getMonthData(monthKey);
        
        const installmentExpense: Expense = {
          ...expense,
          id: crypto.randomUUID(),
          baseExpenseId: newExpense.id,
          currentInstallment: expense.currentInstallment + i,
          paid: false,
        };
        
        updateMonthData(monthKey, {
          ...targetMonthData,
          expenses: [...targetMonthData.expenses, installmentExpense],
        });
      }
    }
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

  const reorderExpenses = useCallback((expenses: Expense[]) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      expenses,
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

  const getCreditCardTotal = useCallback((cardName: string): number => {
    const monthData = getMonthData(currentMonth);
    return monthData.expenses
      .filter(e => e.paymentMethod === cardName)
      .reduce((sum, e) => sum + e.value, 0);
  }, [currentMonth, getMonthData]);

  const canDeleteCard = useCallback((cardName: string): boolean => {
    const monthData = getMonthData(currentMonth);
    return !monthData.expenses.some(e => e.paymentMethod === cardName);
  }, [currentMonth, getMonthData]);

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

  const reorderInvestments = useCallback((investments: Investment[]) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      investments,
    });
  }, [currentMonth, getMonthData, updateMonthData]);

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
    reorderIncomes,
    // Expense
    addExpense,
    updateExpense,
    deleteExpense,
    reorderExpenses,
    // Credit Card
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    getCreditCardTotal,
    canDeleteCard,
    // Investment
    addInvestment,
    updateInvestment,
    deleteInvestment,
    reorderInvestments,
    // Stats
    getYearData,
    getMonthData,
  };
};
