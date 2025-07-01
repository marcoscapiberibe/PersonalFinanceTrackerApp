describe('Currency Logic Tests', () => {
  test('should handle currency conversion rates', () => {
    const convertCurrency = (amount: number, rate: number) => {
      return Math.round(amount * rate * 100) / 100;
    };
    
    expect(convertCurrency(100, 0.85)).toBe(85);
    expect(convertCurrency(100, 1.18)).toBe(118);
    expect(convertCurrency(50.5, 0.85)).toBe(42.93);
  });

  test('should validate supported currencies', () => {
    const supportedCurrencies = ['USD', 'EUR', 'BRL', 'GBP', 'JPY'];
    const isSupported = (currency: string) => supportedCurrencies.includes(currency);
    
    expect(isSupported('USD')).toBe(true);
    expect(isSupported('EUR')).toBe(true);
    expect(isSupported('XYZ')).toBe(false);
  });

  test('should format currency symbols', () => {
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      BRL: 'R$',
      GBP: '£',
      JPY: '¥',
    };
    
    expect(currencySymbols.USD).toBe('$');
    expect(currencySymbols.EUR).toBe('€');
    expect(currencySymbols.BRL).toBe('R$');
  });
});
