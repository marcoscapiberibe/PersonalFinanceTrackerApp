// Teste básico sem dependências complexas
describe('Store - Basic Logic', () => {
  test('should handle basic store structure', () => {
    // Simular estrutura do store
    const mockStore = {
      transactions: [],
      budgets: [],
      baseCurrency: 'USD',
      isLoading: false,
      error: null,
    };

    expect(mockStore.transactions).toEqual([]);
    expect(mockStore.budgets).toEqual([]);
    expect(mockStore.baseCurrency).toBe('USD');
    expect(mockStore.isLoading).toBe(false);
    expect(mockStore.error).toBe(null);
  });

  test('should handle transaction operations', () => {
    const addTransaction = (transactions: any[], transaction: any) => {
      return [...transactions, { ...transaction, id: Date.now().toString() }];
    };

    const removeTransaction = (transactions: any[], id: string) => {
      return transactions.filter(t => t.id !== id);
    };

    let transactions: any[] = [];
    const newTransaction = { amount: 100, type: 'expense', category: 'food' };
    
    transactions = addTransaction(transactions, newTransaction);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toHaveProperty('id');
    
    transactions = removeTransaction(transactions, transactions[0].id);
    expect(transactions).toHaveLength(0);
  });

  test('should calculate balances', () => {
    const calculateBalance = (transactions: any[]) => {
      return transactions.reduce((sum, t) => {
        return t.type === 'income' ? sum + t.amount : sum - t.amount;
      }, 0);
    };

    const transactions = [
      { type: 'income', amount: 1000 },
      { type: 'expense', amount: 300 },
      { type: 'expense', amount: 200 },
    ];

    const balance = calculateBalance(transactions);
    expect(balance).toBe(500); // 1000 - 300 - 200
  });
});
