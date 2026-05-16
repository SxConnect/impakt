# 💰 Comissões - Guia Rápido

## 🎯 Endpoints

```bash
# Listar comissões
GET /api/commissions?page=1&limit=20&status=held&productId=uuid

# Resumo financeiro
GET /api/commissions/summary

# Por período
GET /api/commissions/period?startDate=2024-01-01&endDate=2024-12-31
```

## 🔧 Uso Programático

### Calcular Comissões
```javascript
const result = await calculateOrderCommissions.execute({
  orderId: 'uuid',
  productId: 'uuid',
  affiliateLinkCode: 'ABC12345',
  priceCents: 10000,
  buyerId: 'uuid'
});
```

### Liberar Comissões
```javascript
const released = await releaseCommissions.execute('order-uuid');
```

### Cancelar Comissões
```javascript
const cancelled = await cancelCommissions.execute('order-uuid', 'refund');
```

### Consultar Comissões
```javascript
const result = await getCommissions.execute(
  'affiliate-uuid',
  { status: 'held', productId: 'product-uuid' },
  1,
  20
);
```

### Obter Resumo
```javascript
const summary = await getCommissionSummary.execute('affiliate-uuid');
```

## 📊 Estados

```
pending → held → released
              ↓
          cancelled
```

- **pending**: Aguardando pagamento
- **held**: Em escrow (7 dias)
- **released**: Disponível para saque
- **cancelled**: Cancelado

## 💡 Regra Principal

**"Quem vende recebe mais"**

```javascript
// Produto: R$ 100,00, Afiliados: 30%
// Config: [50%, 30%, 20%]
// Cadeia: A → B → C (C vendeu)

// Resultado:
// A: R$ 6,00 (20%)
// B: R$ 9,00 (30%)
// C: R$ 15,00 (50%) ← VENDEDOR
```

## 🔄 Fluxo

```
Pedido → Identifica Link → Busca Cadeia → Calcula → Cria Comissões
  ↓
Pagamento Confirmado → Status 'held' → +7 dias
  ↓
Job Diário → Libera → Status 'released'
```

## 📈 Resumo Financeiro

```javascript
{
  totalPendingCents: 50000,        // R$ 500,00
  totalHeldCents: 120000,          // R$ 1.200,00
  totalReleasedCents: 350000,      // R$ 3.500,00
  totalCancelledCents: 15000,      // R$ 150,00
  totalEarnedCents: 520000,        // R$ 5.200,00
  availableForWithdrawalCents: 350000,  // R$ 3.500,00
  commissionCount: {
    pending: 5,
    held: 12,
    released: 35,
    cancelled: 2,
    total: 54
  }
}
```

## 🧪 Teste Rápido

```bash
# 1. Login
POST /api/users/login
{ "email": "...", "password": "..." }

# 2. Listar comissões
GET /api/commissions
Authorization: Bearer TOKEN

# 3. Ver resumo
GET /api/commissions/summary
Authorization: Bearer TOKEN
```

## 📚 Documentação Completa

- [COMMISSION-MODULE.md](./COMMISSION-MODULE.md)
- [COMMISSION-INTEGRATION.md](./COMMISSION-INTEGRATION.md)
- [test-api-commissions.http](./test-api-commissions.http)
