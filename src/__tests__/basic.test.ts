describe('Basic Test Setup', () => {
  test('should run basic math', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle strings', () => {
    expect('Personal Finance Tracker').toContain('Finance');
  });

  test('should work with arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr[0]).toBe(1);
  });

  test('should handle objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(42);
  });

  test('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });
});
