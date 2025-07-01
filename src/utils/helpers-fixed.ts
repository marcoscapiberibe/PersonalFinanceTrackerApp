export const validateAmount = (amount: string): boolean => {
  if (!amount.trim()) return false;
  
  // Verificar se contém apenas números, pontos e vírgulas
  const cleanAmount = amount.replace(/[^\d.,]/g, '');
  if (cleanAmount !== amount) {
    // Se removeu caracteres, pode ter letras
    if (/[a-zA-Z]/.test(amount)) return false;
  }
  
  // Verificar se tem mais de um ponto decimal
  const dots = (amount.match(/\./g) || []).length;
  const commas = (amount.match(/,/g) || []).length;
  
  if (dots > 1 || commas > 1) return false;
  if (dots > 0 && commas > 0) {
    const lastDot = amount.lastIndexOf('.');
    const lastComma = amount.lastIndexOf(',');
    if (Math.abs(lastDot - lastComma) <= 3) {
      // Se ponto e vírgula estão próximos, pode ser formato válido
    } else {
      return false;
    }
  }
  
  const numericAmount = parseFloat(amount.replace(',', '.'));
  return !isNaN(numericAmount) && numericAmount > 0;
};

export const sanitizeAmount = (amount: string): number => {
  if (!amount) return 0;
  
  // Remover espaços e símbolos de moeda
  let cleaned = amount.replace(/[R$€£¥\s]/g, '');
  
  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');
  
  if (lastDot > lastComma && lastComma !== -1) {
    // Formato americano: 1,234.56
    cleaned = cleaned.replace(/,/g, '');
  } else if (lastComma > lastDot && lastDot !== -1) {
    // Formato brasileiro: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastComma !== -1 && lastDot === -1) {
    // Apenas vírgula: 100,50
    cleaned = cleaned.replace(',', '.');
  }
  
  return parseFloat(cleaned) || 0;
};

export const getDateRangeForMonth = (month: number, year: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};
