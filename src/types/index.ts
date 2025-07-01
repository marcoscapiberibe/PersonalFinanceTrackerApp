// src/types/index.ts

export type Currency = 'USD' | 'EUR' | 'BRL' | 'GBP' | 'JPY';

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
    | 'salary'
    | 'freelance'
    | 'investment'
    | 'food'
    | 'transport'
    | 'entertainment'
    | 'health'
    | 'education'
    | 'shopping'
    | 'bills'
    | 'rent'
    | 'other';

export interface Transaction {
    id: string;
    type: TransactionType;
    category: TransactionCategory;
    amount: number;
    currency: Currency;
    amountInUSD: number;
    date: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Budget {
    id: string;
    category: TransactionCategory;
    amount: number;
    currency: Currency;
    originalAmount: number;
    month: number;
    year: number;
    createdAt: string;
    updatedAt: string;
}

export interface MonthlyStats {
    month: number;
    year: number;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    budgetStatus: BudgetStatus[];
}

export interface BudgetStatus {
    category: TransactionCategory;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentageUsed: number;
    isOverBudget: boolean;
}

export interface ExchangeRate {
    base: Currency;
    target: Currency;
    rate: number;
    timestamp: number;
}

export interface ExchangeRatesResponse {
    success: boolean;
    timestamp: number;
    base: string;
    date: string;
    rates: Record<string, number>;
}

// Estados da aplicação
export interface AppState {
    transactions: Transaction[];
    budgets: Budget[];
    exchangeRates: Record<string, ExchangeRate>;
    baseCurrency: Currency;
    isLoading: boolean;
    error: string | null;
}

// Navigation types
export type RootStackParamList = {
    Splash: undefined;
    MainTabs: undefined;
    AddTransaction: { editTransaction?: Transaction };
    AddBudget: { editBudget?: Budget };
    TransactionDetails: { transactionId: string };
};

export type MainTabParamList = {
    Transactions: undefined;
    Summary: undefined;
    Budget: undefined;
    Settings: undefined;
};

// Form types
export interface TransactionFormData {
    type: TransactionType;
    category: TransactionCategory;
    amount: string;
    currency: Currency;
    date: Date;
    description: string;
}

export interface BudgetFormData {
    category: TransactionCategory;
    amount: string;
    currency: Currency;
    month: number;
    year: number;
}

// API types
export interface ApiError {
    message: string;
    code?: string;
    details?: any;
}

export interface LoadingState {
    isLoading: boolean;
    error: string | null;
}

// Utility types
export interface CategoryConfig {
    name: string;
    icon: string;
    color: string;
    isIncomeCategory: boolean;
}

export type SortOrder = 'asc' | 'desc';
export type SortBy = 'date' | 'amount' | 'category';

export interface TransactionFilters {
    type?: TransactionType;
    category?: TransactionCategory;
    dateFrom?: string;
    dateTo?: string;
    sortBy: SortBy;
    sortOrder: SortOrder;
}
