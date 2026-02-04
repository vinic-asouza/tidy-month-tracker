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
        creditCards: [],
      };
    }
    
    // Migrate credit cards from monthly to global if needed
    let globalCards: CreditCard[] = parsed.creditCards || [];
    
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
      // Migrate monthly credit cards to global (only once, take from first month that has cards)
      if (month.creditCards && month.creditCards.length > 0 && globalCards.length === 0) {
        globalCards = month.creditCards.map((card: CreditCard) => ({
          ...card,
          color: card.color || CARD_COLORS[0].id,
        }));
      }
      // Remove creditCards from month data
      delete month.creditCards;
    });
    
    return {
      ...parsed,
      creditCards: globalCards,
    };
  }
  return {
    months: {},
    settings: {
      incomeTags: DEFAULT_INCOME_TAGS,
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      investmentTags: DEFAULT_INVESTMENT_TAGS,
      paymentMethods: DEFAULT_PAYMENT_METHODS,
    },
    creditCards: [],
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

  // Delete installment expense from all months
  const deleteInstallmentExpense = useCallback((expense: Expense) => {
    if (expense.type !== 'installment' || !expense.baseExpenseId) {
      // Just delete from current month if it's the original
      const monthData = getMonthData(currentMonth);
      const baseId = expense.id;
      
      // Delete from current month
      updateMonthData(currentMonth, {
        ...monthData,
        expenses: monthData.expenses.filter(e => e.id !== expense.id),
      });
      
      // Delete related expenses from all months
      Object.keys(data.months).forEach(monthKey => {
        if (monthKey === currentMonth) return;
        const targetMonthData = data.months[monthKey];
        if (!targetMonthData) return;
        
        const hasRelated = targetMonthData.expenses.some(e => e.baseExpenseId === baseId);
        if (hasRelated) {
          updateMonthData(monthKey, {
            ...targetMonthData,
            expenses: targetMonthData.expenses.filter(e => e.baseExpenseId !== baseId),
          });
        }
      });
    } else {
      // This is a linked expense, find and delete all linked ones
      const baseId = expense.baseExpenseId;
      
      Object.keys(data.months).forEach(monthKey => {
        const targetMonthData = data.months[monthKey];
        if (!targetMonthData) return;
        
        const hasRelated = targetMonthData.expenses.some(e => e.id === baseId || e.baseExpenseId === baseId);
        if (hasRelated) {
          updateMonthData(monthKey, {
            ...targetMonthData,
            expenses: targetMonthData.expenses.filter(e => e.id !== baseId && e.baseExpenseId !== baseId),
          });
        }
      });
    }
  }, [currentMonth, data.months, getMonthData, updateMonthData]);

  const reorderExpenses = useCallback((expenses: Expense[]) => {
    const monthData = getMonthData(currentMonth);
    updateMonthData(currentMonth, {
      ...monthData,
      expenses,
    });
  }, [currentMonth, getMonthData, updateMonthData]);

  // Credit Card operations (now global)
  const addCreditCard = useCallback((card: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = {
      ...card,
      id: crypto.randomUUID(),
    };
    setData(prev => ({
      ...prev,
      creditCards: [...prev.creditCards, newCard],
    }));
  }, []);

  const updateCreditCard = useCallback((id: string, updates: Partial<CreditCard>) => {
    setData(prev => ({
      ...prev,
      creditCards: prev.creditCards.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const deleteCreditCard = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      creditCards: prev.creditCards.filter(c => c.id !== id),
    }));
  }, []);

  const getCreditCardTotal = useCallback((cardName: string): number => {
    const monthData = getMonthData(currentMonth);
    return monthData.expenses
      .filter(e => e.paymentMethod === cardName)
      .reduce((sum, e) => sum + e.value, 0);
  }, [currentMonth, getMonthData]);

  const canDeleteCard = useCallback((cardName: string): boolean => {
    // Check all months for expenses linked to this card
    for (const monthKey of Object.keys(data.months)) {
      const monthData = data.months[monthKey];
      if (monthData.expenses.some(e => e.paymentMethod === cardName)) {
        return false;
      }
    }
    return true;
  }, [data.months]);

  const cardNameExists = useCallback((name: string, excludeId?: string): boolean => {
    return data.creditCards.some(c => 
      c.name.toLowerCase() === name.toLowerCase() && c.id !== excludeId
    );
  }, [data.creditCards]);

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

  // Investment tags management
  const addInvestmentTag = useCallback((tag: string) => {
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        investmentTags: [...prev.settings.investmentTags, tag],
      },
    }));
  }, []);

  const updateInvestmentTag = useCallback((oldTag: string, newTag: string) => {
    setData(prev => {
      // Update settings
      const newSettings = {
        ...prev.settings,
        investmentTags: prev.settings.investmentTags.map(t => t === oldTag ? newTag : t),
      };
      
      // Update all investments with this tag
      const newMonths = { ...prev.months };
      Object.keys(newMonths).forEach(monthKey => {
        const month = newMonths[monthKey];
        if (month.investments.some(i => i.tag === oldTag)) {
          newMonths[monthKey] = {
            ...month,
            investments: month.investments.map(i => 
              i.tag === oldTag ? { ...i, tag: newTag } : i
            ),
          };
        }
      });
      
      return {
        ...prev,
        settings: newSettings,
        months: newMonths,
      };
    });
  }, []);

  const deleteInvestmentTag = useCallback((tag: string) => {
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        investmentTags: prev.settings.investmentTags.filter(t => t !== tag),
      },
    }));
  }, []);

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
    creditCards: data.creditCards,
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
    getMonthData,
  };
};