# scripts/test.sh - Script de automação de testes

set -e

echo "🧪 Personal Finance Tracker - Test Suite"
echo "========================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs coloridos
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    log_error "Node.js não está instalado. Por favor, instale Node.js 16+"
    exit 1
fi

# Verificar versão do Node
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    log_error "Node.js versão 16+ é necessária. Versão atual: $(node --version)"
    exit 1
fi

log_success "Node.js $(node --version) detectado"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependências..."
    npm install
    log_success "Dependências instaladas"
fi

# Verificar se jest está disponível
if ! npm list jest &> /dev/null; then
    log_error "Jest não está instalado. Execute: npm install"
    exit 1
fi

# Função para executar testes com diferentes configurações
run_tests() {
    local test_type=$1
    local description=$2
    local command=$3
    
    echo ""
    log_info "Executando $description..."
    echo "Comando: $command"
    echo "----------------------------------------"
    
    if eval $command; then
        log_success "$description - PASSOU ✨"
    else
        log_error "$description - FALHOU 💥"
        return 1
    fi
}

# Menu principal
if [ $# -eq 0 ]; then
    echo ""
    echo "Escolha o tipo de teste:"
    echo "1) Todos os testes"
    echo "2) Testes unitários"
    echo "3) Testes de integração"
    echo "4) Testes com coverage"
    echo "5) Testes em modo watch"
    echo "6) Lint + Type Check + Tests"
    echo "7) CI/CD Pipeline completo"
    echo ""
    read -p "Digite sua escolha (1-7): " choice
else
    choice=$1
fi

case $choice in
    1)
        log_info "Executando todos os testes..."
        run_tests "all" "Todos os Testes" "npm test"
        ;;
    2)
        log_info "Executando testes unitários..."
        run_tests "unit" "Testes Unitários" "npm test -- --testPathPattern='.*\.(test|spec)\.(ts|tsx)$' --testPathIgnorePatterns='integration'"
        ;;
    3)
        log_info "Executando testes de integração..."
        run_tests "integration" "Testes de Integração" "npm test -- --testPathPattern='integration'"
        ;;
    4)
        log_info "Executando testes com relatório de coverage..."
        run_tests "coverage" "Testes com Coverage" "npm run test:coverage"
        
        if [ -d "coverage" ]; then
            log_info "Relatório de coverage gerado em: coverage/lcov-report/index.html"
            
            # Abrir relatório no navegador (opcional)
            if command -v open &> /dev/null; then
                read -p "Abrir relatório de coverage no navegador? (y/n): " open_coverage
                if [ "$open_coverage" = "y" ]; then
                    open coverage/lcov-report/index.html
                fi
            fi
        fi
        ;;
    5)
        log_info "Iniciando testes em modo watch..."
        log_warning "Pressione 'q' para sair do modo watch"
        npm run test:watch
        ;;
    6)
        log_info "Executando pipeline de qualidade completo..."
        
        # Lint
        run_tests "lint" "ESLint" "npm run lint" || exit 1
        
        # Type Check
        run_tests "typecheck" "TypeScript Check" "npm run type-check" || exit 1
        
        # Testes
        run_tests "tests" "Todos os Testes" "npm test" || exit 1
        
        log_success "Pipeline de qualidade concluído com sucesso! 🎉"
        ;;
    7)
        log_info "Executando pipeline CI/CD completo..."
        
        # Limpar cache
        log_info "Limpando cache..."
        npm run test -- --clearCache > /dev/null 2>&1 || true
        
        # Lint
        run_tests "lint" "ESLint" "npm run lint" || exit 1
        
        # Type Check
        run_tests "typecheck" "TypeScript Check" "npm run type-check" || exit 1
        
        # Testes com coverage
        run_tests "tests" "Testes com Coverage" "npm run test:ci" || exit 1
        
        # Verificar limites de coverage
        log_info "Verificando limites de coverage..."
        
        if [ -f "coverage/coverage-summary.json" ]; then
            # Extrair percentuais de coverage
            LINES=$(cat coverage/coverage-summary.json | grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*' | head -1 | sed 's/.*"covered":\([0-9]*\).*/\1/')
            TOTAL_LINES=$(cat coverage/coverage-summary.json | grep -o '"lines":{"total":[0-9]*' | head -1 | sed 's/.*"total":\([0-9]*\).*/\1/')
            
            if [ ! -z "$LINES" ] && [ ! -z "$TOTAL_LINES" ] && [ "$TOTAL_LINES" -gt 0 ]; then
                COVERAGE_PERCENT=$((LINES * 100 / TOTAL_LINES))
                
                log_info "Coverage atual: ${COVERAGE_PERCENT}%"
                
                # Definir limite mínimo (ajuste conforme necessário)
                MIN_COVERAGE=80
                
                if [ "$COVERAGE_PERCENT" -ge "$MIN_COVERAGE" ]; then
                    log_success "Coverage está acima do limite mínimo (${MIN_COVERAGE}%)"
                else
                    log_warning "Coverage está abaixo do limite mínimo (${MIN_COVERAGE}%)"
                    log_warning "Considere adicionar mais testes"
                fi
            fi
        fi
        
        # Build (se existir script)
        if npm run | grep -q "build"; then
            run_tests "build" "Build do Projeto" "npm run build" || exit 1
        fi
        
        log_success "Pipeline CI/CD concluído com sucesso! 🚀"
        
        # Resumo final
        echo ""
        echo "📊 RESUMO DO PIPELINE"
        echo "===================="
        log_success "✅ Lint passou"
        log_success "✅ Type check passou"  
        log_success "✅ Testes passaram"
        if [ -f "coverage/coverage-summary.json" ]; then
            log_success "✅ Coverage report gerado"
        fi
        echo ""
        log_success "Projeto pronto para deploy! 🎉"
        ;;
    *)
        log_error "Opção inválida. Use 1-7."
        exit 1
        ;;
esac

echo ""
log_success "Execução concluída! 🎯"

# Estatísticas finais (se coverage existe)
if [ -f "coverage/coverage-summary.json" ]; then
    echo ""
    echo "📈 ESTATÍSTICAS DE COVERAGE"
    echo "=========================="
    
    # Usar node para extrair dados do JSON
    node -e "
        try {
            const fs = require('fs');
            const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
            const total = coverage.total;
            
            console.log('Linhas:     ' + total.lines.pct + '%');
            console.log('Funções:    ' + total.functions.pct + '%');
            console.log('Branches:   ' + total.branches.pct + '%');
            console.log('Statements: ' + total.statements.pct + '%');
        } catch(e) {
            console.log('Erro ao ler coverage summary');
        }
    " 2>/dev/null || echo "Coverage summary não disponível"
    
    echo ""
    log_info "Relatório detalhado: coverage/lcov-report/index.html"
fi