import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useFinanceStore } from '../../store/useFinanceStore';
import { RootStackParamList } from '../../types';
import {
  formatCurrency,
  formatDate,
  getCategoryName,
  getCategoryIcon,
  getCategoryColor,
} from '../../utils/helpers';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteParams = RouteProp<RootStackParamList, 'TransactionDetails'>;

const TransactionDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { transactionId } = route.params;

  const { transactions, deleteTransaction } = useFinanceStore();
  
  const transaction = transactions.find(t => t.id === transactionId);

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Transação não encontrada</Text>
          <Text style={styles.errorSubtitle}>
            Esta transação pode ter sido excluída
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = getCategoryColor(transaction.category);
  const categoryIcon = getCategoryIcon(transaction.category);
  const isIncome = transaction.type === 'income';

  const handleEdit = () => {
    navigation.navigate('AddTransaction', { editTransaction: transaction });
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(transaction.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]}>
            <Ionicons name={categoryIcon as any} size={32} color="white" />
          </View>
          
          <Text style={styles.categoryName}>
            {getCategoryName(transaction.category)}
          </Text>
          
          <Text style={[
            styles.amount,
            { color: isIncome ? '#4CAF50' : '#F44336' }
          ]}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
          </Text>
          
          {transaction.currency !== 'USD' && (
            <Text style={styles.usdAmount}>
              {formatCurrency(transaction.amountInUSD, 'USD')} USD
            </Text>
          )}
          
          <View style={[styles.typeBadge, {
            backgroundColor: isIncome ? '#E8F5E8' : '#FFEBEE'
          }]}>
            <Text style={[styles.typeBadgeText, {
              color: isIncome ? '#4CAF50' : '#F44336'
            }]}>
              {isIncome ? 'Receita' : 'Despesa'}
            </Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Detalhes</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.detailLabelText}>Data</Text>
            </View>
            <Text style={styles.detailValue}>
              {formatDate(transaction.date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="card" size={20} color="#666" />
              <Text style={styles.detailLabelText}>Moeda</Text>
            </View>
            <Text style={styles.detailValue}>
              {transaction.currency}
            </Text>
          </View>

          {transaction.currency !== 'USD' && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="swap-horizontal" size={20} color="#666" />
                <Text style={styles.detailLabelText}>Taxa de Câmbio</Text>
              </View>
              <Text style={styles.detailValue}>
                1 {transaction.currency} = {(transaction.amountInUSD / transaction.amount).toFixed(4)} USD
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.detailLabelText}>Criado em</Text>
            </View>
            <Text style={styles.detailValue}>
              {formatDate(transaction.createdAt)}
            </Text>
          </View>

          {transaction.updatedAt !== transaction.createdAt && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="create" size={20} color="#666" />
                <Text style={styles.detailLabelText}>Atualizado em</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatDate(transaction.updatedAt)}
              </Text>
            </View>
          )}

          {transaction.description && (
            <>
              <View style={styles.separator} />
              <View style={styles.descriptionSection}>
                <View style={styles.detailLabel}>
                  <Ionicons name="document-text" size={20} color="#666" />
                  <Text style={styles.detailLabelText}>Descrição</Text>
                </View>
                <Text style={styles.descriptionText}>
                  {transaction.description}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>ID da Transação</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {transaction.id}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Valor Original</Text>
              <Text style={styles.statValue}>
                {formatCurrency(transaction.amount, transaction.currency)}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Valor em USD</Text>
              <Text style={styles.statValue}>
                {formatCurrency(transaction.amountInUSD, 'USD')}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Categoria</Text>
              <Text style={styles.statValue}>
                {getCategoryName(transaction.category)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
        >
          <Ionicons name="create" size={20} color="white" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  usdAmount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabelText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    maxWidth: '50%',
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  descriptionSection: {
    paddingTop: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  statsCard: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statItem: {
    width: '50%',
    padding: 8,
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TransactionDetailsScreen;
