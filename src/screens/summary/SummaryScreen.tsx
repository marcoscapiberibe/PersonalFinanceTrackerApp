import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl, // Adicione esta importação
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useFinanceStore } from '../../store/useFinanceStore';
import {
  formatCurrency,
  getCurrentMonth,
  getCurrentYear,
  getMonthName,
  getCategoryConfig,
  getCategoryColor,
  getCategoryName,
} from '../../utils/helpers';
import { TransactionCategory } from '../../types';

const { width } = Dimensions.get('window');

interface CategorySummary {
  category: TransactionCategory;
  income: number;
  expenses: number;
  total: number;
  transactionCount: number;
}

const SummaryScreen: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Chave para forçar re-renderização

  const { getMonthlyStats, getTransactionsByMonth } = useFinanceStore();

  // Função simples para atualizar tudo
  const onRefresh = () => {
    setRefreshing(true);
    
    // Força uma re-renderização completa
    setRefreshKey(prev => prev + 1);
    
    // Simula um pequeno delay para dar feedback visual
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const monthlyStats = useMemo(() => {
    return getMonthlyStats(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, getMonthlyStats, refreshKey]); // Adiciona refreshKey

  const transactions = useMemo(() => {
    return getTransactionsByMonth(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, getTransactionsByMonth, refreshKey]); // Adiciona refreshKey

  const categorySummary = useMemo(() => {
    const summary = new Map<TransactionCategory, CategorySummary>();
    
    transactions.forEach(transaction => {
      const existing = summary.get(transaction.category) || {
        category: transaction.category,
        income: 0,
        expenses: 0,
        total: 0,
        transactionCount: 0,
      };
      
      if (transaction.type === 'income') {
        existing.income += transaction.amountInUSD;
        existing.total += transaction.amountInUSD;
      } else {
        existing.expenses += transaction.amountInUSD;
        existing.total -= transaction.amountInUSD;
      }
      
      existing.transactionCount++;
      summary.set(transaction.category, existing);
    });
    
    return Array.from(summary.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }, [transactions]);

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1),
  }));

  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: getCurrentYear() - 2 + i,
    label: (getCurrentYear() - 2 + i).toString(),
  }));

  const renderBalanceCard = () => (
    <View style={styles.balanceCard}>
      <Text style={styles.balanceLabel}>Saldo do Mês</Text>
      <Text style={[
        styles.balanceAmount,
        { color: monthlyStats.balance >= 0 ? '#4CAF50' : '#F44336' }
      ]}>
        {formatCurrency(monthlyStats.balance, 'USD')}
      </Text>
      
      <View style={styles.balanceBreakdown}>
        <View style={styles.balanceItem}>
          <View style={[styles.balanceIndicator, { backgroundColor: '#4CAF50' }]} />
          <View>
            <Text style={styles.balanceItemLabel}>Receitas</Text>
            <Text style={[styles.balanceItemAmount, { color: '#4CAF50' }]}>
              +{formatCurrency(monthlyStats.totalIncome, 'USD')}
            </Text>
          </View>
        </View>
        
        <View style={styles.balanceItem}>
          <View style={[styles.balanceIndicator, { backgroundColor: '#F44336' }]} />
          <View>
            <Text style={styles.balanceItemLabel}>Despesas</Text>
            <Text style={[styles.balanceItemAmount, { color: '#F44336' }]}>
              -{formatCurrency(monthlyStats.totalExpenses, 'USD')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderBudgetStatus = () => {
    if (monthlyStats.budgetStatus.length === 0) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status do Orçamento</Text>
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum orçamento definido</Text>
            <Text style={styles.emptySubtext}>
              Configure orçamentos para acompanhar seus gastos
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status do Orçamento</Text>
        {monthlyStats.budgetStatus.map((budget) => {
          const categoryConfig = getCategoryConfig()[budget.category];
          const percentage = budget.percentageUsed;
          const isOverBudget = budget.isOverBudget;
          
          return (
            <View key={budget.category} style={styles.budgetItem}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetInfo}>
                  <View style={[
                    styles.budgetIcon,
                    { backgroundColor: categoryConfig.color }
                  ]}>
                    <Ionicons
                      name={categoryConfig.icon as any}
                      size={16}
                      color="white"
                    />
                  </View>
                  <Text style={styles.budgetCategory}>
                    {getCategoryName(budget.category)}
                  </Text>
                </View>
                <Text style={[
                  styles.budgetPercentage,
                  { color: isOverBudget ? '#F44336' : '#666' }
                ]}>
                  {percentage.toFixed(0)}%
                </Text>
              </View>
              
              <View style={styles.budgetProgress}>
                <View style={styles.budgetProgressTrack}>
                  <View style={[
                    styles.budgetProgressFill,
                    {
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: isOverBudget ? '#F44336' : 
                        percentage > 80 ? '#FF9800' : '#4CAF50',
                    }
                  ]} />
                </View>
              </View>
              
              <View style={styles.budgetAmounts}>
                <Text style={styles.budgetSpent}>
                  Gasto: {formatCurrency(budget.spentAmount, 'USD')}
                </Text>
                <Text style={[
                  styles.budgetRemaining,
                  { color: isOverBudget ? '#F44336' : '#4CAF50' }
                ]}>
                  {isOverBudget ? 'Excedeu' : 'Restante'}: {formatCurrency(Math.abs(budget.remainingAmount), 'USD')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderCategorySummary = () => {
    if (categorySummary.length === 0) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo por Categoria</Text>
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma transação</Text>
            <Text style={styles.emptySubtext}>
              Adicione transações para ver o resumo por categoria
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo por Categoria</Text>
        {categorySummary.map((item) => {
          const categoryConfig = getCategoryConfig()[item.category];
          const isPositive = item.total >= 0;
          
          return (
            <View key={item.category} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View style={[
                  styles.categoryIcon,
                  { backgroundColor: categoryConfig.color }
                ]}>
                  <Ionicons
                    name={categoryConfig.icon as any}
                    size={20}
                    color="white"
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>
                    {getCategoryName(item.category)}
                  </Text>
                  <Text style={styles.categoryCount}>
                    {item.transactionCount} transação{item.transactionCount !== 1 ? 'ões' : ''}
                  </Text>
                </View>
              </View>
              
              <View style={styles.categoryRight}>
                <Text style={[
                  styles.categoryTotal,
                  { color: isPositive ? '#4CAF50' : '#F44336' }
                ]}>
                  {isPositive ? '+' : ''}{formatCurrency(item.total, 'USD')}
                </Text>
                {item.income > 0 && item.expenses > 0 && (
                  <Text style={styles.categoryBreakdown}>
                    +{formatCurrency(item.income, 'USD')} / -{formatCurrency(item.expenses, 'USD')}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resumo Financeiro</Text>
        
        {/* Month/Year Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={styles.periodButton}
            onPress={() => {
              // Implementar seletor de mês/ano
              if (selectedMonth > 1) {
                setSelectedMonth(selectedMonth - 1);
              } else {
                setSelectedMonth(12);
                setSelectedYear(selectedYear - 1);
              }
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.periodText}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
          
          <TouchableOpacity
            style={styles.periodButton}
            onPress={() => {
              // Implementar seletor de mês/ano
              if (selectedMonth < 12) {
                setSelectedMonth(selectedMonth + 1);
              } else {
                setSelectedMonth(1);
                setSelectedYear(selectedYear + 1);
              }
            }}
          >
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        // Adicione o RefreshControl aqui
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']} // Android
            tintColor="#007AFF" // iOS
            title="Atualizando dados..." // iOS
            titleColor="#007AFF" // iOS
          />
        }
      >
        {renderBalanceCard()}
        {renderBudgetStatus()}
        {renderCategorySummary()}
        
        {/* Statistics Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estatísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{transactions.length}</Text>
              <Text style={styles.statLabel}>Transações</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {transactions.filter(t => t.type === 'income').length}
              </Text>
              <Text style={styles.statLabel}>Receitas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {transactions.filter(t => t.type === 'expense').length}
              </Text>
              <Text style={styles.statLabel}>Despesas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {monthlyStats.budgetStatus.filter(b => b.isOverBudget).length}
              </Text>
              <Text style={styles.statLabel}>Orçamentos Excedidos</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SummaryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButton: {
    padding: 8,
  },
  periodText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  balanceItemLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  balanceItemAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  budgetItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  budgetPercentage: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetProgress: {
    marginBottom: 8,
  },
  budgetProgressTrack: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    fontSize: 14,
    color: '#666',
  },
  budgetRemaining: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryTotal: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryBreakdown: {
    fontSize: 12,
    color: '#999',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statItem: {
    width: '50%',
    padding: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});