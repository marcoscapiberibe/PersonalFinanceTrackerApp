import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl, // Adicione esta importação
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useFinanceStore } from '../../store/useFinanceStore';
import { RootStackParamList, Budget } from '../../types';
import {
  formatCurrency,
  getCurrentMonth,
  getCurrentYear,
  getMonthName,
  getCategoryName,
  getCategoryIcon,
  getCategoryColor,
} from '../../utils/helpers';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface BudgetItemProps {
  budget: Budget;
  spentAmount: number;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

const BudgetItem: React.FC<BudgetItemProps> = ({ 
  budget, 
  spentAmount, 
  onEdit, 
  onDelete 
}) => {
  const categoryColor = getCategoryColor(budget.category);
  const categoryIcon = getCategoryIcon(budget.category);
  const remainingAmount = budget.amount - spentAmount;
  const percentageUsed = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;
  const isOverBudget = spentAmount > budget.amount;

  return (
    <TouchableOpacity
      style={styles.budgetItem}
      onLongPress={() => {
        Alert.alert(
          'Opções',
          'O que deseja fazer com este orçamento?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Editar', onPress: () => onEdit(budget) },
            { text: 'Excluir', style: 'destructive', onPress: () => onDelete(budget) },
          ]
        );
      }}
    >
      <View style={styles.budgetHeader}>
        <View style={styles.budgetInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]}>
            <Ionicons name={categoryIcon as any} size={20} color="white" />
          </View>
          <View style={styles.budgetDetails}>
            <Text style={styles.categoryName}>
              {getCategoryName(budget.category)}
            </Text>
            <Text style={styles.budgetPeriod}>
              {getMonthName(budget.month)} {budget.year}
            </Text>
          </View>
        </View>
        
        <View style={styles.budgetAmounts}>
          <Text style={styles.budgetLimit}>
            {formatCurrency(budget.originalAmount, budget.currency)}
          </Text>
          {budget.currency !== 'USD' && (
            <Text style={styles.budgetLimitUSD}>
              {formatCurrency(budget.amount, 'USD')} USD
            </Text>
          )}
        </View>
      </View>

      <View style={styles.budgetProgress}>
        <View style={styles.progressTrack}>
          <View style={[
            styles.progressFill,
            {
              width: `${Math.min(percentageUsed, 100)}%`,
              backgroundColor: isOverBudget ? '#F44336' : 
                percentageUsed > 80 ? '#FF9800' : '#4CAF50',
            }
          ]} />
        </View>
      </View>

      <View style={styles.budgetSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Gasto</Text>
          <Text style={[
            styles.summaryValue,
            { color: spentAmount > 0 ? '#F44336' : '#666' }
          ]}>
            {formatCurrency(spentAmount, 'USD')}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>
            {isOverBudget ? 'Excedeu' : 'Restante'}
          </Text>
          <Text style={[
            styles.summaryValue,
            { color: isOverBudget ? '#F44336' : '#4CAF50' }
          ]}>
            {formatCurrency(Math.abs(remainingAmount), 'USD')}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Usado</Text>
          <Text style={[
            styles.summaryValue,
            { color: isOverBudget ? '#F44336' : '#666' }
          ]}>
            {percentageUsed.toFixed(0)}%
          </Text>
        </View>
      </View>

      {isOverBudget && (
        <View style={styles.overBudgetWarning}>
          <Ionicons name="warning" size={16} color="#F44336" />
          <Text style={styles.overBudgetText}>
            Orçamento excedido em {formatCurrency(Math.abs(remainingAmount), 'USD')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Chave para forçar re-renderização

  const {
    budgets,
    deleteBudget,
    getBudgetStatus,
    getTransactionsByMonth,
  } = useFinanceStore();

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

  const monthlyBudgets = useMemo(() => {
    return budgets.filter(
      budget => budget.month === selectedMonth && budget.year === selectedYear
    );
  }, [budgets, selectedMonth, selectedYear, refreshKey]); // Adiciona refreshKey

  const budgetStatusMap = useMemo(() => {
    const statusList = getBudgetStatus(selectedMonth, selectedYear);
    const map = new Map();
    statusList.forEach(status => {
      map.set(status.category, status.spentAmount);
    });
    return map;
  }, [getBudgetStatus, selectedMonth, selectedYear, refreshKey]); // Adiciona refreshKey

  const transactions = useMemo(() => {
    return getTransactionsByMonth(selectedMonth, selectedYear);
  }, [getTransactionsByMonth, selectedMonth, selectedYear, refreshKey]); // Adiciona refreshKey

  const totalBudget = useMemo(() => {
    return monthlyBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  }, [monthlyBudgets]);

  const totalSpent = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amountInUSD, 0);
  }, [transactions]);

  const handleAddBudget = () => {
    navigation.navigate('AddBudget', {});
  };

  const handleEditBudget = (budget: Budget) => {
    navigation.navigate('AddBudget', { editBudget: budget });
  };

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este orçamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteBudget(budget.id),
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={styles.periodButton}
          onPress={() => {
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

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumo do Orçamento</Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>Total Orçado</Text>
            <Text style={[styles.summaryAmount, { color: '#007AFF' }]}>
              {formatCurrency(totalBudget, 'USD')}
            </Text>
          </View>
          
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>Total Gasto</Text>
            <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
              {formatCurrency(totalSpent, 'USD')}
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryProgress}>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              {
                width: totalBudget > 0 ? `${Math.min((totalSpent / totalBudget) * 100, 100)}%` : '0%',
                backgroundColor: totalSpent > totalBudget ? '#F44336' : 
                  (totalSpent / totalBudget) > 0.8 ? '#FF9800' : '#4CAF50',
              }
            ]} />
          </View>
        </View>
        
        <Text style={[
          styles.remainingAmount,
          { color: totalSpent > totalBudget ? '#F44336' : '#4CAF50' }
        ]}>
          {totalSpent > totalBudget ? 'Excedeu' : 'Restante'}: {formatCurrency(Math.abs(totalBudget - totalSpent), 'USD')}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="wallet-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Nenhum orçamento definido</Text>
      <Text style={styles.emptySubtitle}>
        Configure orçamentos mensais para cada categoria e mantenha suas finanças sob controle
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddBudget}>
        <Text style={styles.emptyButtonText}>Criar Primeiro Orçamento</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Orçamentos</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddBudget}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={monthlyBudgets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BudgetItem
            budget={item}
            spentAmount={budgetStatusMap.get(item.category) || 0}
            onEdit={handleEditBudget}
            onDelete={handleDeleteBudget}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          monthlyBudgets.length === 0 ? styles.emptyContainer : undefined
        }
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
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryProgress: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  budgetItem: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetInfo: {
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
  budgetDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  budgetPeriod: {
    fontSize: 14,
    color: '#666',
  },
  budgetAmounts: {
    alignItems: 'flex-end',
  },
  budgetLimit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  budgetLimitUSD: {
    fontSize: 12,
    color: '#999',
  },
  budgetProgress: {
    marginBottom: 12,
  },
  budgetSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  overBudgetWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
  },
  overBudgetText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BudgetScreen;