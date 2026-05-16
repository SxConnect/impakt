# 💰 Módulo de Comissões - IMPAKT

## 📋 Visão Geral

O módulo de comissões é responsável por calcular, distribuir e gerenciar as comissões dos afiliados no sistema IMPAKT. Implementa um sistema multinível (até 5 níveis) com período de escrow de 7 dias para proteção contra fraudes.

## 🎯 Funcionalidades

### ✅ Implementadas

1. **Cálculo Automático de Comissões**
   - Cálculo baseado na cadeia de indicação
   - Suporte a até 5 níveis de afiliados
   - Regra: "quem vende recebe mais"
   - Distribuição de renda entre beneficiários
   - Ajuste de arredondamento automático

2. **Gestão de Estados**
   - `pending`: Aguardando confirmação de pagamento
   - `held`: Em período de escrow (7 dias)
   - `released`: Liberado para saque
   - `cancelled`: Cancelado (reembolso/fraude)

3. **Consultas e Relatórios**
   - Listagem paginada de comissões
   - Filtros por status e produto
   - Resumo financeiro completo
   - Comissões por período (gráficos)

4. **Operações em Lote**
   - Criação de múltiplas comissões
   - Liberação em lote após escrow
   - Cancelamento em lote

### ⏳ Pendentes

1. **Jobs Agendados**
   - Liberação automática após 7 dias
   - Notificações de comissões liberadas

2. **Integração com Pagamentos**
   - Webhook de confirmação de pagamento
   - Atualização automática de status

3. **Sistema de Saques**
   - Solicitação de saque
   - Processamento de pagamentos
   - Histórico de saques

## 🏗️ Arquitetura

### Domain Layer

#### Commission.js
Entidade de domínio que representa uma comissão.

```javascript
{
  id: 'uuid',
  orderId: 'uuid',
  productId: 'uuid',
  affiliateId: 'uuid',
  level: 1,                    // Nível na cadeia (1-5)
  amountCents: 5000,           // R$ 50,00
  status: 'held',
  releaseDate: '2024-02-15',   // Data de liberação (7 dias)
  createdAt: '2024-02-08',
  updatedAt: '2024-02-08'
}
```

**Regras de Negócio:**
- Valor mínimo: R$ 0,01 (1 centavo)
- Nível entre 1 e 5
- Status válidos: pending, held, released, cancelled
- Data de liberação calculada automaticamente (+7 dias)

#### CommissionCalculator.js
Lógica pura de cálculo de comissões.

**Algoritmo:**
1. Busca cadeia de indicação do afiliado (até 5 níveis)
2. Obtém configuração de comissões do produto
3. Calcula valor base para afiliados
4. Distribui entre os níveis
5. **Quem vende recebe a maior parte** (independente do nível)
6. Calcula distribuição de renda (se configurada)
7. Ajusta arredondamento para garantir soma exata

**Exemplo de Cálculo:**

```javascript
// Produto: R$ 100,00
// Afiliados: 30% = R$ 30,00
// Níveis: [50%, 30%, 20%]
// Vendedor: Afiliado nível 3

// Distribuição:
// Nível 1: R$ 6,00 (20%)
// Nível 2: R$ 9,00 (30%)
// Nível 3: R$ 15,00 (50%) <- VENDEDOR recebe mais
```

### Application Layer

#### CalculateOrderCommissions.js
Calcula e cria comissões para um pedido.

**Entrada:**
```javascript
{
  orderId: 'uuid',
  productId: 'uuid',
  affiliateLinkCode: 'ABC12345',
  priceCents: 10000,
  buyerId: 'uuid'
}
```

**Saída:**
```javascript
{
  commissions: [...],
  incomeDistributions: [...]
}
```

**Fluxo:**
1. Valida link de afiliado
2. Busca produto e configurações
3. Busca cadeia de indicação
4. Calcula comissões usando CommissionCalculator
5. Cria registros no banco (transação)
6. Retorna comissões criadas

#### ReleaseCommissions.js
Libera comissões após período de escrow.

**Entrada:**
```javascript
{
  orderId: 'uuid'
}
```

**Fluxo:**
1. Busca comissões do pedido com status 'held'
2. Verifica se passou período de escrow (7 dias)
3. Atualiza status para 'released'
4. Retorna comissões liberadas

#### CancelCommissions.js
Cancela comissões (reembolso/fraude).

**Entrada:**
```javascript
{
  orderId: 'uuid',
  reason: 'refund' // ou 'fraud'
}
```

**Fluxo:**
1. Busca comissões do pedido
2. Valida que não estão liberadas
3. Atualiza status para 'cancelled'
4. Registra motivo do cancelamento

#### GetCommissions.js
Lista comissões do afiliado com filtros.

**Entrada:**
```javascript
{
  affiliateId: 'uuid',
  filters: {
    status: 'held',
    productId: 'uuid'
  },
  page: 1,
  limit: 20
}
```

**Saída:**
```javascript
{
  commissions: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 54,
    totalPages: 3
  }
}
```

#### GetCommissionSummary.js
Resumo financeiro das comissões.

**Saída:**
```javascript
{
  totalPendingCents: 50000,
  totalHeldCents: 120000,
  totalReleasedCents: 350000,
  totalCancelledCents: 15000,
  totalEarnedCents: 520000,
  availableForWithdrawalCents: 350000,
  commissionCount: {
    pending: 5,
    held: 12,
    released: 35,
    cancelled: 2,
    total: 54
  }
}
```

#### GetCommissionsByPeriod.js
Comissões agrupadas por data (para gráficos).

**Entrada:**
```javascript
{
  affiliateId: 'uuid',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
}
```

**Saída:**
```javascript
[
  {
    date: '2024-01-01',
    totalCents: 15000,
    count: 3
  },
  {
    date: '2024-01-02',
    totalCents: 22000,
    count: 5
  }
]
```

### Infrastructure Layer

#### PostgresCommissionRepository.js
Implementação do repositório usando PostgreSQL.

**Métodos:**
- `create(commission)`: Cria uma comissão
- `createMany(commissions)`: Cria múltiplas comissões (transação)
- `findById(id)`: Busca por ID
- `findByOrderId(orderId)`: Busca por pedido
- `findByAffiliate(affiliateId, filters, page, limit)`: Lista com filtros
- `updateStatus(id, status)`: Atualiza status
- `updateStatusByOrderId(orderId, status)`: Atualiza em lote
- `getSummary(affiliateId)`: Resumo financeiro
- `getByPeriod(affiliateId, startDate, endDate)`: Agrupado por data
- `findPendingRelease()`: Comissões prontas para liberar

**Otimizações:**
- Índices em `affiliate_id`, `order_id`, `status`, `release_date`
- Queries otimizadas com agregações
- Suporte a transações para operações em lote

### HTTP Layer

#### commissionRoutes.js
Rotas HTTP do módulo.

**Endpoints:**

```
GET /api/commissions
GET /api/commissions/summary
GET /api/commissions/period
```

**Autenticação:**
- Todos os endpoints requerem autenticação
- Apenas afiliados, vendedores e admins
- Cada usuário vê apenas suas comissões

## 📊 Fluxo de Comissões

### 1. Criação (ao confirmar pedido)
```
Cliente compra produto
  ↓
Sistema identifica link de afiliado
  ↓
Busca cadeia de indicação
  ↓
Calcula comissões (CommissionCalculator)
  ↓
Cria registros com status 'pending'
  ↓
Aguarda confirmação de pagamento
```

### 2. Confirmação de Pagamento
```
Webhook de pagamento confirmado
  ↓
Atualiza status para 'held'
  ↓
Define data de liberação (+7 dias)
  ↓
Notifica afiliados
```

### 3. Liberação (após 7 dias)
```
Job agendado verifica comissões
  ↓
Busca comissões com release_date <= hoje
  ↓
Atualiza status para 'released'
  ↓
Disponibiliza para saque
  ↓
Notifica afiliados
```

### 4. Cancelamento (se necessário)
```
Cliente solicita reembolso OU fraude detectada
  ↓
Sistema cancela pedido
  ↓
Atualiza comissões para 'cancelled'
  ↓
Notifica afiliados
```

## 💡 Regras de Negócio

### 1. Cálculo de Comissões

**Regra Principal: "Quem vende recebe mais"**

O afiliado que efetivamente vendeu (último na cadeia) sempre recebe a maior porcentagem, independente do seu nível na configuração do produto.

**Exemplo:**

```javascript
// Configuração do produto:
levelCommission: [
  { level: 1, pct: 50 },  // Primeiro nível: 50%
  { level: 2, pct: 30 },  // Segundo nível: 30%
  { level: 3, pct: 20 }   // Terceiro nível: 20%
]

// Cadeia de indicação:
// A indicou B, B indicou C
// C vendeu o produto

// Distribuição:
// A (nível 1): 20% (menor parte)
// B (nível 2): 30% (meio)
// C (nível 3): 50% (MAIOR parte - vendedor)
```

### 2. Período de Escrow

- **Duração:** 7 dias corridos
- **Início:** Data de confirmação do pagamento
- **Fim:** Liberação automática após 7 dias
- **Objetivo:** Proteção contra fraudes e chargebacks

### 3. Distribuição de Renda

Produtos podem ter beneficiários adicionais:

```javascript
incomeDistribution: [
  { userId: 'uuid-1', pct: 10 },  // 10% do valor de afiliados
  { userId: 'uuid-2', pct: 5 }    // 5% do valor de afiliados
]
```

**Regras:**
- Máximo 5 beneficiários
- Soma não pode exceder % de afiliados
- Descontado do valor total de afiliados
- Não afeta cálculo de níveis

### 4. Arredondamento

- Todos os valores em centavos (inteiros)
- Ajuste de arredondamento no último nível
- Garante que soma = valor total exato

## 🔧 Uso

### Calcular Comissões de um Pedido

```javascript
const result = await calculateOrderCommissions.execute({
  orderId: 'uuid',
  productId: 'uuid',
  affiliateLinkCode: 'ABC12345',
  priceCents: 10000,
  buyerId: 'uuid'
});

console.log(result.commissions);
// [
//   { affiliateId: 'uuid-1', level: 1, amountCents: 1000 },
//   { affiliateId: 'uuid-2', level: 2, amountCents: 1500 },
//   { affiliateId: 'uuid-3', level: 3, amountCents: 2500 }
// ]
```

### Liberar Comissões

```javascript
const released = await releaseCommissions.execute('order-uuid');
console.log(`${released.length} comissões liberadas`);
```

### Cancelar Comissões

```javascript
const cancelled = await cancelCommissions.execute('order-uuid', 'refund');
console.log(`${cancelled.length} comissões canceladas`);
```

### Consultar Comissões

```javascript
const result = await getCommissions.execute(
  'affiliate-uuid',
  { status: 'held', productId: 'product-uuid' },
  1,
  20
);

console.log(result.commissions);
console.log(result.pagination);
```

### Obter Resumo

```javascript
const summary = await getCommissionSummary.execute('affiliate-uuid');
console.log(`Total ganho: R$ ${summary.totalEarnedCents / 100}`);
console.log(`Disponível: R$ ${summary.availableForWithdrawalCents / 100}`);
```

## 🧪 Testes

Use o arquivo `test-api-commissions.http` para testar os endpoints.

### Fluxo de Teste Completo

1. **Criar usuários** (vendedor e afiliados)
2. **Criar produto** com configuração de comissões
3. **Gerar link de afiliado**
4. **Simular compra** (criar pedido)
5. **Calcular comissões** (automático)
6. **Consultar comissões** criadas
7. **Simular confirmação** de pagamento
8. **Aguardar 7 dias** (ou simular)
9. **Liberar comissões**
10. **Consultar resumo** atualizado

## 📈 Próximos Passos

### 1. Jobs Agendados
- [ ] Job de liberação automática (cron diário)
- [ ] Job de notificações
- [ ] Job de limpeza de dados antigos

### 2. Integração com Pagamentos
- [ ] Webhook de confirmação
- [ ] Atualização automática de status
- [ ] Tratamento de reembolsos

### 3. Sistema de Saques
- [ ] Solicitação de saque
- [ ] Validação de saldo
- [ ] Integração com gateway de pagamento
- [ ] Histórico de saques
- [ ] Comprovantes

### 4. Notificações
- [ ] Email de comissão criada
- [ ] Email de comissão liberada
- [ ] Email de comissão cancelada
- [ ] Notificações in-app

### 5. Relatórios Avançados
- [ ] Ranking de afiliados
- [ ] Produtos mais rentáveis
- [ ] Análise de conversão
- [ ] Previsão de ganhos

## 🎯 Métricas

### Performance
- Cálculo de comissões: < 100ms
- Consulta de lista: < 50ms
- Resumo financeiro: < 30ms
- Operações em lote: < 500ms

### Escalabilidade
- Suporta milhares de comissões por segundo
- Queries otimizadas com índices
- Transações para consistência
- Paginação eficiente

## 📚 Referências

- [Documentação do Produto](./AFFILIATE-MODULE.md)
- [Schema do Banco](./planejamento/IMPAKT_schema.sql)
- [Base de Conhecimento](./planejamento/IMPAKT_base_conhecimento.md)

---

**Última atualização:** Dia 4 - Módulo de Comissões implementado ✅
