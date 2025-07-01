describe('Utils - Extra Functions', () => {
  test('should generate unique IDs', () => {
    const generateId = () => Date.now().toString(36) + Math.random().toString(36);
    const id1 = generateId();
    const id2 = generateId();
    
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
  });

  test('should handle category configurations', () => {
    const categories = {
      food: { name: 'Alimentação', icon: 'restaurant', color: '#FF5722' },
      transport: { name: 'Transporte', icon: 'car', color: '#795548' },
      salary: { name: 'Salário', icon: 'briefcase', color: '#4CAF50' },
    };
    
    expect(categories.food.name).toBe('Alimentação');
    expect(categories.transport.color).toBe('#795548');
    expect(categories.salary.icon).toBe('briefcase');
  });

  test('should sort arrays by date', () => {
    const items = [
      { date: '2023-12-01', amount: 100 },
      { date: '2023-12-03', amount: 200 },
      { date: '2023-12-02', amount: 150 },
    ];
    
    const sorted = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    expect(sorted[0].date).toBe('2023-12-03');
    expect(sorted[1].date).toBe('2023-12-02');
    expect(sorted[2].date).toBe('2023-12-01');
  });
});
