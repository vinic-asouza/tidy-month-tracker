import { getDataProvider } from './provider';
import * as apiAccountBalances from './api/accountBalances';
import * as supabaseAccountBalances from './supabase/accountBalances';
import * as apiAccounts from './api/accounts';
import * as supabaseAccounts from './supabase/accounts';
import * as apiCreditCards from './api/creditCards';
import * as supabaseCreditCards from './supabase/creditCards';
import * as apiIncomes from './api/incomes';
import * as supabaseIncomes from './supabase/incomes';
import * as apiExpenses from './api/expenses';
import * as supabaseExpenses from './supabase/expenses';
import * as apiInvestments from './api/investments';
import * as supabaseInvestments from './supabase/investments';
import * as apiSettings from './api/settings';
import * as supabaseSettings from './supabase/settings';
import * as apiFinancialRule from './api/financialRule';
import * as supabaseFinancialRule from './supabase/financialRule';
import * as apiWishItems from './api/wishItems';
import * as supabaseWishItems from './supabase/wishItems';

const isSupabase = () => getDataProvider() === 'supabase';

export const accountBalancesAdapter = () =>
  isSupabase() ? supabaseAccountBalances : apiAccountBalances;

export const accountsAdapter = () =>
  isSupabase() ? supabaseAccounts : apiAccounts;

export const creditCardsAdapter = () =>
  isSupabase() ? supabaseCreditCards : apiCreditCards;

export const incomesAdapter = () => (isSupabase() ? supabaseIncomes : apiIncomes);

export const expensesAdapter = () => (isSupabase() ? supabaseExpenses : apiExpenses);

export const investmentsAdapter = () =>
  isSupabase() ? supabaseInvestments : apiInvestments;

export const settingsAdapter = () => (isSupabase() ? supabaseSettings : apiSettings);

export const financialRuleAdapter = () =>
  isSupabase() ? supabaseFinancialRule : apiFinancialRule;

export const wishItemsAdapter = () =>
  isSupabase() ? supabaseWishItems : apiWishItems;
