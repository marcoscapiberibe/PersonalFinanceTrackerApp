import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useFinanceStore } from '../../store/useFinanceStore';
import { currencyService } from '../../services/currency/CurrencyService';
import {
  RootStackParamList,
  BudgetFormData,
  TransactionCategory,
  Currency,
  Budget,
} from '../../types';
import {
  getCategoryConfig,
  getExpenseCategories,
  validateAmount,
  sanitizeAmount,
  formatCurrency,
  getMonthName,
  getCurrentMonth,
  getCurrentYear,
} from '../../utils/helpers';

type NavigationProp = StackNavigationProp<RootStackParamList, 'AddBudget'>;
type RouteProp_  = RouteProp<RootStackParamList, 'AddBudget'>;

const AddBudgetScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp_>();
  const { editBudget } = route.params || {};

  const { 
    addBudget, 
    updateBudget, 
    baseCurrency, 
    getBudgetByCategory,
    updateExchangeRates 
  } = useFinanceStore();

  // Estado do formulário
  const [formData, setFormData] = useState<BudgetFormData>({
    category: 'food',
    amount: '',
    currency: baseCurrency,
    month: getCurrentMonth(),
    year: getCurrentYear(),
  });

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [conversionInfo, setConversionInfo] = useState<{
    rate: number;
    convertedAmount: number;
    isEstimate: boolean;
  } | null>(null);
  const [errors, setErrors] = useState<{ [K in keyof BudgetFormData]?: string } & { category?: string; amount?: string }>({});

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (editBudget) {
      setFormData({
        category: editBudget.category,
        amount: editBudget.originalAmount.toString(),
        currency: editBudget.currency,
        month: editBudget.month,
        year: editBudget.year,
      });
    }
  }, [editBudget]);

  // Conversão de moeda em tempo real
  useEffect(() => {
    if (formData.amount && formData.currency !== 'USD') {
      handleCurrencyConversion();
    } else {
      setConversionInfo(null);
    }
  }, [formData.amount, formData.currency]);

  const handleCurrencyConversion = useCallback(async () => {
    const amount = sanitizeAmount(formData.amount);
    if (amount <= 0) {
      setConversionInfo(null);
      return;
    }

    try {
      const result = await currencyService.convertCurrency(
        amount,
        formData.currency,
        'USD'
      );
      
      setConversionInfo(result);
    } catch (error) {
      console.error('Erro na conversão:', error);
      setConversionInfo(null);
    }
  }, [formData.amount, formData.currency]);

  const validateForm = (): boolean => {
    const newErrors: { [K in keyof BudgetFormData]?: string } & { category?: string; amount?: string } = {};

    // Validar valor
    if (!formData.amount.trim()) {
      newErrors.amount = 'Valor é obrigatório';
    } else if (!validateAmount(formData.amount)) {
      newErrors.amount = 'Valor deve ser um número positivo';
    }

    // Verificar se já existe orçamento para esta categoria no período (apenas ao criar)
    if (!editBudget) {
      const existingBudget = getBudgetByCategory(
        formData.category,
        formData.month,
        formData.year
      );
      if (existingBudget) {
        newErrors.category = `Já existe orçamento para ${getCategoryConfig()[formData.category].name} em ${getMonthName(formData.month)} ${formData.year}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Erro', 'Por favor, corrija os campos destacados');
      return;
    }

    setIsLoading(true);

    try {
      const originalAmount = sanitizeAmount(formData.amount);
      let amountInUSD = originalAmount;

      // Converter para USD se necessário
      if (formData.currency !== 'USD') {
        const conversion = await currencyService.convertCurrency(
          originalAmount,
          formData.currency,
          'USD'
        );
        amountInUSD = conversion.convertedAmount;

        // Atualizar taxas no store
        const rates = await currencyService.getExchangeRates(formData.currency);
        updateExchangeRates(rates);
      }

      const budgetData = {
        category: formData.category,
        amount: amountInUSD, // Valor em USD
        currency: formData.currency, // Moeda original
        originalAmount, // Valor na moeda original
        month: formData.month,
        year: formData.year,
      };

      if (editBudget) {
        updateBudget(editBudget.id, budgetData);
      } else {
        addBudget(budgetData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      Alert.alert(
        'Erro',
        'Não foi possível salvar o orçamento. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const expenseCategories = getExpenseCategories();
  const categoryConfig = getCategoryConfig();
  const supportedCurrencies = currencyService.getSupportedCurrencies();

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearOptions = Array.from({ length: 3 }, (_, i) => getCurrentYear() + i);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {editBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.saveButton}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Período */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Período</Text>
            <View style={styles.periodContainer}>
              <View style={styles.periodSelector}>
                <Text style={styles.periodLabel}>Mês</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.monthScroll}
                >
                  {monthOptions.map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.monthButton,
                        formData.month === month && styles.monthButtonActive,
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, month }))}
                    >
                      <Text style={[
                        styles.monthButtonText,
                        formData.month === month && styles.monthButtonTextActive,
                      ]}>
                        {getMonthName(month).substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.periodSelector}>
                <Text style={styles.periodLabel}>Ano</Text>
                <View style={styles.yearContainer}>
                  {yearOptions.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearButton,
                        formData.year === year && styles.yearButtonActive,
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, year }))}
                    >
                      <Text style={[
                        styles.yearButtonText,
                        formData.year === year && styles.yearButtonTextActive,
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Valor do Orçamento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valor do Orçamento</Text>
            <View style={styles.amountContainer}>
              <TextInput
                style={[
                  styles.amountInput,
                  errors.amount && styles.inputError,
                ]}
                value={formData.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                placeholder="0,00"
                keyboardType="numeric"
                returnKeyType="done"
              />
              
              {/* Seletor de Moeda */}
              <View style={styles.currencyContainer}>
                {supportedCurrencies.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyButton,
                      formData.currency === currency.code && styles.currencyButtonActive,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, currency: currency.code }))}
                  >
                    <Text style={[
                      styles.currencyText,
                      formData.currency === currency.code && styles.currencyTextActive,
                    ]}>
                      {currency.symbol}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount}</Text>
            )}
            
            {/* Informação de Conversão */}
            {conversionInfo && (
              <View style={styles.conversionInfo}>
                <Text style={styles.conversionText}>
                  {formatCurrency(conversionInfo.convertedAmount, 'USD')} USD
                  {conversionInfo.isEstimate && ' (estimativa)'}
                </Text>
                <Text style={styles.rateText}>
                  Taxa: 1 {formData.currency} = {conversionInfo.rate.toFixed(4)} USD
                </Text>
              </View>
            )}
          </View>

          {/* Categoria */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoria</Text>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
            <View style={styles.categoryGrid}>
              {expenseCategories.map((category) => {
                const config = categoryConfig[category];
                const isSelected = formData.category === category;
                
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      isSelected && { backgroundColor: config.color },
                      errors.category && !isSelected && styles.inputError,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category }))}
                  >
                    <Ionicons
                      name={config.icon as any}
                      size={24}
                      color={isSelected ? 'white' : config.color}
                    />
                    <Text style={[
                      styles.categoryButtonText,
                      isSelected && styles.categoryButtonTextActive,
                    ]}>
                      {config.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Informações Adicionais */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoTitle}>Sobre Orçamentos</Text>
            </View>
            <Text style={styles.infoText}>
              • Os orçamentos são definidos mensalmente por categoria{'\n'}
              • Você receberá alertas quando se aproximar do limite{'\n'}
              • Valores são convertidos automaticamente para USD{'\n'}
              • Apenas categorias de despesas podem ter orçamentos
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  periodContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  periodSelector: {
    marginBottom: 16,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  monthScroll: {
    maxHeight: 50,
  },
  monthButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  monthButtonActive: {
    backgroundColor: '#007AFF',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  monthButtonTextActive: {
    color: 'white',
  },
  yearContainer: {
    flexDirection: 'row',
  },
  yearButton: {
    flex: 1,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignItems: 'center',
  },
  yearButtonActive: {
    backgroundColor: '#007AFF',
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  yearButtonTextActive: {
    color: 'white',
  },
  amountContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  currencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currencyButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  currencyButtonActive: {
    backgroundColor: '#007AFF',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  currencyTextActive: {
    color: 'white',
  },
  conversionInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  conversionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    textAlign: 'center',
  },
  rateText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
  },
  categoryButton: {
    width: '33.33%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  categoryButtonText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default AddBudgetScreen;
