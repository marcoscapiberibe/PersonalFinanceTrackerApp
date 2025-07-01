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
import DateTimePicker from '@react-native-community/datetimepicker';

import { useFinanceStore } from '../../store/useFinanceStore';
import { currencyService } from '../../services/currency/CurrencyService';
import {
  RootStackParamList,
  TransactionFormData,
  TransactionType,
  TransactionCategory,
  Currency,
  Transaction,
} from '../../types';
import {
  getCategoryConfig,
  getIncomeCategories,
  getExpenseCategories,
  validateAmount,
  sanitizeAmount,
  formatCurrency,
  formatDate,
} from '../../utils/helpers';

type NavigationProp = StackNavigationProp<RootStackParamList, 'AddTransaction'>;
type RouteProp_  = RouteProp<RootStackParamList, 'AddTransaction'>;

const AddTransactionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp_>();
  const { editTransaction } = route.params || {};

  const { addTransaction, updateTransaction, baseCurrency, updateExchangeRates } = useFinanceStore();

  // Estado do formulário
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    category: 'food',
    amount: '',
    currency: baseCurrency,
    date: new Date(),
    description: '',
  });

  // Estados de UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversionInfo, setConversionInfo] = useState<{
    rate: number;
    convertedAmount: number;
    isEstimate: boolean;
  } | null>(null);
  const [errors, setErrors] = useState<Partial<Omit<TransactionFormData, 'date'> & { date?: string }>>({});

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (editTransaction) {
      setFormData({
        type: editTransaction.type,
        category: editTransaction.category,
        amount: editTransaction.amount.toString(),
        currency: editTransaction.currency,
        date: new Date(editTransaction.date),
        description: editTransaction.description || '',
      });
    }
  }, [editTransaction]);

  // Atualizar categorias quando tipo muda
  useEffect(() => {
    const availableCategories = formData.type === 'income' 
      ? getIncomeCategories() 
      : getExpenseCategories();
    
    if (!availableCategories.includes(formData.category)) {
      setFormData(prev => ({
        ...prev,
        category: availableCategories[0],
      }));
    }
  }, [formData.type]);

  // Conversão de moeda em tempo real
  useEffect(() => {
    if (formData.amount && formData.currency !== baseCurrency) {
      handleCurrencyConversion();
    } else {
      setConversionInfo(null);
    }
  }, [formData.amount, formData.currency, baseCurrency]);

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
        baseCurrency
      );
      
      setConversionInfo(result);
    } catch (error) {
      console.error('Erro na conversão:', error);
      setConversionInfo(null);
    }
  }, [formData.amount, formData.currency, baseCurrency]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Omit<TransactionFormData, 'date'> & { date?: string }> = {};

    // Validar valor
    if (!formData.amount.trim()) {
      newErrors.amount = 'Valor é obrigatório';
    } else if (!validateAmount(formData.amount)) {
      newErrors.amount = 'Valor deve ser um número positivo';
    }

    // Validar data (não pode ser muito no futuro)
    const today = new Date();
    const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    if (formData.date > maxDate) {
      newErrors.date = 'Data não pode ser mais de 1 ano no futuro';
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
      const amount = sanitizeAmount(formData.amount);
      let amountInUSD = amount;

      // Converter para USD se necessário
      if (formData.currency !== 'USD') {
        const conversion = await currencyService.convertCurrency(
          amount,
          formData.currency,
          'USD'
        );
        amountInUSD = conversion.convertedAmount;

        // Atualizar taxas no store
        const rates = await currencyService.getExchangeRates(formData.currency);
        updateExchangeRates(rates);
      }

      const transactionData = {
        type: formData.type,
        category: formData.category,
        amount,
        currency: formData.currency,
        amountInUSD,
        date: formData.date.toISOString(),
        description: formData.description.trim() || undefined,
      };

      if (editTransaction) {
        updateTransaction(editTransaction.id, transactionData);
      } else {
        addTransaction(transactionData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      Alert.alert(
        'Erro',
        'Não foi possível salvar a transação. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const availableCategories = formData.type === 'income' 
    ? getIncomeCategories() 
    : getExpenseCategories();
  
  const categoryConfig = getCategoryConfig();
  const supportedCurrencies = currencyService.getSupportedCurrencies();

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
            {editTransaction ? 'Editar Transação' : 'Nova Transação'}
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
          {/* Tipo de Transação */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'income' && styles.typeButtonActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'income' }))}
              >
                <Ionicons 
                  name="add-circle" 
                  size={20} 
                  color={formData.type === 'income' ? 'white' : '#4CAF50'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'income' && styles.typeButtonTextActive,
                ]}>
                  Receita
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'expense' && styles.typeButtonActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
              >
                <Ionicons 
                  name="remove-circle" 
                  size={20} 
                  color={formData.type === 'expense' ? 'white' : '#F44336'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'expense' && styles.typeButtonTextActive,
                ]}>
                  Despesa
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Valor */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valor</Text>
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
            <View style={styles.categoryGrid}>
              {availableCategories.map((category) => {
                const config = categoryConfig[category];
                const isSelected = formData.category === category;
                
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      isSelected && { backgroundColor: config.color },
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

          {/* Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data</Text>
            <TouchableOpacity
              style={[styles.dateButton, errors.date && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.dateText}>
                {formatDate(formData.date)}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            
            {errors.date && typeof errors.date === 'string' && (
              <Text style={styles.errorText}>{errors.date}</Text>
            )}
          </View>

          {/* Descrição */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição (opcional)</Text>
            <TextInput
              style={styles.descriptionInput}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Ex: Almoço no restaurante"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setFormData(prev => ({ ...prev, date: selectedDate }));
              }
            }}
          />
        )}
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
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  typeButtonTextActive: {
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  descriptionInput: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 4,
  },
});

export default AddTransactionScreen;
