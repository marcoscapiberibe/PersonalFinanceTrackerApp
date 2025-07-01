import { TransactionCategory, Currency, CategoryConfig } from '../types';

// ID Generation
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Date Helpers
export const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1;
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getMonthName = (month: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1] || '';
};

export const getMonthYearString = (month: number, year: number): string => {
  return `${getMonthName(month)} ${year}`;
};

// Currency Helpers
export const formatCurrency = (amount: number, currency: Currency = 'USD'): string => {
  const currencySymbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    BRL: 'R$',
    GBP: '£',
    JPY: '¥',
  };

  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
};

export const getCurrencySymbol = (currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    BRL: 'R$',
    GBP: '£',
    JPY: '¥',
  };
  return symbols[currency] || '$';
};

// Category Helpers
export const getCategoryConfig = (): Record<TransactionCategory, CategoryConfig> => {
  return {
    // Income Categories
    salary: {
      name: 'Salário',
      icon: 'briefcase',
      color: '#4CAF50',
      isIncomeCategory: true,
    },
    freelance: {
      name: 'Freelance',
      icon: 'laptop',
      color: '#2196F3',
      isIncomeCategory: true,
    },
    investment: {
      name: 'Investimento',
      icon: 'trending-up',
      color: '#FF9800',
      isIncomeCategory: true,
    },
    
    // Expense Categories
    food: {
      name: 'Alimentação',
      icon: 'restaurant',
      color: '#FF5722',
      isIncomeCategory: false,
    },
    transport: {
      name: 'Transporte',
      icon: 'car',
      color: '#795548',
      isIncomeCategory: false,
    },
    entertainment: {
      name: 'Entretenimento',
      icon: 'film',
      color: '#E91E63',
      isIncomeCategory: false,
    },
    health: {
      name: 'Saúde',
      icon: 'medical',
      color: '#009688',
      isIncomeCategory: false,
    },
    education: {
      name: 'Educação',
      icon: 'school',
      color: '#3F51B5',
      isIncomeCategory: false,
    },
    shopping: {
      name: 'Compras',
      icon: 'bag',
      color: '#9C27B0',
      isIncomeCategory: false,
    },
    bills: {
      name: 'Contas',
      icon: 'receipt',
      color: '#607D8B',
      isIncomeCategory: false,
    },
    rent: {
      name: 'Aluguel',
      icon: 'home',
      color: '#8BC34A',
      isIncomeCategory: false,
    },
    other: {
      name: 'Outros',
      icon: 'ellipsis-horizontal',
      color: '#9E9E9E',
      isIncomeCategory: false,
    },
  };
};

export const getCategoryName = (category: TransactionCategory): string => {
  return getCategoryConfig()[category].name;
};

export const getCategoryIcon = (category: TransactionCategory): string => {
  return getCategoryConfig()[category].icon;
};

export const getCategoryColor = (category: TransactionCategory): string => {
  return getCategoryConfig()[category].color;
};

export const getIncomeCategories = (): TransactionCategory[] => {
  const config = getCategoryConfig();
  return Object.keys(config).filter(
    (category) => config[category as TransactionCategory].isIncomeCategory
  ) as TransactionCategory[];
};

export const getExpenseCategories = (): TransactionCategory[] => {
  const config = getCategoryConfig();
  return Object.keys(config).filter(
    (category) => !config[category as TransactionCategory].isIncomeCategory
  ) as TransactionCategory[];
};

// Validation Helpers
export const validateAmount = (amount: string): boolean => {
  const numericAmount = parseFloat(amount);
  return !isNaN(numericAmount) && numericAmount > 0;
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const sanitizeAmount = (amount: string): number => {
  // Remove caracteres não numéricos exceto ponto e vírgula
  const cleaned = amount.replace(/[^\d.,]/g, '');
  // Substitui vírgula por ponto para conversão
  const normalized = cleaned.replace(',', '.');
  return parseFloat(normalized) || 0;
};

// Array Helpers
export const sortByDate = <T extends { date: string }>(
  items: T[], 
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

export const groupByMonth = <T extends { date: string }>(items: T[]): Record<string, T[]> => {
  return items.reduce((groups, item) => {
    const date = new Date(item.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    
    return groups;
  }, {} as Record<string, T[]>);
};

// Storage Helpers
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Error Helpers
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Ocorreu um erro inesperado';
};

// Number Helpers
export const roundToTwo = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return roundToTwo((value / total) * 100);
};

// Date Range Helpers
export const isDateInRange = (date: string, startDate?: string, endDate?: string): boolean => {
  const targetDate = new Date(date);
  
  if (startDate && targetDate < new Date(startDate)) {
    return false;
  }
  
  if (endDate && targetDate > new Date(endDate)) {
    return false;
  }
  
  return true;
};

export const getDateRangeForMonth = (month: number, year: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

