import axios, { AxiosResponse } from 'axios';
import { Currency, ExchangeRatesResponse, ExchangeRate } from '../../types';
import { getErrorMessage } from '../../utils/helpers';

// Configuração das APIs - várias opções gratuitas
const PRIMARY_URL = 'https://api.exchangerate-api.com/v4';
const FALLBACK_URL = 'https://api.fixer.io'; // Alternativa
const FREE_API_URL = 'https://api.exchangerate.host'; // Gratuita sem limite

// Cache das taxas de câmbio (válido por 1 hora)
interface CacheEntry {
  data: Record<string, ExchangeRate>;
  timestamp: number;
}

class CurrencyService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hora em ms

  /**
   * Busca taxas de câmbio com fallback e cache
   */
  async getExchangeRates(baseCurrency: Currency = 'USD'): Promise<Record<string, ExchangeRate>> {
    const cacheKey = `rates_${baseCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    // Verificar cache
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('🔄 Usando taxas de câmbio do cache');
      return cached.data;
    }

    console.log('🌐 Buscando taxas de câmbio da API...');

    // Tentar APIs em ordem de preferência
    const apiMethods = [
      () => this.fetchFromExchangeRateApi(baseCurrency),
      () => this.fetchFromExchangeRateHost(baseCurrency),
      () => this.fetchFromFixerApi(baseCurrency),
    ];

    for (const [index, apiMethod] of apiMethods.entries()) {
      try {
        console.log(`📡 Tentativa ${index + 1} de ${apiMethods.length}...`);
        const rates = await apiMethod();
        
        // Salvar no cache
        this.cache.set(cacheKey, {
          data: rates,
          timestamp: Date.now(),
        });
        
        console.log('✅ Taxas de câmbio obtidas com sucesso!');
        return rates;
      } catch (error) {
        console.log(`❌ API ${index + 1} falhou:`, error instanceof Error ? error.message : String(error));
        
        if (index === apiMethods.length - 1) {
          console.log('⚠️ Todas as APIs falharam, usando fallback...');
          
          // Retornar cache expirado se existir
          if (cached) {
            console.log('📦 Usando cache expirado como último recurso');
            return cached.data;
          }
          
          // Último recurso: taxas fixas básicas
          console.log('🔧 Usando taxas de câmbio padrão (offline)');
          const defaultRates = this.getDefaultRates(baseCurrency);
          
          // Salvar taxas padrão no cache por um tempo menor
          this.cache.set(cacheKey, {
            data: defaultRates,
            timestamp: Date.now() - (this.CACHE_DURATION - 300000), // 5 min de validade
          });
          
          return defaultRates;
        }
      }
    }

    // Nunca deveria chegar aqui, mas garantindo
    return this.getDefaultRates(baseCurrency);
  }

  /**
   * API 1: exchangerate-api.com (gratuita, sem limite, confiável)
   */
  private async fetchFromExchangeRateApi(baseCurrency: Currency): Promise<Record<string, ExchangeRate>> {
    const response = await axios.get(
      `${PRIMARY_URL}/latest/${baseCurrency}`,
      {
        timeout: 8000,
        headers: {
          'User-Agent': 'PersonalFinanceApp/1.0',
        },
      }
    );

    console.log('📊 Resposta API 1:', {
      status: response.status,
      hasRates: !!response.data?.rates,
      ratesCount: Object.keys(response.data?.rates || {}).length
    });

    if (!response.data?.rates) {
      throw new Error('API 1: Formato de resposta inválido');
    }

    return this.formatRatesResponse({
      success: true,
      rates: response.data.rates,
      timestamp: Date.now() / 1000,
      base: baseCurrency,
      date: new Date().toISOString().split('T')[0],
    }, baseCurrency);
  }

  /**
   * API 2: exchangerate.host (gratuita, backup)
   */
  private async fetchFromExchangeRateHost(baseCurrency: Currency): Promise<Record<string, ExchangeRate>> {
    const url = `${FREE_API_URL}/latest`;
    const params = {
      base: baseCurrency,
      symbols: 'USD,EUR,BRL,GBP,JPY',
    };
    
    console.log('📡 Chamando API 2:', { url, params });
    
    const response = await axios.get(url, {
      params,
      timeout: 8000,
      headers: {
        'User-Agent': 'PersonalFinanceApp/1.0',
        'Accept': 'application/json',
      },
    });

    console.log('📊 Resposta API 2:', {
      status: response.status,
      success: response.data?.success,
      hasRates: !!response.data?.rates,
      ratesCount: Object.keys(response.data?.rates || {}).length,
      actualData: response.data,
    });

    // exchangerate.host pode não ter campo success, então verificar se tem rates
    if (!response.data?.rates && !response.data?.success) {
      console.log('❌ API 2: Dados inválidos recebidos:', response.data);
      throw new Error('API 2: Resposta não contém taxas de câmbio');
    }

    return this.formatRatesResponse({
      success: true,
      rates: response.data.rates,
      timestamp: Date.now() / 1000,
      base: baseCurrency,
      date: new Date().toISOString().split('T')[0],
    }, baseCurrency);
  }

  /**
   * API 3: Fixer.io (como último recurso - precisa de key, mas tem plano gratuito)
   */
  private async fetchFromFixerApi(baseCurrency: Currency): Promise<Record<string, ExchangeRate>> {
    // Por enquanto, vamos simular uma falha já que precisa de API key
    throw new Error('API 3: Fixer.io precisa de API key (não configurada)');
    
    /* 
    // Descomente se tiver API key do fixer.io
    const response = await axios.get(
      `${FALLBACK_URL}/latest`,
      {
        params: {
          access_key: 'YOUR_FIXER_API_KEY',
          base: baseCurrency,
          symbols: 'USD,EUR,BRL,GBP,JPY',
        },
        timeout: 8000,
      }
    );

    if (!response.data?.success || !response.data?.rates) {
      throw new Error('API 3: Fixer.io response indicates failure');
    }

    return this.formatRatesResponse(response.data, baseCurrency);
    */
  }

  /**
   * Formatar resposta da API para o formato interno
   */
  private formatRatesResponse(
    apiResponse: ExchangeRatesResponse, 
    baseCurrency: Currency
  ): Record<string, ExchangeRate> {
    const rates: Record<string, ExchangeRate> = {};
    const timestamp = Date.now();

    // Adicionar todas as taxas disponíveis
    Object.entries(apiResponse.rates).forEach(([targetCurrency, rate]) => {
      if (this.isSupportedCurrency(targetCurrency)) {
        const key = `${baseCurrency}-${targetCurrency}`;
        rates[key] = {
          base: baseCurrency,
          target: targetCurrency as Currency,
          rate: Number(rate),
          timestamp,
        };
      }
    });

    // Garantir que a moeda base tenha taxa 1.0
    const baseKey = `${baseCurrency}-${baseCurrency}`;
    rates[baseKey] = {
      base: baseCurrency,
      target: baseCurrency,
      rate: 1.0,
      timestamp,
    };

    return rates;
  }

  /**
   * Verificar se a moeda é suportada
   */
  private isSupportedCurrency(currency: string): currency is Currency {
    return ['USD', 'EUR', 'BRL', 'GBP', 'JPY'].includes(currency);
  }

  /**
   * Taxas fixas como último recurso (aproximadas, atualizadas manualmente)
   * Baseadas em médias de dezembro 2024
   */
  private getDefaultRates(baseCurrency: Currency): Record<string, ExchangeRate> {
    console.log('🔧 Usando taxas de câmbio padrão (offline)');
    
    // Taxas base para USD (atualizadas em dez/2024)
    const usdRates: Record<Currency, number> = {
      USD: 1.0,
      EUR: 0.95,     // 1 USD = 0.95 EUR
      BRL: 6.0,      // 1 USD = 6.0 BRL  
      GBP: 0.79,     // 1 USD = 0.79 GBP
      JPY: 150.0,    // 1 USD = 150 JPY
    };

    const rates: Record<string, ExchangeRate> = {};
    const timestamp = Date.now();

    // Se a moeda base é USD, usar as taxas diretas
    if (baseCurrency === 'USD') {
      Object.entries(usdRates).forEach(([targetCurrency, rate]) => {
        const key = `USD-${targetCurrency}`;
        rates[key] = {
          base: 'USD',
          target: targetCurrency as Currency,
          rate,
          timestamp,
        };
      });
    } else {
      // Para outras moedas, calcular as taxas cruzadas
      const baseRateToUSD = 1 / usdRates[baseCurrency];
      
      Object.entries(usdRates).forEach(([targetCurrency, usdRate]) => {
        const key = `${baseCurrency}-${targetCurrency}`;
        let crossRate: number;
        
        if (targetCurrency === 'USD') {
          crossRate = baseRateToUSD;
        } else if (targetCurrency === baseCurrency) {
          crossRate = 1.0;
        } else {
          // Taxa cruzada: (base -> USD) * (USD -> target)
          crossRate = baseRateToUSD * usdRate;
        }
        
        rates[key] = {
          base: baseCurrency,
          target: targetCurrency as Currency,
          rate: crossRate,
          timestamp,
        };
      });
    }

    console.log(`📊 Taxas padrão geradas para ${baseCurrency}:`, 
      Object.keys(rates).length, 'pares de moeda');
    
    return rates;
  }

  /**
   * Converter valor entre moedas
   */
  async convertCurrency(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency
  ): Promise<{ convertedAmount: number; rate: number; isEstimate: boolean }> {
    if (fromCurrency === toCurrency) {
      return {
        convertedAmount: amount,
        rate: 1.0,
        isEstimate: false,
      };
    }

    try {
      const rates = await this.getExchangeRates(fromCurrency);
      const rateKey = `${fromCurrency}-${toCurrency}`;
      const exchangeRate = rates[rateKey];

      if (!exchangeRate) {
        console.warn(`⚠️ Taxa não encontrada para ${rateKey}, tentando taxa cruzada via USD`);
        
        // Tentar conversão via USD
        if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
          const toUsdKey = `${fromCurrency}-USD`;
          const fromUsdKey = `USD-${toCurrency}`;
          
          const toUsdRate = rates[toUsdKey];
          const fromUsdRate = await this.getExchangeRates('USD');
          const finalRate = fromUsdRate[fromUsdKey];
          
          if (toUsdRate && finalRate) {
            const crossRate = toUsdRate.rate * finalRate.rate;
            const convertedAmount = amount * crossRate;
            
            return {
              convertedAmount: Math.round(convertedAmount * 100) / 100,
              rate: crossRate,
              isEstimate: true,
            };
          }
        }
        
        throw new Error(`Taxa de câmbio não encontrada: ${fromCurrency} -> ${toCurrency}`);
      }

      const convertedAmount = amount * exchangeRate.rate;
      const isEstimate = Date.now() - exchangeRate.timestamp > this.CACHE_DURATION;

      return {
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        rate: exchangeRate.rate,
        isEstimate,
      };
    } catch (error) {
      console.error('❌ Erro na conversão de moeda:', error);
      
      // Como fallback, usar taxas padrão
      console.log('🔄 Tentando conversão com taxas padrão...');
      const defaultRates = this.getDefaultRates(fromCurrency);
      const rateKey = `${fromCurrency}-${toCurrency}`;
      const exchangeRate = defaultRates[rateKey];
      
      if (exchangeRate) {
        const convertedAmount = amount * exchangeRate.rate;
        return {
          convertedAmount: Math.round(convertedAmount * 100) / 100,
          rate: exchangeRate.rate,
          isEstimate: true,
        };
      }
      
      throw new Error(`Falha na conversão: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Obter lista de moedas suportadas
   */
  getSupportedCurrencies(): Array<{ code: Currency; name: string; symbol: string }> {
    return [
      { code: 'USD', name: 'Dólar Americano', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
      { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
      { code: 'JPY', name: 'Iene Japonês', symbol: '¥' },
    ];
  }

  /**
   * Verificar se as taxas estão atualizadas
   */
  areRatesUpToDate(baseCurrency: Currency = 'USD'): boolean {
    const cacheKey = `rates_${baseCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    if (!cached) return false;
    
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  /**
   * Forçar atualização das taxas
   */
  async refreshRates(baseCurrency: Currency = 'USD'): Promise<void> {
    const cacheKey = `rates_${baseCurrency}`;
    this.cache.delete(cacheKey);
    await this.getExchangeRates(baseCurrency);
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache de taxas de câmbio limpo');
  }
}

// Instância singleton
export const currencyService = new CurrencyService();
export default currencyService;
