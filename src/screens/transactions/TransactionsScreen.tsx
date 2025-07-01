import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useFinanceStore } from '../../store/useFinanceStore';
import { Transaction, RootStackParamList, TransactionType } from '../../types';
import { formatCurrency, formatDate, getCategoryName, getCategoryIcon, getCategoryColor, sortByDate } from '../../utils/helpers';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onPress: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  onEdit, 
  onDelete,
  onPress 
}) => {
  const categoryColor = getCategoryColor(transaction.category);
  const categoryIcon = getCategoryIcon(transaction.category);
  const isIncome = transaction.type === 'income';

  return (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => onPress(transaction)}
      onLongPress={() => {
        Alert.alert(
          'Opções',
          'O que deseja fazer com esta transação?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Editar', onPress: () => onEdit(transaction) },
            { text: 'Excluir', style: 'destructive', onPress: () => onDelete(transaction) },
          ]
        );
      }}
    >
      <View style={styles.transactionLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]}>
          <Ionicons name={categoryIcon as any} size={20} color="white" />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.categoryName}>
            {getCategoryName(transaction.category)}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(transaction.date)}
          </Text>
          {transaction.description && (
            <Text style={styles.transactionDescription} numberOfLines={1}>
              {transaction.description}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: isIncome ? '#4CAF50' : '#F44336' }
        ]}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        {transaction.currency !== 'USD' && (
          <Text style={styles.usdAmount}>
            {formatCurrency(transaction.amountInUSD, 'USD')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const {
    transactions,
    deleteTransaction,
    isLoading,
  } = useFinanceStore();

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    if (filter !== 'all') {
      filtered = transactions.filter(t => t.type === filter);
    }
    
    return sortByDate(filtered, 'desc');
  }, [transactions, filter]);

  const handleAddTransaction = () => {
    navigation.navigate('AddTransaction', {});
  };

  const handleEditTransaction = (transaction: Transaction) => {
    navigation.navigate('AddTransaction', { editTransaction: transaction });
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteTransaction(transaction.id),
        },
      ]
    );
  };

  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate('TransactionDetails', { transactionId: transaction.id });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simular refresh - em um app real, aqui você recarregaria os dados
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amountInUSD, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amountInUSD, 0);
  }, [transactions]);

  const balance = totalIncome - totalExpenses;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Total</Text>
        <Text style={[
          styles.balanceAmount,
          { color: balance >= 0 ? '#4CAF50' : '#F44336' }
        ]}>
          {formatCurrency(balance, 'USD')}
        </Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Receitas</Text>
            <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
              +{formatCurrency(totalIncome, 'USD')}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Despesas</Text>
            <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
              -{formatCurrency(totalExpenses, 'USD')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'income' && styles.activeFilter]}
          onPress={() => setFilter('income')}
        >
          <Text style={[styles.filterText, filter === 'income' && styles.activeFilterText]}>
            Receitas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'expense' && styles.activeFilter]}
          onPress={() => setFilter('expense')}
        >
          <Text style={[styles.filterText, filter === 'expense' && styles.activeFilterText]}>
            Despesas
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Nenhuma transação encontrada</Text>
      <Text style={styles.emptySubtitle}>
        Adicione sua primeira transação para começar a acompanhar suas finanças
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddTransaction}>
        <Text style={styles.emptyButtonText}>Adicionar Transação</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Transações</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onPress={handleTransactionPress}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          filteredTransactions.length === 0 ? styles.emptyContainer : undefined
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screenHeader: {
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
  header: {
    padding: 20,
  },
  balanceCard: {
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
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#999',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  usdAmount: {
    fontSize: 12,
    color: '#999',
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

export default TransactionsScreen;
