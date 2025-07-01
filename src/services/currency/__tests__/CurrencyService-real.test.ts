import { currencyService } from '../CurrencyService';

describe('CurrencyService - Real Implementation', () => {
  test('should have getSupportedCurrencies method', () => {
    const currencies = currencyService.getSupportedCurrencies();
    expect(Array.isArray(currencies)).toBe(true);
    expect(currencies.length).toBeGreaterThan(0);
    expect(currencies[0]).toHaveProperty('code');
    expect(currencies[0]).toHaveProperty('name');
    expect(currencies[0]).toHaveProperty('symbol');
  });

  test('should handle same currency conversion', async () => {
    const result = await currencyService.convertCurrency(100, 'USD', 'USD');
    expect(result.convertedAmount).toBe(100);
    expect(result.rate).toBe(1.0);
  });

  test('should clear cache', () => {
    expect(() => currencyService.clearCache()).not.toThrow();
  });

  test('should check if rates are up to date', () => {
    const result = currencyService.areRatesUpToDate('USD');
    expect(typeof result).toBe('boolean');
  });
});
