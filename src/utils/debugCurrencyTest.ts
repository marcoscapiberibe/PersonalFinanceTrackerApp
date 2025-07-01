import axios from 'axios';

export const testCurrencyAPIs = async () => {
  console.log('🔍 === TESTE DE APIs DE CÂMBIO ===');
  
  // API 1: exchangerate-api.com
  console.log('\n📡 Testando API 1: exchangerate-api.com');
  try {
    const response1 = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
      timeout: 5000,
    });
    console.log('✅ API 1 - Status:', response1.status);
    console.log('✅ API 1 - Tem rates:', !!response1.data?.rates);
    console.log('✅ API 1 - Quantidade de moedas:', Object.keys(response1.data?.rates || {}).length);
    console.log('✅ API 1 - Sample rates:', {
      EUR: response1.data?.rates?.EUR,
      BRL: response1.data?.rates?.BRL,
      GBP: response1.data?.rates?.GBP,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log('❌ API 1 FALHOU:', error.message);
    } else {
      console.log('❌ API 1 FALHOU:', error);
    }
  }

  // API 2: exchangerate.host
  console.log('\n📡 Testando API 2: exchangerate.host');
  try {
    const response2 = await axios.get('https://api.exchangerate.host/latest?base=USD&symbols=EUR,BRL,GBP,JPY', {
      timeout: 5000,
    });
    console.log('✅ API 2 - Status:', response2.status);
    console.log('✅ API 2 - Success:', response2.data?.success);
    console.log('✅ API 2 - Tem rates:', !!response2.data?.rates);
    console.log('✅ API 2 - Sample rates:', response2.data?.rates);
  } catch (error) {
    if (error instanceof Error) {
      console.log('❌ API 2 FALHOU:', error.message);
    } else {
      console.log('❌ API 2 FALHOU:', error);
    }
  }

  // API 3: Teste alternativo simples
  console.log('\n📡 Testando API 3: open.er-api.com');
  try {
    const response3 = await axios.get('https://open.er-api.com/v6/latest/USD', {
      timeout: 5000,
    });
    console.log('✅ API 3 - Status:', response3.status);
    console.log('✅ API 3 - Tem rates:', !!response3.data?.rates);
    console.log('✅ API 3 - Sample rates:', {
      EUR: response3.data?.rates?.EUR,
      BRL: response3.data?.rates?.BRL,
      GBP: response3.data?.rates?.GBP,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log('❌ API 3 FALHOU:', error.message);
    } else {
      console.log('❌ API 3 FALHOU:', error);
    }
  }

  console.log('\n🏁 === FIM DOS TESTES ===');
};
