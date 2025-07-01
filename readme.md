# Personal Finance Tracker App

🎯 **Desafio Técnico React Native** - Aplicativo completo de controle financeiro pessoal

## 🚀 Visão Geral

Aplicativo mobile desenvolvido em React Native + TypeScript que permite aos usuários gerenciar suas finanças pessoais com funcionalidades completas de transações, orçamentos e conversão automática de moedas.

## ✨ Funcionalidades Principais

### 💰 Gestão de Transações
- ✅ Adicionar receitas e despesas
- ✅ Categorização automática
- ✅ Múltiplas moedas (USD, EUR, BRL, GBP, JPY)
- ✅ Conversão automática para USD
- ✅ Descrições opcionais
- ✅ Seletor de data intuitivo

### 📊 Orçamentos Mensais
- ✅ Definir orçamentos por categoria
- ✅ Acompanhamento em tempo real
- ✅ Alertas de limite excedido
- ✅ Progresso visual com barras

### 🌐 Conversão de Moedas
- ✅ API de câmbio em tempo real (exchangerate.host)
- ✅ Sistema de fallback (open.er-api.com)
- ✅ Cache inteligente (1 hora)
- ✅ Taxas offline como último recurso

### 📈 Dashboard & Relatórios
- ✅ Resumo mensal completo
- ✅ Status de orçamentos
- ✅ Análise por categoria
- ✅ Estatísticas detalhadas

## 🏗️ Arquitetura

### Stack Tecnológica
- **React Native** + **Expo**
- **TypeScript** (tipagem completa)
- **Zustand** (estado global)
- **React Navigation** (navegação)
- **AsyncStorage** (persistência)
- **Axios** (requisições HTTP)

### Princípios Aplicados
- **Clean Architecture** - Separação clara de responsabilidades
- **SOLID** - Código extensível e manutenível
- **DRY** - Componentes e funções reutilizáveis
- **Responsividade** - Interface adaptável

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+
- npm ou yarn
- Expo CLI
- iOS Simulator / Android Emulator

### Instalação
```bash
# 1. Clonar o repositório
git clone <repository-url>
cd PersonalFinanceTracker

# 2. Instalar dependências
npm install

# 3. Executar no desenvolvimento
npx expo start

# 4. Para iOS
npx expo run:ios

# 5. Para Android
npx expo run:android
```

### Configuração de API
Crie um arquivo `.env` (opcional - app funciona sem):
```env
CURRENCY_API_KEY=your_api_key_here
```

## 🧪 Testes

```bash
# Executar testes unitários
npm test

# Executar com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 📱 Funcionalidades Detalhadas

### Gestão de Transações
- **Tipos**: Receita ou Despesa
- **Categorias**: 12 categorias pré-definidas com ícones
- **Moedas**: Suporte a 5 moedas principais
- **Validação**: Formulários com validação em tempo real
- **Edição**: Editar ou excluir transações existentes

### Sistema de Orçamentos
- **Periodicidade**: Orçamentos mensais
- **Categorias**: Apenas categorias de despesa
- **Alertas**: Notificação visual quando exceder limite
- **Progresso**: Barras de progresso coloridas
- **Múltiplas moedas**: Conversão automática para USD

### Conversão de Moedas
- **APIs utilizadas**:
  1. exchangerate.host (principal)
  2. open.er-api.com (fallback)
  3. Taxas fixas (offline)
- **Cache**: 1 hora de validade
- **Retry**: Tentativas automáticas
- **Feedback**: Estados de loading e erro

### Dashboard
- **Visão mensal**: Receitas, despesas e saldo
- **Status orçamento**: Progresso por categoria
- **Estatísticas**: Transações totais e médias
- **Navegação temporal**: Navegar entre meses

## 🔄 Estado Global

### Persistência
- **AsyncStorage** para dados locais
- **Middleware** Zustand persist
- **Sincronização** automática

## 🌐 Integração de APIs

### Tratamento de Erro
- **Network errors**: Fallback para API secundária
- **API failures**: Cache expirado como backup
- **User feedback**: Loading states e mensagens claras

## 📊 Performance

### Otimizações Implementadas
- **Memoização** com useMemo/useCallback
- **Lista virtualizada** para muitas transações
- **Cache de API** para reduzir requests
- **Lazy loading** de componentes pesados
- **Debounce** em inputs de busca

## 🚧 Limitações Conhecidas

1. **Armazenamento local** - Dados ficam apenas no device
2. **Sincronização** - Não há backup automático na nuvem
3. **Offline mode** - Conversões offline usam taxas fixas
4. **Categorias** - Não permite categorias customizadas

## 🔮 Próximas Funcionalidades

### Roadmap v2.0
- [ ] **Gráficos** interativos com recharts
- [ ] **Backup na nuvem** (Google Drive/iCloud)
- [ ] **Exportação PDF** dos relatórios
- [ ] **Notificações push** para lembretes
- [ ] **Metas financeiras** de longo prazo
- [ ] **Categorias customizadas**
- [ ] **Multi-usuário** com sync
- [ ] **Dark mode**

## 👥 Contribuição

### Desenvolvimento Local
```bash
# 1. Fork o projeto
# 2. Criar branch feature
git checkout -b feature/nova-funcionalidade

# 3. Commit com padrão
git commit -m "feat: adiciona nova funcionalidade"

# 4. Push e Pull Request
git push origin feature/nova-funcionalidade
```

## 📞 Contato

**Desenvolvedor**: 
**Email**: 
**LinkedIn**: 

---

## 🏆 Sobre o Desafio

Este projeto foi desenvolvido como **desafio técnico** para vaga de **Desenvolvedor React Native**, demonstrando:

✅ **Arquitetura escalável** e bem estruturada  
✅ **Integração com APIs** externas robusta  
✅ **UI/UX moderna** e responsiva  
✅ **TypeScript** com tipagem completa  
✅ **Testes** e qualidade de código  
✅ **Performance** otimizada  
✅ **Documentação** detalhada  

---

*Desenvolvido usando React Native + TypeScript*