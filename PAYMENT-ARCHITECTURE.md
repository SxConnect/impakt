# 💳 Arquitetura Hexagonal de Pagamentos - IMPAKT

## 🎯 Objetivo

Criar um sistema de pagamentos **flexível e desacoplado** que permite trocar facilmente entre diferentes gateways (Pagar.me, Stripe, Asaas) sem afetar o restante do sistema.

## 🏗️ Arquitetura Hexagonal (Ports & Adapters)

### Conceito

A arquitetura hexagonal separa a lógica de negócio (núcleo) das implementações externas (adapters), permitindo:

1. **Trocar implementações** sem afetar o código de negócio
2. **Testar facilmente** com mocks
3. **Adicionar novos gateways** sem modificar código existente
4. **Manter o sistema desacoplado** e manutenível

### Estrutura

```
src/modules/payment/
├── domain/                          # NÚCLEO (Ports)
│   ├── Payment.js                   # Entidade de domínio
│   ├── PaymentRepository.js         # Port (interface)
│   └── PaymentGateway.js            # Port (interface) ⭐
│
├── application/                     # Casos de Uso
│   ├── ProcessPayment.js            # Processa pagamento
│   ├── HandleWebhook.js             # Processa webhooks
│   ├── GetPayment.js                # Busca pagamento
│   └── RefundPayment.js             # Reembolsa pagamento
│
├── infrastructure/                  # ADAPTERS (Implementações)
│   ├── PostgresPaymentRepository.js # Adapter para PostgreSQL
│   └── gateways/                    # Adapters para Gateways ⭐
│       ├── PaymentGatewayFactory.js # Factory para criar gateways
│       ├── PagarmeGateway.js        # Adapter para Pagar.me
│       ├── StripeGateway.js         # Adapter para Stripe
│       └── AsaasGateway.js          # Adapter para Asaas
│
└── http/                            # Interface HTTP
    └── paymentRoutes.js             # Rotas REST
```

## 🔌 Port: PaymentGateway

O **Port** é uma interface que define o contrato que todos os gateways devem seguir:

```javascript
export class PaymentGateway {
    // Métodos que TODOS os gateways devem implementar
    getProviderName()
    createCustomer(customerData)
    processCreditCard(paymentData)
    generateBoleto(paymentData)
    generatePix(paymentData)
    getPaymentStatus(paymentId)
    refundPayment(paymentId, amountCents)
    cancelPayment(paymentId)
    validateWebhook(payload, signature)
    processWebhook(payload)
}
```

## 🔧 Adapters: Implementações dos Gateways

Cada gateway implementa a interface `PaymentGateway`:

### 1. PagarmeGateway

```javascript
export class PagarmeGateway extends PaymentGateway {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiUrl = 'https://api.pagar.me/core/v5';
    }

    getProviderName() {
        return 'pagarme';
    }

    async processCreditCard(paymentData) {
        // Implementação específica do Pagar.me
        // Chama API do Pagar.me
        // Retorna formato padronizado
    }

    // ... outros métodos
}
```

### 2. StripeGateway

```javascript
export class StripeGateway extends PaymentGateway {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiUrl = 'https://api.stripe.com/v1';
    }

    getProviderName() {
        return 'stripe';
    }

    async processCreditCard(paymentData) {
        // Implementação específica do Stripe
        // Chama API do Stripe
        // Retorna formato padronizado
    }

    // ... outros métodos
}
```

### 3. AsaasGateway

```javascript
export class AsaasGateway extends PaymentGateway {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiUrl = 'https://www.asaas.com/api/v3';
    }

    getProviderName() {
        return 'asaas';
    }

    async processCreditCard(paymentData) {
        // Implementação específica do Asaas
        // Chama API do Asaas
        // Retorna formato padronizado
    }

    // ... outros métodos
}
```

## 🏭 Factory: PaymentGatewayFactory

A **Factory** cria a instância correta do gateway baseado na configuração:

```javascript
export class PaymentGatewayFactory {
    static create(provider, config = {}) {
        switch (provider.toLowerCase()) {
            case 'pagarme':
                return new PagarmeGateway(config);
            
            case 'stripe':
                return new StripeGateway(config);
            
            case 'asaas':
                return new AsaasGateway(config);
            
            default:
                throw new Error(`Gateway não suportado: ${provider}`);
        }
    }

    static createDefault() {
        const provider = process.env.PAYMENT_PROVIDER || 'pagarme';
        return this.create(provider);
    }
}
```

## 🔄 Como Trocar de Gateway

### 1. Via Variável de Ambiente

```bash
# .env
PAYMENT_PROVIDER=pagarme  # ou 'stripe' ou 'asaas'

# Pagar.me
PAGARME_API_KEY=sk_test_...
PAGARME_WEBHOOK_SECRET=...

# Stripe
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=...

# Asaas
ASAAS_API_KEY=$aact_...
ASAAS_WEBHOOK_SECRET=...
```

### 2. Via Código (por pedido)

```javascript
// Usar Pagar.me para este pedido
await processPayment.execute({
    orderId: 'uuid',
    provider: 'pagarme',  // ⭐ Escolhe o gateway
    method: 'credit_card',
    paymentData: { ... }
});

// Usar Stripe para outro pedido
await processPayment.execute({
    orderId: 'uuid',
    provider: 'stripe',  // ⭐ Escolhe o gateway
    method: 'credit_card',
    paymentData: { ... }
});
```

### 3. Via Configuração Dinâmica

```javascript
// Escolher gateway baseado em regras de negócio
const provider = order.totalCents > 100000 ? 'stripe' : 'pagarme';

await processPayment.execute({
    orderId: order.id,
    provider,  // ⭐ Dinâmico
    method: 'credit_card',
    paymentData: { ... }
});
```

## ✅ Vantagens da Arquitetura

### 1. Desacoplamento

```javascript
// ❌ SEM arquitetura hexagonal
async function processPayment(order) {
    // Código acoplado ao Pagar.me
    const pagarme = new PagarmeSDK(apiKey);
    const result = await pagarme.transactions.create({ ... });
    // Se mudar para Stripe, precisa reescrever tudo!
}

// ✅ COM arquitetura hexagonal
async function processPayment(order, provider) {
    const gateway = PaymentGatewayFactory.create(provider);
    const result = await gateway.processCreditCard({ ... });
    // Funciona com qualquer gateway!
}
```

### 2. Testabilidade

```javascript
// Mock do gateway para testes
class MockGateway extends PaymentGateway {
    async processCreditCard(data) {
        return {
            paymentId: 'mock_123',
            status: 'paid',
            providerResponse: {}
        };
    }
}

// Teste sem chamar API real
const gateway = new MockGateway();
const result = await processPayment.execute({ gateway });
```

### 3. Extensibilidade

```javascript
// Adicionar novo gateway sem modificar código existente
export class MercadoPagoGateway extends PaymentGateway {
    getProviderName() {
        return 'mercadopago';
    }

    async processCreditCard(paymentData) {
        // Implementação do Mercado Pago
    }

    // ... outros métodos
}

// Registrar na factory
// Pronto! Sistema funciona com novo gateway
```

## 🔐 Segurança

### Validação de Webhooks

Cada gateway valida seus webhooks de forma específica:

```javascript
// Pagar.me
async validateWebhook(payload, signature) {
    const hash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
    return hash === signature;
}

// Stripe
async validateWebhook(payload, signature) {
    const stripe = require('stripe')(this.apiKey);
    const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
    );
    return true;
}

// Asaas
async validateWebhook(payload, signature) {
    // Asaas usa token de acesso
    return payload.token === this.webhookSecret;
}
```

## 📊 Fluxo de Pagamento

```
1. Cliente escolhe método de pagamento
   ↓
2. Frontend envia para API
   POST /api/payments
   {
     orderId: 'uuid',
     provider: 'pagarme',  // ou 'stripe', 'asaas'
     method: 'credit_card',
     paymentData: { ... }
   }
   ↓
3. ProcessPayment cria gateway
   const gateway = PaymentGatewayFactory.create('pagarme');
   ↓
4. Gateway processa pagamento
   const result = await gateway.processCreditCard(data);
   ↓
5. Sistema salva pagamento
   await paymentRepository.create(payment);
   ↓
6. Se pago, confirma pedido
   await confirmPayment.execute(orderId);
   ↓
7. Webhook confirma (assíncrono)
   POST /api/payments/webhook/pagarme
   ↓
8. HandleWebhook processa
   const gateway = PaymentGatewayFactory.create('pagarme');
   await gateway.processWebhook(payload);
   ↓
9. Atualiza status e confirma pedido
```

## 🎨 Padrões de Design Utilizados

### 1. **Hexagonal Architecture (Ports & Adapters)**
- Separa núcleo de implementações externas
- Permite trocar implementações facilmente

### 2. **Strategy Pattern**
- Cada gateway é uma estratégia diferente
- Escolhida em tempo de execução

### 3. **Factory Pattern**
- `PaymentGatewayFactory` cria instâncias
- Centraliza lógica de criação

### 4. **Adapter Pattern**
- Cada gateway adapta sua API para interface comum
- Sistema usa interface, não implementação

### 5. **Repository Pattern**
- `PaymentRepository` abstrai persistência
- Pode trocar banco de dados facilmente

## 🚀 Como Adicionar Novo Gateway

### Passo 1: Criar Adapter

```javascript
// src/modules/payment/infrastructure/gateways/NovoGateway.js
import { PaymentGateway } from '../../domain/PaymentGateway.js';

export class NovoGateway extends PaymentGateway {
    constructor(config) {
        super();
        this.apiKey = config.apiKey;
        this.apiUrl = config.apiUrl;
    }

    getProviderName() {
        return 'novo';
    }

    async processCreditCard(paymentData) {
        // Implementar chamada à API
        // Retornar formato padronizado
    }

    // Implementar todos os métodos da interface
}
```

### Passo 2: Registrar na Factory

```javascript
// PaymentGatewayFactory.js
import { NovoGateway } from './NovoGateway.js';

static create(provider, config = {}) {
    switch (provider.toLowerCase()) {
        case 'pagarme':
            return new PagarmeGateway(config);
        
        case 'stripe':
            return new StripeGateway(config);
        
        case 'asaas':
            return new AsaasGateway(config);
        
        case 'novo':  // ⭐ Adicionar aqui
            return new NovoGateway(config);
        
        default:
            throw new Error(`Gateway não suportado: ${provider}`);
    }
}
```

### Passo 3: Configurar

```bash
# .env
NOVO_API_KEY=...
NOVO_WEBHOOK_SECRET=...
```

### Passo 4: Usar

```javascript
await processPayment.execute({
    orderId: 'uuid',
    provider: 'novo',  // ⭐ Pronto!
    method: 'credit_card',
    paymentData: { ... }
});
```

## 📝 Configuração por Gateway

### Pagar.me

```bash
PAYMENT_PROVIDER=pagarme
PAGARME_API_KEY=sk_test_...
PAGARME_API_URL=https://api.pagar.me/core/v5
PAGARME_WEBHOOK_SECRET=...
```

**Suporta:**
- ✅ Cartão de crédito
- ✅ Boleto bancário
- ✅ PIX
- ✅ Parcelamento (até 12x)

### Stripe

```bash
PAYMENT_PROVIDER=stripe
STRIPE_API_KEY=sk_test_...
STRIPE_API_URL=https://api.stripe.com/v1
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Suporta:**
- ✅ Cartão de crédito
- ❌ Boleto bancário (não nativo)
- ✅ PIX
- ✅ Parcelamento

### Asaas

```bash
PAYMENT_PROVIDER=asaas
ASAAS_API_KEY=$aact_...
ASAAS_API_URL=https://www.asaas.com/api/v3
ASAAS_WEBHOOK_SECRET=...
```

**Suporta:**
- ✅ Cartão de crédito
- ✅ Boleto bancário
- ✅ PIX
- ✅ Parcelamento (até 12x)

## 🎯 Benefícios para o Negócio

1. **Flexibilidade**: Trocar de gateway em minutos
2. **Redundância**: Usar múltiplos gateways simultaneamente
3. **Otimização**: Escolher gateway por taxa, conversão, etc.
4. **Mitigação de Risco**: Não depender de um único fornecedor
5. **Testes A/B**: Comparar performance entre gateways
6. **Negociação**: Poder de barganha com fornecedores

## 📚 Referências

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Ports and Adapters Pattern](https://herbertograca.com/2017/09/14/ports-adapters-architecture/)
- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [Factory Pattern](https://refactoring.guru/design-patterns/factory-method)

---

**Arquitetura implementada:** Hexagonal (Ports & Adapters)  
**Padrões:** Strategy, Factory, Adapter, Repository  
**Gateways suportados:** Pagar.me, Stripe, Asaas  
**Extensível:** Sim, adicionar novos gateways é trivial
