# 💳 Pagamentos - Guia Rápido

## 🚀 Início Rápido

### 1. Configurar Gateway

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

### 2. Processar Pagamento

```javascript
POST /api/payments
{
  "orderId": "uuid",
  "provider": "pagarme",  // ⭐ Escolhe o gateway
  "method": "credit_card",
  "paymentData": {
    "card": {
      "number": "4111111111111111",
      "holder_name": "João Silva",
      "exp_month": 12,
      "exp_year": 2025,
      "cvv": "123"
    },
    "installments": 1
  }
}
```

### 3. Trocar de Gateway

```javascript
// Usar Stripe em vez de Pagar.me
POST /api/payments
{
  "orderId": "uuid",
  "provider": "stripe",  // ⭐ Mudou aqui
  "method": "credit_card",
  "paymentData": { ... }
}
```

## 🔄 Métodos de Pagamento

### Cartão de Crédito

```javascript
{
  "provider": "pagarme",
  "method": "credit_card",
  "paymentData": {
    "card": { ... },
    "installments": 3  // Até 12x
  }
}
```

### Boleto

```javascript
{
  "provider": "asaas",
  "method": "boleto",
  "paymentData": {
    "dueDate": "2024-12-31"
  }
}
```

### PIX

```javascript
{
  "provider": "pagarme",
  "method": "pix",
  "paymentData": {}
}
```

## 🎯 Gateways Disponíveis

| Gateway | Cartão | Boleto | PIX | Parcelamento |
|---------|--------|--------|-----|--------------|
| Pagar.me | ✅ | ✅ | ✅ | ✅ (12x) |
| Stripe | ✅ | ❌ | ✅ | ✅ |
| Asaas | ✅ | ✅ | ✅ | ✅ (12x) |

## 🔧 Escolher Gateway Dinamicamente

```javascript
// Por valor
const provider = order.totalCents > 100000 ? 'stripe' : 'pagarme';

// Por método
const provider = method === 'boleto' ? 'asaas' : 'stripe';

// Por região
const provider = buyer.state === 'SP' ? 'pagarme' : 'asaas';
```

## 📡 Webhooks

```javascript
// Endpoint público (sem autenticação)
POST /api/payments/webhook/pagarme
POST /api/payments/webhook/stripe
POST /api/payments/webhook/asaas
```

## 💰 Reembolso

```javascript
POST /api/payments/:id/refund
{
  "reason": "Cliente solicitou"
}
```

## 🚀 Adicionar Novo Gateway

```javascript
// 1. Criar adapter
export class NovoGateway extends PaymentGateway {
    // Implementar métodos
}

// 2. Registrar na factory
case 'novo':
    return new NovoGateway(config);

// 3. Usar
provider: 'novo'
```

## 📚 Documentação Completa

- [PAYMENT-ARCHITECTURE.md](./PAYMENT-ARCHITECTURE.md) - Arquitetura detalhada
- [test-api-payments.http](./test-api-payments.http) - Testes de API
- [DAY-6-SUMMARY.md](./DAY-6-SUMMARY.md) - Resumo do desenvolvimento
