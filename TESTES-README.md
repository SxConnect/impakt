# ✅ Testes IMPAKT - Configuração Completa

## 🎯 Status: Configurado e Pronto

Os testes foram extraídos, atualizados para IMPAKT e integrados ao projeto backend.

---

## 📦 O que foi instalado

### Dependências de Teste
```json
{
  "jest": "^29.7.0",
  "jest-serial-runner": "^1.2.2",
  "supertest": "^6.3.0"
}
```

### Scripts Disponíveis
```bash
npm test              # Todos os testes
npm run test:unit     # Testes unitários + cobertura
npm run test:e2e      # Testes E2E ponta a ponta
npm run test:split    # Apenas CommissionCalculator
npm run test:escrow   # Apenas lógica de escrow
npm run test:watch    # Modo watch (reroda ao salvar)
npm run test:ci       # Modo CI/CD
```

---

## 📁 Estrutura de Testes

```
driva-backend/
├── tests/
│   ├── e2e/
│   │   └── fluxo-completo.test.js    # 30+ testes E2E
│   ├── unit/
│   │   ├── affiliate/
│   │   │   └── AffiliateChain.test.js
│   │   ├── commission/
│   │   │   └── CommissionCalculator.test.js  # 20+ testes
│   │   └── order/
│   │       └── escrow.test.js
│   └── setup/
│       ├── globalSetup.cjs           # Cria banco impakt_test
│       ├── globalTeardown.cjs        # Limpa após testes
│       └── dbHelper.cjs              # Helpers de banco
├── .kiro/
│   ├── hooks/
│   │   ├── split-guard.yaml          # Valida comissões ao salvar
│   │   ├── escrow-guard.yaml         # Valida escrow ao salvar
│   │   └── auto-test-generation.yaml # Gera testes automaticamente
│   └── steering/
│       └── testing.md                # Regras de negócio IMPAKT
├── jest.config.cjs                   # Configuração do Jest
└── IMPAKT_schema.sql                 # Schema do banco de teste
```

---

## 🗄️ Banco de Dados de Teste

### Criação Automática
O banco `impakt_test` é criado automaticamente pelo `globalSetup.cjs` quando você roda os testes.

### Configuração
```javascript
{
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'impakt_test'
}
```

### Criação Manual (se necessário)
```sql
-- PostgreSQL
CREATE DATABASE impakt_test;
GRANT ALL PRIVILEGES ON DATABASE impakt_test TO postgres;
```

---

## 🧪 Tipos de Testes

### 1. Testes Unitários
Testam componentes isolados:
- **CommissionCalculator** - Motor de cálculo de comissões
- **AffiliateChain** - Cadeia de indicação
- **Escrow** - Lógica de escrow e liberação

### 2. Testes E2E (End-to-End)
Testam fluxos completos:
1. Cadastro e ativação de conta
2. Criação de produto e link de afiliado
3. Compra via link rastreável
4. Escrow e liberação automática
5. Devolução e estorno
6. Recorrência mensal

---

## 🎯 Agent Hooks do Kiro

### 1. split-guard.yaml
**Trigger:** Ao salvar arquivos em `src/modules/commission/`

**Valida:**
- ✅ Soma dos percentuais == 100%
- ✅ Quem vende recebe a maior fatia
- ✅ Nível mais distante recebe mínimo 10%
- ✅ Valores em centavos sem diferença
- ✅ Devolução = zero comissões

**Comando:** `npm test -- --testPathPattern=CommissionCalculator --verbose`

### 2. escrow-guard.yaml
**Trigger:** Ao salvar arquivos em `src/modules/order/`

**Valida:**
- ✅ Escrow de 7 dias
- ✅ Liberação automática
- ✅ Confirmação antecipada
- ✅ Devolução total ao comprador
- ✅ Cancelamento de comissões

**Comando:** `npm test -- --testPathPattern=escrow --verbose`

### 3. auto-test-generation.yaml
**Trigger:** Ao criar novos módulos

**Ação:** Gera testes automaticamente para o novo módulo seguindo as regras de negócio do IMPAKT.

---

## 📊 Cobertura de Código

### Mínimos Exigidos
```javascript
global: {
  branches:  80%,
  functions: 80%,
  lines:     80%,
  statements: 80%
}

// Módulos críticos
commission: 95%
order:      90%
```

### Ver Cobertura
```bash
npm run test:unit
# Relatório em: coverage/index.html
```

---

## 🚀 Como Executar

### Primeira Vez
```bash
# 1. Certifique-se que o PostgreSQL está rodando
# 2. Execute os testes
npm test
```

### Testes Específicos
```bash
# Apenas testes unitários
npm run test:unit

# Apenas testes E2E
npm run test:e2e

# Apenas CommissionCalculator (crítico)
npm run test:split

# Apenas escrow
npm run test:escrow

# Modo watch (reroda ao salvar)
npm run test:watch
```

---

## 🐛 Troubleshooting

### Erro: "database does not exist"
```bash
# O globalSetup.cjs deve criar automaticamente
# Se não funcionar, crie manualmente:
psql -U postgres -c "CREATE DATABASE impakt_test;"
```

### Erro: "connection refused"
```bash
# Verifique se o PostgreSQL está rodando
# Windows: Services → PostgreSQL
# Ou inicie manualmente
```

### Erro: "module is not defined"
```bash
# Os arquivos de configuração devem ter extensão .cjs
# Já configurado:
# - jest.config.cjs
# - tests/setup/*.cjs
```

### Testes muito lentos
```bash
# Execute apenas testes unitários (mais rápidos)
npm run test:unit

# Ou testes específicos
npm run test:split
```

---

## 📝 Regras de Negócio (Steering)

O arquivo `.kiro/steering/testing.md` contém todas as regras:

### Valores Monetários
- ✅ Sempre em centavos: R$ 1,00 = 100
- ✅ Split sem diferença de 1 centavo
- ✅ Plataforma: exatamente 1%

### Afiliados
- ✅ Testar com 1, 2, 3, 4 e 5 níveis
- ✅ Quem vende recebe sempre a maior fatia
- ✅ Nível mais distante: mínimo 10%
- ✅ Soma dos percentuais == 100%

### Escrow
- ✅ Pedido pago → escrow_release_at = NOW + 7 dias
- ✅ Confirmação antecipada → libera antes
- ✅ Prazo vencido → cron libera automaticamente
- ✅ Devolução → NENHUM split executado

### Devolução
- ✅ 100% estornado ao comprador
- ✅ Todas as comissões → status = "cancelled"
- ✅ Carteiras NÃO atualizadas
- ✅ Acesso digital revogado

---

## ✅ Checklist de Verificação

Antes de fazer deploy:

- [ ] Todos os testes passando: `npm test`
- [ ] Cobertura mínima atingida: `npm run test:unit`
- [ ] Testes E2E funcionando: `npm run test:e2e`
- [ ] CommissionCalculator 100%: `npm run test:split`
- [ ] Escrow validado: `npm run test:escrow`
- [ ] Hooks do Kiro configurados
- [ ] Banco impakt_test criado

---

## 🎉 Status Final

### ✅ Tudo Configurado!

- ✅ Dependências instaladas
- ✅ Scripts de teste configurados
- ✅ Banco de dados de teste pronto
- ✅ Agent Hooks do Kiro ativos
- ✅ Steering file com regras de negócio
- ✅ Cobertura de código configurada
- ✅ Testes unitários e E2E prontos

### 🚀 Próximo Passo

Execute os testes:
```bash
npm test
```

---

**Data:** 15 de maio de 2026  
**Status:** ✅ Configurado e Pronto para Uso

---

*IMPAKT — Testes automatizados garantindo qualidade e confiabilidade* 🚀
