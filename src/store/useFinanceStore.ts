import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Transaction, 
  Budget, 
  Currency, 
  TransactionType, 
  TransactionCategory, 
  MonthlyStats, 
  BudgetStatus,
  ExchangeRate 
} from '../types';
import { generateId, getCurrentMonth, getCurrentYear } from '../utils/helpers';

interface FinanceState {
  // Data
  transactions: Transaction[];
  budgets: Budget[];
  exchangeRates: Record<string, ExchangeRate>;
  baseCurrency: Currency;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions - Transactions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionsByMonth: (month: number, year: number) => Transaction[];
  getTransactionsByCategory: (category: TransactionCategory) => Transaction[];
  
  // Actions - Budgets
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetByCategory: (category: TransactionCategory, month: number, year: number) => Budget | undefined;
  
  // Actions - Exchange Rates
  updateExchangeRates: (rates: Record<string, ExchangeRate>) => void;
  getExchangeRate: (from: Currency, to: Currency) => number;
  
  // Actions - Statistics
  getMonthlyStats: (month: number, year: number) => MonthlyStats;
  getBudgetStatus: (month: number, year: number) => BudgetStatus[];
  
  // Actions - Settings
  setBaseCurrency: (currency: Currency) => void;
  
  // Actions - UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Actions - Data Management
  clearAllData: () => void;
  exportData: () => { transactions: Transaction[]; budgets: Budget[] };
  importData: (data: { transactions: Transaction[]; budgets: Budget[] }) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      // Initial State
      transactions: [],
      budgets: [],
      exchangeRates: {},
      baseCurrency: 'USD',
      isLoading: false,
      error: null,

      // Transaction Actions
      addTransaction: (transactionData) => {
        const now = new Date().toISOString();
        const transaction: Transaction = {
          ...transactionData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          transactions: [...state.transactions, transaction],
        }));
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === id
              ? { ...transaction, ...updates, updatedAt: new Date().toISOString() }
              : transaction
          ),
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        }));
      },

      getTransactionsByMonth: (month, year) => {
        const { transactions } = get();
        return transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          return (
            transactionDate.getMonth() + 1 === month &&
            transactionDate.getFullYear() === year
          );
        });
      },

      getTransactionsByCategory: (category) => {
        const { transactions } = get();
        return transactions.filter((transaction) => transaction.category === category);
      },

      // Budget Actions
      addBudget: (budgetData) => {
        const now = new Date().toISOString();
        const budget: Budget = {
          ...budgetData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          budgets: [...state.budgets, budget],
        }));
      },

      updateBudget: (id, updates) => {
        set((state) => ({
          budgets: state.budgets.map((budget) =>
            budget.id === id
              ? { ...budget, ...updates, updatedAt: new Date().toISOString() }
              : budget
          ),
        }));
      },

      deleteBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((budget) => budget.id !== id),
        }));
      },

      getBudgetByCategory: (category, month, year) => {
        const { budgets } = get();
        return budgets.find((budget) => 
          budget.category === category && 
          budget.month === month && 
          budget.year === year
        );
      },

      // Exchange Rate Actions
      updateExchangeRates: (rates) => {
        set((state) => ({
          exchangeRates: { ...state.exchangeRates, ...rates },
        }));
      },

      getExchangeRate: (from, to) => {
        if (from === to) return 1;
        
        const { exchangeRates } = get();
        const rateKey = `${from}-${to}`;
        const reverseRateKey = `${to}-${from}`;
        
        if (exchangeRates[rateKey]) {
          return exchangeRates[rateKey].rate;
        } else if (exchangeRates[reverseRateKey]) {
          return 1 / exchangeRates[reverseRateKey].rate;
        }
        
        return 1; // Fallback
      },

      // Statistics Actions
      getMonthlyStats: (month, year) => {
        const { getTransactionsByMonth } = get();
        const transactions = getTransactionsByMonth(month, year);
        
        const totalIncome = transactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amountInUSD, 0);
          
        const totalExpenses = transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amountInUSD, 0);
          
        const balance = totalIncome - totalExpenses;
        
        const budgetStatus = get().getBudgetStatus(month, year);
        
        return {
          month,
          year,
          totalIncome,
          totalExpenses,
          balance,
          budgetStatus,
        };
      },

      getBudgetStatus: (month, year) => {
        const { budgets, getTransactionsByMonth } = get();
        const monthlyTransactions = getTransactionsByMonth(month, year);
        const monthlyBudgets = budgets.filter((b) => b.month === month && b.year === year);
        
        return monthlyBudgets.map((budget) => {
          const categoryExpenses = monthlyTransactions
            .filter((t) => t.type === 'expense' && t.category === budget.category)
            .reduce((sum, t) => sum + t.amountInUSD, 0);
            
          const remainingAmount = budget.amount - categoryExpenses;
          const percentageUsed = budget.amount > 0 ? (categoryExpenses / budget.amount) * 100 : 0;
          const isOverBudget = categoryExpenses > budget.amount;
          
          return {
            category: budget.category,
            budgetAmount: budget.amount,
            spentAmount: categoryExpenses,
            remainingAmount,
            percentageUsed,
            isOverBudget,
          };
        });
      },

      // Settings Actions
      setBaseCurrency: (currency) => {
        set({ baseCurrency: currency });
      },

      // UI Actions
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Data Management Actions
      clearAllData: () => {
        set({
          transactions: [],
          budgets: [],
          exchangeRates: {},
          error: null,
        });
      },

      exportData: () => {
        const { transactions, budgets } = get();
        return { transactions, budgets };
      },

      importData: (data) => {
        set({
          transactions: data.transactions || [],
          budgets: data.budgets || [],
        });
      },
    }),
    {
      name: 'finance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        budgets: state.budgets,
        exchangeRates: state.exchangeRates,
        baseCurrency: state.baseCurrency,
      }),
    }
  )
);
