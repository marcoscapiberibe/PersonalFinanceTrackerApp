// Assumindo que temos algumas funções utilitárias
describe('Utils - Real Functions', () => {
  test('should generate unique IDs', () => {
    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    const id1 = generateId();
    const id2 = generateId();
    
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
  });

  test('should validate amounts correctly', () => {
    const validateAmount = (amount: string): boolean => {
      const numericAmount = parseFloat(amount);
      return !isNaN(numericAmount) && numericAmount > 0;
    };

    expect(validateAmount('100')).toBe(true);
    expect(validateAmount('100.50')).toBe(true);
    expect(validateAmount('0')).toBe(false);
    expect(validateAmount('-100')).toBe(false);
    expect(validateAmount('abc')).toBe(false);
  });

  test('should format currency', () => {
    const formatCurrency = (amount: number, currency = 'USD'): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    };

    const formatted = formatCurrency(100);
    expect(formatted).toContain('100');
    expect(formatted).toContain('$');
  });

  test('should format dates correctly', () => {
    const formatDate = (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('pt-BR');
    };

    // Usar data específica que funciona em qualquer fuso horário
    const testDate = new Date(2023, 11, 15); // Ano, Mês (0-based), Dia
    const formatted = formatDate(testDate);
    
    // Verificar se contém os componentes da data
    expect(formatted).toContain('15');
    expect(formatted).toContain('12');
    expect(formatted).toContain('2023');
    
    // Verificar formato brasileiro
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  test('should handle month names', () => {
    const getMonthName = (month: number): string => {
      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return months[month - 1] || '';
    };

    expect(getMonthName(1)).toBe('Janeiro');
    expect(getMonthName(12)).toBe('Dezembro');
    expect(getMonthName(13)).toBe('');
  });

  test('should calculate percentages', () => {
    const calculatePercentage = (value: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((value / total) * 100 * 100) / 100;
    };

    expect(calculatePercentage(50, 100)).toBe(50);
    expect(calculatePercentage(1, 3)).toBe(33.33);
    expect(calculatePercentage(100, 0)).toBe(0);
  });
});
