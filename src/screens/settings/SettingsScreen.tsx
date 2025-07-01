import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useFinanceStore } from '../../store/useFinanceStore';
import { currencyService } from '../../services/currency/CurrencyService';
import { Currency } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow = true,
}) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={styles.settingsLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={20} color="#007AFF" />
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <View style={styles.settingsRight}>
      {rightElement}
      {showArrow && !rightElement && (
        <Ionicons name="chevron-forward" size={16} color="#666" />
      )}
    </View>
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const {
    baseCurrency,
    setBaseCurrency,
    transactions,
    budgets,
    clearAllData,
    exportData,
    importData,
  } = useFinanceStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const supportedCurrencies = currencyService.getSupportedCurrencies();

  const handleCurrencyChange = () => {
    Alert.alert(
      'Alterar Moeda Base',
      'Escolha a moeda base para exibição dos valores:',
      [
        { text: 'Cancelar', style: 'cancel' },
        ...supportedCurrencies.map((currency) => ({
          text: `${currency.name} (${currency.symbol})`,
          onPress: () => {
            setBaseCurrency(currency.code);
            Alert.alert(
              'Moeda Alterada',
              `Moeda base alterada para ${currency.name}. As conversões serão atualizadas automaticamente.`
            );
          },
        })),
      ]
    );
  };

  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    try {
      await currencyService.refreshRates(baseCurrency);
      Alert.alert('Sucesso', 'Taxas de câmbio atualizadas com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar as taxas de câmbio.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = exportData();
      const jsonData = JSON.stringify(data, null, 2);
      
      await Share.share({
        message: jsonData,
        title: 'Dados Financeiros - Personal Finance Tracker',
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível exportar os dados.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Apagar Todos os Dados',
      'Esta ação irá remover TODAS as transações e orçamentos. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar Tudo',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert('Dados Removidos', 'Todos os dados foram removidos com sucesso.');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Personal Finance Tracker',
      'Versão 1.0.0\n\nDesenvolvido como desafio técnico React Native.\n\nFuncionalidades:\n• Gestão de transações\n• Orçamentos mensais\n• Conversão automática de moedas\n• Relatórios e estatísticas\n\nDesenvolvido com ❤️ usando React Native + TypeScript',
      [{ text: 'OK' }]
    );
  };

  const totalTransactions = transactions.length;
  const totalBudgets = budgets.length;
  const totalBalance = transactions.reduce((sum, t) => 
    sum + (t.type === 'income' ? t.amountInUSD : -t.amountInUSD), 0
  );

  const currentCurrency = supportedCurrencies.find(c => c.code === baseCurrency);
  const ratesUpToDate = currencyService.areRatesUpToDate(baseCurrency);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Resumo da Conta */}
        <View style={styles.accountSummary}>
          <Text style={styles.sectionTitle}>Resumo da Conta</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalTransactions}</Text>
              <Text style={styles.summaryLabel}>Transações</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalBudgets}</Text>
              <Text style={styles.summaryLabel}>Orçamentos</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[
                styles.summaryValue,
                { color: totalBalance >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {formatCurrency(totalBalance, 'USD')}
              </Text>
              <Text style={styles.summaryLabel}>Saldo Total</Text>
            </View>
          </View>
        </View>

        {/* Configurações de Moeda */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moeda e Câmbio</Text>
          
          <SettingsItem
            icon="card"
            title="Moeda Base"
            subtitle={currentCurrency ? `${currentCurrency.name} (${currentCurrency.symbol})` : baseCurrency}
            onPress={handleCurrencyChange}
          />
          
          <SettingsItem
            icon="refresh"
            title="Atualizar Taxas de Câmbio"
            subtitle={ratesUpToDate ? 'Taxas atualizadas' : 'Taxas podem estar desatualizadas'}
            onPress={handleRefreshRates}
            rightElement={isRefreshing ? (
              <View style={styles.refreshing}>
                <Text style={styles.refreshingText}>Atualizando...</Text>
              </View>
            ) : undefined}
          />
        </View>

        {/* Dados e Backup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados e Backup</Text>
          
          <SettingsItem
            icon="download"
            title="Exportar Dados"
            subtitle="Fazer backup das transações e orçamentos"
            onPress={handleExportData}
          />
          
          <SettingsItem
            icon="trash"
            title="Apagar Todos os Dados"
            subtitle="Remove todas as transações e orçamentos"
            onPress={handleClearData}
          />
        </View>

        {/* Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <SettingsItem
            icon="information-circle"
            title="Sobre o App"
            subtitle="Versão, créditos e informações"
            onPress={handleAbout}
          />
          
          <SettingsItem
            icon="help-circle"
            title="Como Usar"
            subtitle="Guia de uso do aplicativo"
            onPress={() => {
              Alert.alert(
                'Como Usar o App',
                '1. Adicione transações na aba "Transações"\n\n2. Configure orçamentos mensais na aba "Orçamentos"\n\n3. Acompanhe seu progresso na aba "Resumo"\n\n4. Todas as moedas são convertidas automaticamente\n\n5. Toque e segure itens para mais opções',
                [{ text: 'Entendi' }]
              );
            }}
          />
        </View>

        {/* Estatísticas do Sistema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas do Sistema</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total de Receitas:</Text>
              <Text style={styles.statValue}>
                {transactions.filter(t => t.type === 'income').length}
              </Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total de Despesas:</Text>
              <Text style={styles.statValue}>
                {transactions.filter(t => t.type === 'expense').length}
              </Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Orçamentos Ativos:</Text>
              <Text style={styles.statValue}>
                {budgets.filter(b => 
                  b.month === new Date().getMonth() + 1 && 
                  b.year === new Date().getFullYear()
                ).length}
              </Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cache de Câmbio:</Text>
              <Text style={styles.statValue}>
                {ratesUpToDate ? 'Atualizado' : 'Expirado'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  accountSummary: {
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
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshing: {
    marginRight: 8,
  },
  refreshingText: {
    fontSize: 14,
    color: '#007AFF',
  },
  statsContainer: {
    padding: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default SettingsScreen;
