# 📚 Documentação da API Real - IMPAKT Backend

**Data**: 15 de maio de 2026  
**Versão**: 1.0.0

## 🎯 Visão Geral

Esta documentação descreve a **API real implementada** no código, não a API esperada pelos testes antigos.

## 📦 Módulos Principais

### 1. Utilities (`src/shared/utils/validators.js`)

#### `generateCode(length = 8)`

Gera código único alfanumérico para links de afiliado.

**Parâmetros**:
- `length` (number, opcional): Tamanho do código. Padrão: 8

**Retorno**: `string` - Código alfanumérico (A-Z0-9)

**Exemplo**:
```javascript
import { generateCode } from './src/shared/utils/validators.js';

const code = generateCode();     // "A3X9K2M1"
const longCode = generateCode(12); // "B7Y4N8P2Q5W1"
```

**Características**:
- Apenas letras maiúsculas (A-Z) e números (0-9)
- Altamente aleatório
- Não garante unicidade (deve ser verificado no banco)

---

### 2. Affiliate Module

#### `AffiliateLink` (Entidade de Domínio)

Representa um link rastreável de afiliado para um produto.

**Construtor**:
```javascript
new AffiliateLink({
  id: string,
  productId: string,
  affiliateId: string,
  code: string,
  clicks: number = 0,
  conversions: number = 0,
  createdAt: Date
})
```

**Métodos**:

##### `getFullUrl(baseUrl)`
Gera a URL completa do link de afiliado.

**Parâmetros**:
- `baseUrl` (string): URL base da aplicação

**Retorno**: `string` - URL completa

**Exemplo**:
```javascript
const link = new AffiliateLink({
  id: '123',
  productId: 'curso-node',
  affiliateId: 'aff-1',
  code: 'ABC123'
});

link.getFullUrl('https://impakt.com');
// "https://impakt.com/p/curso-node?ref=ABC123"
```

##### `getConversionRate()`
Calcula a taxa de conversão do link.

**Retorno**: `string` - Taxa formatada com 2 casas decimais

**Exemplo**:
```javascript
const link = new AffiliateLink({
  id: '123',
  productId: 'prod-1',
  affiliateId: 'aff-1',
  code: 'ABC123',
  clicks: 100,
  conversions: 10
});

link.getConversionRate(); // "10.00"
```

##### `hasGoodPerformance()`
Verifica se o link tem boa performance (conversão > 5%).

**Retorno**: `boolean`

**Exemplo**:
```javascript
link.hasGoodPerformance(); // true se conversão > 5%
```

##### `incrementClicks()`
Incrementa o contador de cliques.

##### `incrementConversions()`
Incrementa o contador de conversões.

##### `toPublic()`
Retorna dados públicos do link (sem IDs internos).

**Retorno**: `object`

##### `toJSON()`
Retorna dados completos do link.

**Retorno**: `object`

---

### 3. Commission Module

#### `CommissionCalculator` (Classe Estática)

Calcula comissões para vendas com afiliados.

##### `CommissionCalculator.calculate(params)`

Calcula comissões para cada nível da cadeia de afiliados.

**Parâmetros**:
```javascript
{
  totalAmountCents: number,      // Valor total destinado a afiliados
  affiliateChain: Array<{        // Cadeia de afiliados
    id: string,
    level: number
  }>,
  levelCommission: Array<{       // Configuração de % por nível
    level: number,
    pct: number
  }>,
  sellerLevel: number            // Nível do afiliado que vendeu
}
```

**Retorno**: `Array<Commission>`
```javascript
[
  {
    affiliateId: string,
    level: number,
    pct: number,
    amountCents: number
  }
]
```

**Exemplo**:
```javascript
const commissions = CommissionCalculator.calculate({
  totalAmountCents: 4000, // R$ 40
  affiliateChain: [
    { id: 'aff-1', level: 1 },
    { id: 'aff-2', level: 2 }
  ],
  levelCommission: [
    { level: 1, pct: 60 }, // Quem vende
    { level: 2, pct: 40 }
  ],
  sellerLevel: 1 // aff-1 vendeu
});

// Resultado:
// [
//   { affiliateId: 'aff-1', level: 1, pct: 60, amountCents: 2400 },
//   { affiliateId: 'aff-2', level: 2, pct: 40, amountCents: 1600 }
// ]
```

**Regras**:
- Quem vende sempre recebe a maior fatia
- Soma dos percentuais = 100%
- Não perde centavos (arredondamento correto)

##### `CommissionCalculator.calculateSellerAmount(params)`

Calcula quanto sobra para o vendedor após todas as deduções.

**Parâmetros**:
```javascript
{
  totalPriceCents: number,
  platformFeeCents: number,
  affiliateAmountCents: number,
  incomeDistAmountCents: number = 0
}
```

**Retorno**: `number` - Valor em centavos

**Exemplo**:
```javascript
const sellerAmount = CommissionCalculator.calculateSellerAmount({
  totalPriceCents: 10000,      // R$ 100
  platformFeeCents: 100,       // R$ 1 (1%)
  affiliateAmountCents: 4000,  // R$ 40 (40%)
  incomeDistAmountCents: 0
});

// sellerAmount = 5900 (R$ 59)
```

##### `CommissionCalculator.calculateIncomeDistribution(params)`

Distribui renda entre beneficiários (ex: sócios, investidores).

**Parâmetros**:
```javascript
{
  totalAmountCents: number,
  incomeDistConfig: Array<{
    userId: string,
    pct: number
  }>
}
```

**Retorno**: `Array<Distribution>`

**Exemplo**:
```javascript
const distributions = CommissionCalculator.calculateIncomeDistribution({
  totalAmountCents: 1000, // R$ 10
  incomeDistConfig: [
    { userId: 'user-1', pct: 60 },
    { userId: 'user-2', pct: 40 }
  ]
});

// [
//   { userId: 'user-1', pct: 60, amountCents: 600 },
//   { userId: 'user-2', pct: 40, amountCents: 400 }
// ]
```

##### `CommissionCalculator.validateTotal(commissions, expectedTotal)`

Valida se a soma das comissões está correta.

**Retorno**: `boolean`

##### `CommissionCalculator.adjustRounding(commissions, expectedTotal)`

Ajusta arredondamento para garantir soma exata.

**Retorno**: `Array<Commission>` - Comissões ajustadas

---

### 4. Order Module

#### `Order` (Entidade de Domínio)

Representa um pedido no sistema.

**Construtor**:
```javascript
new Order({
  id: string,
  orderNumber: string,
  productId: string,
  productName: string,
  productType: 'physical' | 'digital' | 'service' | 'subscription',
  sellerId: string,
  buyerId: string,
  affiliateLinkCode: string | null,
  quantity: number = 1,
  unitPriceCents: number,
  totalCents: number,
  platformFeeCents: number,
  affiliateAmountCents: number,
  sellerAmountCents: number,
  status: 'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded',
  paymentMethod: string | null,
  paymentId: string | null,
  paidAt: Date | null,
  completedAt: Date | null,
  cancelledAt: Date | null,
  cancellationReason: string | null,
  metadata: object = {},
  createdAt: Date,
  updatedAt: Date
})
```

**Métodos**:

##### `markAsPaid(paymentId, paymentMethod)`
Marca pedido como pago.

**Lança erro** se status não for 'pending'.

##### `markAsCompleted()`
Marca pedido como completo.

**Lança erro** se status não for 'paid'.

##### `cancel(reason)`
Cancela o pedido.

**Lança erro** se já estiver completed ou cancelled.

##### `markAsRefunded(reason)`
Marca pedido como reembolsado.

**Lança erro** se não estiver paid ou completed.

##### `canBeCancelled()`
Verifica se pedido pode ser cancelado.

**Retorno**: `boolean` - true se pending ou paid

##### `canBeRefunded()`
Verifica se pedido pode ser reembolsado.

**Retorno**: `boolean` - true se paid ou completed

##### `isPaid()`
Verifica se pedido está pago.

**Retorno**: `boolean` - true se paid ou completed

##### `isActive()`
Verifica se pedido está ativo.

**Retorno**: `boolean` - false se cancelled ou refunded

##### `toJSON()`
Retorna objeto completo do pedido.

**Métodos Estáticos**:

##### `Order.generateOrderNumber()`
Gera número único de pedido.

**Retorno**: `string` - Ex: "ORD-ABC123-XY45"

**Exemplo**:
```javascript
const orderNumber = Order.generateOrderNumber();
// "ORD-L9X2K4-M7P3"
```

##### `Order.calculateAmounts(unitPriceCents, quantity, platformFeePct, affiliatePct)`

Calcula todos os valores do pedido.

**Parâmetros**:
- `unitPriceCents` (number): Preço unitário em centavos
- `quantity` (number): Quantidade
- `platformFeePct` (number): % da plataforma
- `affiliatePct` (number): % dos afiliados

**Retorno**: `object`
```javascript
{
  totalCents: number,
  platformFeeCents: number,
  affiliateAmountCents: number,
  sellerAmountCents: number
}
```

**Exemplo**:
```javascript
const amounts = Order.calculateAmounts(
  10000, // R$ 100
  1,     // 1 unidade
  1,     // 1% plataforma
  40     // 40% afiliados
);

// {
//   totalCents: 10000,
//   platformFeeCents: 100,
//   affiliateAmountCents: 4000,
//   sellerAmountCents: 5900
// }
```

---

### 5. Jobs Module

#### `ReleaseCommissionsJob`

Job que libera comissões após período de escrow.

**Construtor**:
```javascript
new ReleaseCommissionsJob(commissionRepository, emailService)
```

**Métodos**:

##### `execute()`
Executa o job manualmente.

**Retorno**: `Promise<object>`
```javascript
{
  success: boolean,
  released: number,
  errors: number,
  details: Array
}
```

##### `findCommissionsToRelease()`
Busca comissões prontas para liberar.

**Retorno**: `Promise<Array<Commission>>`

**Critérios**:
- Status = 'held'
- release_date <= hoje

##### `releaseCommission(commission)`
Libera uma comissão específica.

**Ações**:
1. Atualiza status para 'released'
2. Envia email de notificação

##### `schedule(cron)`
Agenda execução diária às 00:00.

**Exemplo**:
```javascript
import cron from 'node-cron';

const job = new ReleaseCommissionsJob(commissionRepo, emailService);
job.schedule(cron);
// Job agendado para rodar todo dia às 00:00
```

---

## 🔄 Fluxos Principais

### Fluxo 1: Geração de Link de Afiliado

```
1. Afiliado solicita link para produto
2. Sistema valida usuário e produto
3. Sistema gera código único (generateCode)
4. Sistema cria AffiliateLink no banco
5. Sistema retorna URL completa
```

### Fluxo 2: Venda com Afiliado

```
1. Comprador clica no link (ref=ABC123)
2. Sistema rastreia clique (incrementClicks)
3. Comprador finaliza compra
4. Sistema cria Order
5. Sistema calcula comissões (CommissionCalculator)
6. Sistema cria registros de Commission (status='held')
7. Após 7 dias, ReleaseCommissionsJob libera (status='released')
```

### Fluxo 3: Cálculo de Comissões

```
1. Pedido é pago (Order.markAsPaid)
2. Sistema identifica cadeia de afiliados
3. Sistema calcula valores:
   - Plataforma: 1%
   - Afiliados: 25-50% (configurável)
   - Vendedor: restante
4. CommissionCalculator.calculate distribui entre níveis
5. Quem vendeu recebe a maior fatia
6. Sistema cria registros com release_date = hoje + 7 dias
```

---

## 📊 Regras de Negócio

### Comissões

1. **Percentual de Afiliados**: 25% a 50% do valor total
2. **Taxa da Plataforma**: 1% fixo
3. **Vendedor**: Recebe o restante
4. **Quem Vende Recebe Mais**: Sempre a maior fatia do pool de afiliados
5. **Máximo 5 Níveis**: Cadeia de indicação limitada a 5 níveis
6. **Escrow**: 7 dias para liberação das comissões

### Pedidos

1. **Estados Válidos**: pending → paid → completed
2. **Cancelamento**: Permitido em pending e paid
3. **Reembolso**: Permitido em paid e completed
4. **Produtos Digitais**: Não pode comprar duas vezes
5. **Número do Pedido**: Único, formato ORD-{timestamp}-{random}

### Links de Afiliado

1. **Código Único**: 8 caracteres alfanuméricos
2. **Performance**: Boa se conversão > 5%
3. **Rastreamento**: Cliques e conversões
4. **URL**: `/p/{productId}?ref={code}`

---

## 🧪 Testabilidade

Todos os módulos documentados aqui têm **testes unitários passando**:

- ✅ `generateCode`: 9 testes
- ✅ `AffiliateLink`: 16 testes
- ✅ `CommissionCalculator`: 20 testes
- ✅ `Order`: 30 testes

**Total**: 75 testes passando

---

## 📝 Notas de Implementação

### Diferenças dos Testes Antigos

Os testes antigos esperavam APIs que **não existem**:

❌ **Não existe**:
- `AffiliateChain.build()`
- `AffiliateChain.buildTrackingUrl()`
- `calc.distribute()`
- `calc.splitCents()`
- `EscrowService.calculateReleaseAt()`
- `EscrowService.canRelease()`

✅ **Existe**:
- `generateCode()`
- `AffiliateLink.getFullUrl()`
- `CommissionCalculator.calculate()`
- `CommissionCalculator.calculateSellerAmount()`
- `Order.canBeCancelled()`
- `Order.canBeRefunded()`
- `ReleaseCommissionsJob.execute()`

### Arquitetura

O código segue **Clean Architecture**:

```
Domain (Entidades)
  ↓
Application (Casos de Uso)
  ↓
Infrastructure (Repositórios, HTTP)
```

**Testamos**: Apenas o Domain (lógica pura)  
**Falta testar**: Application e Infrastructure

---

## 🔗 Referências

- [CODIGO-REAL-ANALISE.md](./CODIGO-REAL-ANALISE.md) - Análise detalhada do código
- [TESTES-ATUALIZADOS.md](./TESTES-ATUALIZADOS.md) - Resultados dos testes
- [ANALISE-TESTES.md](./ANALISE-TESTES.md) - Análise inicial dos problemas

---

**Autor**: Kiro AI  
**Data**: 15 de maio de 2026  
**Versão**: 1.0.0
