import { currencyService } from '../CurrencyService';

describe('CurrencyService - Advanced Tests', () => {
  beforeEach(() => {
    currencyService.clearCache();
  });

  test('should have all required methods', () => {
    expect(typeof currencyService.getExchangeRates).toBe('function');
    expect(typeof currencyService.convertCurrency).toBe('function');
    expect(typeof currencyService.getSupportedCurrencies).toBe('function');
    expect(typeof currencyService.areRatesUpToDate).toBe('function');
    expect(typeof currencyService.refreshRates).toBe('function');
    expect(typeof currencyService.clearCache).toBe('function');
  });

  test('should return supported currencies with correct structure', () => {
    const currencies = currencyService.getSupportedCurrencies();
    
    expect(Array.isArray(currencies)).toBe(true);
    expect(currencies.length).toBe(5);
    
    currencies.forEach(currency => {
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(currency).toHaveProperty('symbol');
      expect(typeof currency.code).toBe('string');
      expect(typeof currency.name).toBe('string');
      expect(typeof currency.symbol).toBe('string');
    });
    
    // Verificar moedas específicas
    const usd = currencies.find(c => c.code === 'USD');
    const eur = currencies.find(c => c.code === 'EUR');
    const brl = currencies.find(c => c.code === 'BRL');
    
    expect(usd).toBeDefined();
    expect(eur).toBeDefined();
    expect(brl).toBeDefined();
    expect(usd?.symbol).toBe('$');
    expect(eur?.symbol).toBe('€');
    expect(brl?.symbol).toBe('R$');
  });

  test('should handle cache status correctly', () => {
    // Cache deve estar vazio inicialmente
    expect(currencyService.areRatesUpToDate('USD')).toBe(false);
    expect(currencyService.areRatesUpToDate('EUR')).toBe(false);
    
    // Clear cache deve funcionar sem erro
    expect(() => currencyService.clearCache()).not.toThrow();
  });

  test('should handle same currency conversion without API call', async () => {
    const result = await currencyService.convertCurrency(100, 'USD', 'USD');
    
    expect(result).toHaveProperty('convertedAmount');
    expect(result).toHaveProperty('rate');
    expect(result).toHaveProperty('isEstimate');
    
    expect(result.convertedAmount).toBe(100);
    expect(result.rate).toBe(1.0);
    expect(typeof result.isEstimate).toBe('boolean');
  });

  test('should handle conversion errors gracefully', async () => {
    // Este teste pode falhar se API estiver disponível, mas testa error handling
    try {
      const result = await currencyService.convertCurrency(100, 'USD', 'EUR');
      // Se não der erro, verificar estrutura da resposta
      expect(result).toHaveProperty('convertedAmount');
      expect(result).toHaveProperty('rate');
      expect(typeof result.convertedAmount).toBe('number');
      expect(typeof result.rate).toBe('number');
    } catch (error) {
      // Se der erro, verificar que é uma mensagem de erro válida
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Falha na conversão');
    }
  });
});
