// tests/e2e/fluxo-completo.test.js
// Fluxo ponta a ponta: cadastro → produto → venda → escrow → split → devolução

const request = require('supertest')
const app     = require('../../src/app')
const {
  clearDatabase,
  seedBaseCategories,
  createTestUser,
  createTestProduct,
  simulatePayment,
  forceReleaseEscrow,
  pool,
} = require('../setup/dbHelper')

// ─────────────────────────────────────────────────────────────
// Estado compartilhado entre os testes do fluxo
// ─────────────────────────────────────────────────────────────
let vendedor, afiliado1, afiliado2, comprador
let produto
let linkAfiliado1, linkAfiliado2
let pedidoId, pedidoDevolucaoId

// ─────────────────────────────────────────────────────────────
// Setup e Teardown
// ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  await clearDatabase()
  await seedBaseCategories()
})

afterAll(async () => {
  await pool.end()
})

// ═════════════════════════════════════════════════════════════
// BLOCO 1 — CADASTRO E AUTENTICAÇÃO
// ═════════════════════════════════════════════════════════════
describe('1. Cadastro e autenticação', () => {

  test('1.1 — Vendedor se cadastra com sucesso', async () => {
    vendedor = await createTestUser(app, {
      full_name: 'João Vendedor',
      email:     'joao@IMPAKT-test.com',
      role:      'seller',
    })
    expect(vendedor.token).toBeTruthy()
    expect(vendedor.id).toBeTruthy()
  })

  test('1.2 — Afiliado nível 1 se cadastra com sucesso', async () => {
    afiliado1 = await createTestUser(app, {
      full_name: 'Maria Afiliada N1',
      email:     'maria@IMPAKT-test.com',
      role:      'affiliate',
    })
    expect(afiliado1.token).toBeTruthy()
  })

  test('1.3 — Afiliado nível 2 se cadastra indicado pelo N1', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name:    'Carlos Afiliado N2',
        email:        'carlos@IMPAKT-test.com',
        password:     'Senha@123',
        role:         'affiliate',
        referral_code: afiliado1.referralCode, // indicado por Maria
      })
    expect(res.status).toBe(201)
    afiliado2 = { id: res.body.user.id, token: res.body.token }
  })

  test('1.4 — Comprador se cadastra com sucesso', async () => {
    comprador = await createTestUser(app, {
      full_name: 'Ana Compradora',
      email:     'ana@IMPAKT-test.com',
      role:      'buyer',
    })
    expect(comprador.token).toBeTruthy()
  })

  test('1.5 — Login retorna token válido', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao@IMPAKT-test.com', password: 'Senha@123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
  })

  test('1.6 — Login com senha errada retorna 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao@IMPAKT-test.com', password: 'senhaErrada' })
    expect(res.status).toBe(401)
  })

  test('1.7 — Rota protegida sem token retorna 401', async () => {
    const res = await request(app).get('/api/products/my')
    expect(res.status).toBe(401)
  })
})

// ═════════════════════════════════════════════════════════════
// BLOCO 2 — PRODUTO E LINKS DE AFILIADO
// ═════════════════════════════════════════════════════════════
describe('2. Produto e links de afiliado', () => {

  test('2.1 — Vendedor cria produto digital com 40% para afiliados', async () => {
    produto = await createTestProduct(app, vendedor.token, {
      name:                 'Curso de Node.js IMPAKT',
      price_cents:          10000, // R$ 100,00
      affiliate_pct:        40,
      max_affiliate_levels: 2,
      product_type:         'digital',
      level_commission:     [
        { level: 1, pct: 60 }, // 60% do pool vai para quem vende
        { level: 2, pct: 40 }, // 40% do pool vai para quem indicou
      ],
    })
    expect(produto.id).toBeTruthy()
    expect(produto.affiliate_pct).toBe(40)
    expect(produto.status).toBe('active')
  })

  test('2.2 — Vendedor NÃO pode definir affiliate_pct abaixo de 25%', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${vendedor.token}`)
      .send({ name: 'Produto Inválido', price_cents: 5000, affiliate_pct: 10, product_type: 'digital' })
    expect(res.status).toBe(400)
  })

  test('2.3 — Vendedor NÃO pode definir affiliate_pct acima de 50%', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${vendedor.token}`)
      .send({ name: 'Produto Inválido', price_cents: 5000, affiliate_pct: 60, product_type: 'digital' })
    expect(res.status).toBe(400)
  })

  test('2.4 — Afiliado N1 gera link rastreável para o produto', async () => {
    const res = await request(app)
      .post(`/api/affiliate/link/${produto.id}`)
      .set('Authorization', `Bearer ${afiliado1.token}`)
    expect(res.status).toBe(201)
    expect(res.body.code).toBeTruthy()
    expect(res.body.url).toContain(res.body.code)
    linkAfiliado1 = res.body.code
  })

  test('2.5 — Afiliado N2 gera link rastreável para o mesmo produto', async () => {
    const res = await request(app)
      .post(`/api/affiliate/link/${produto.id}`)
      .set('Authorization', `Bearer ${afiliado2.token}`)
    expect(res.status).toBe(201)
    linkAfiliado2 = res.body.code
  })

  test('2.6 — Dois afiliados não podem ter o mesmo código para o mesmo produto', async () => {
    expect(linkAfiliado1).not.toBe(linkAfiliado2)
  })

  test('2.7 — Clique no link registra rastreamento', async () => {
    const res = await request(app)
      .get(`/api/products/${produto.id}?ref=${linkAfiliado1}`)
    expect(res.status).toBe(200)

    // Verifica se o clique foi contabilizado
    const link = await pool.query(
      'SELECT clicks FROM affiliate_links WHERE code = $1',
      [linkAfiliado1]
    )
    expect(link.rows[0].clicks).toBe(1)
  })
})

// ═════════════════════════════════════════════════════════════
// BLOCO 3 — COMPRA E ESCROW
// ═════════════════════════════════════════════════════════════
describe('3. Compra e escrow', () => {

  test('3.1 — Compra via link de afiliado N2 cria pedido em escrow', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${comprador.token}`)
      .send({
        product_id:     produto.id,
        affiliate_ref:  linkAfiliado2, // compra via N2
        payment_method: 'pix',
      })
    expect(res.status).toBe(201)
    pedidoId = res.body.id

    // Simula webhook do gateway confirmando pagamento
    await simulatePayment(pedidoId, 'paid')
  })

  test('3.2 — Pedido tem status "paid" após confirmação do gateway', async () => {
    const res = await request(app)
      .get(`/api/orders/${pedidoId}`)
      .set('Authorization', `Bearer ${comprador.token}`)
    expect(res.body.status).toBe('paid')
  })

  test('3.3 — Escrow_release_at está definido para 7 dias no futuro', async () => {
    const res = await pool.query(
      'SELECT escrow_release_at FROM orders WHERE id = $1',
      [pedidoId]
    )
    const releaseAt = new Date(res.rows[0].escrow_release_at)
    const now = new Date()
    const diffDays = (releaseAt - now) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThan(6.9)
    expect(diffDays).toBeLessThan(7.1)
  })

  test('3.4 — Split NÃO é executado enquanto escrow está ativo', async () => {
    const comissoes = await pool.query(
      'SELECT * FROM commissions WHERE order_id = $1',
      [pedidoId]
    )
    // Comissões criadas mas ainda com status "held"
    comissoes.rows.forEach(c => {
      expect(c.status).toBe('held')
    })
  })

  test('3.5 — Comprador não pode comprar mesmo produto duas vezes (digital)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${comprador.token}`)
      .send({ product_id: produto.id, payment_method: 'pix' })
    expect(res.status).toBe(409) // Conflict
  })
})

// ═════════════════════════════════════════════════════════════
// BLOCO 4 — SPLIT AUTOMÁTICO
// ═════════════════════════════════════════════════════════════
describe('4. Split automático após liberação do escrow', () => {

  beforeAll(async () => {
    // Simula passagem de 7 dias forçando escrow_release_at no passado
    await forceReleaseEscrow(pedidoId)
  })

  test('4.1 — Comprador confirma recebimento e libera escrow', async () => {
    const res = await request(app)
      .post(`/api/orders/${pedidoId}/confirm`)
      .set('Authorization', `Bearer ${comprador.token}`)
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('confirmed')
  })

  test('4.2 — Split da plataforma: exatamente 1% (R$ 1,00)', async () => {
    const res = await pool.query(
      'SELECT platform_fee_cents FROM orders WHERE id = $1',
      [pedidoId]
    )
    expect(res.rows[0].platform_fee_cents).toBe(100) // 1% de R$100
  })

  test('4.3 — Split do pool de afiliados: exatamente 40% (R$ 40,00)', async () => {
    const res = await pool.query(
      'SELECT affiliate_amt_cents FROM orders WHERE id = $1',
      [pedidoId]
    )
    expect(res.rows[0].affiliate_amt_cents).toBe(4000) // 40% de R$100
  })

  test('4.4 — Split do vendedor: restante (R$ 59,00)', async () => {
    const res = await pool.query(
      'SELECT seller_amt_cents FROM orders WHERE id = $1',
      [pedidoId]
    )
    expect(res.rows[0].seller_amt_cents).toBe(5900) // 59% de R$100
  })

  test('4.5 — Soma dos splits fecha exatamente em R$ 100,00 (sem centavo perdido)', async () => {
    const res = await pool.query(
      'SELECT platform_fee_cents, affiliate_amt_cents, seller_amt_cents FROM orders WHERE id = $1',
      [pedidoId]
    )
    const { platform_fee_cents, affiliate_amt_cents, seller_amt_cents } = res.rows[0]
    expect(platform_fee_cents + affiliate_amt_cents + seller_amt_cents).toBe(10000)
  })

  test('4.6 — Afiliado N2 (quem vendeu) recebeu mais que N1 (quem indicou)', async () => {
    const comissoes = await pool.query(
      'SELECT affiliate_id, amount_cents, level FROM commissions WHERE order_id = $1 ORDER BY level',
      [pedidoId]
    )
    const n1 = comissoes.rows.find(c => c.level === 1)
    const n2 = comissoes.rows.find(c => c.level === 2)
    // N2 vendeu, então recebe mais
    expect(n2.amount_cents).toBeGreaterThan(n1.amount_cents)
  })

  test('4.7 — Soma das comissões dos afiliados == affiliate_amt_cents', async () => {
    const comissoes = await pool.query(
      'SELECT SUM(amount_cents) as total FROM commissions WHERE order_id = $1',
      [pedidoId]
    )
    expect(parseInt(comissoes.rows[0].total)).toBe(4000)
  })

  test('4.8 — Todas as comissões têm status "released"', async () => {
    const comissoes = await pool.query(
      'SELECT status FROM commissions WHERE order_id = $1',
      [pedidoId]
    )
    comissoes.rows.forEach(c => expect(c.status).toBe('released'))
  })

  test('4.9 — Carteira do afiliado N2 foi atualizada (via trigger)', async () => {
    const wallet = await pool.query(
      'SELECT balance_cents FROM wallets WHERE user_id = $1',
      [afiliado2.id]
    )
    expect(wallet.rows[0].balance_cents).toBeGreaterThan(0)
  })

  test('4.10 — Conversão registrada no affiliate_link do N2', async () => {
    const link = await pool.query(
      'SELECT conversions FROM affiliate_links WHERE code = $1',
      [linkAfiliado2]
    )
    expect(link.rows[0].conversions).toBe(1)
  })
})

// ═════════════════════════════════════════════════════════════
// BLOCO 5 — DEVOLUÇÃO
// ═════════════════════════════════════════════════════════════
describe('5. Devolução e estorno', () => {

  beforeAll(async () => {
    // Cria um segundo pedido para testar devolução (sem confirmar o primeiro)
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${comprador.token}`)
      .send({
        product_id:     produto.id,
        affiliate_ref:  linkAfiliado1,
        payment_method: 'pix',
      })
    pedidoDevolucaoId = res.body.id
    await simulatePayment(pedidoDevolucaoId, 'paid')
  })

  test('5.1 — Comprador solicita devolução dentro do prazo', async () => {
    const res = await request(app)
      .post(`/api/orders/${pedidoDevolucaoId}/refund`)
      .set('Authorization', `Bearer ${comprador.token}`)
      .send({ reason: 'Produto não atendeu expectativas' })
    expect(res.status).toBe(200)
  })

  test('5.2 — Pedido tem status "refunded"', async () => {
    const res = await pool.query(
      'SELECT status FROM orders WHERE id = $1',
      [pedidoDevolucaoId]
    )
    expect(res.rows[0].status).toBe('refunded')
  })

  test('5.3 — NENHUMA comissão foi paga (todas canceladas)', async () => {
    const comissoes = await pool.query(
      'SELECT status FROM commissions WHERE order_id = $1',
      [pedidoDevolucaoId]
    )
    comissoes.rows.forEach(c => expect(c.status).toBe('cancelled'))
  })

  test('5.4 — Carteira do afiliado N1 NÃO foi atualizada', async () => {
    const wallet = await pool.query(
      'SELECT balance_cents FROM wallets WHERE user_id = $1',
      [afiliado1.id]
    )
    // N1 não vendeu nada ainda (só indicou no pedido de devolução)
    expect(wallet.rows[0].balance_cents).toBe(0)
  })

  test('5.5 — Devolução fora do prazo de 7 dias é rejeitada', async () => {
    // Força o prazo como vencido
    await pool.query(
      `UPDATE orders SET escrow_release_at = NOW() - INTERVAL '8 days',
       status = 'confirmed' WHERE id = $1`,
      [pedidoId]
    )
    const res = await request(app)
      .post(`/api/orders/${pedidoId}/refund`)
      .set('Authorization', `Bearer ${comprador.token}`)
      .send({ reason: 'Arrependimento tardio' })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('prazo')
  })
})

// ═════════════════════════════════════════════════════════════
// BLOCO 6 — RECORRÊNCIA
// ═════════════════════════════════════════════════════════════
describe('6. Assinatura recorrente', () => {
  let produtoRecorrente, pedidoRecorrente

  test('6.1 — Vendedor cria produto recorrente mensal', async () => {
    produtoRecorrente = await createTestProduct(app, vendedor.token, {
      name:          'Mentoria Mensal IMPAKT',
      price_cents:   5000, // R$ 50/mês
      is_recurring:  true,
      recurring_days: 30,
      affiliate_pct: 30,
      product_type:  'service',
    })
    expect(produtoRecorrente.is_recurring).toBe(true)
    expect(produtoRecorrente.recurring_days).toBe(30)
  })

  test('6.2 — Primeira cobrança cria subscription_id no gateway', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${comprador.token}`)
      .send({
        product_id:     produtoRecorrente.id,
        affiliate_ref:  linkAfiliado1,
        payment_method: 'credit_card',
      })
    expect(res.status).toBe(201)
    pedidoRecorrente = res.body
    expect(pedidoRecorrente.subscription_id).toBeTruthy()
    expect(pedidoRecorrente.billing_cycle).toBe(1)
  })

  test('6.3 — Segunda cobrança incrementa billing_cycle para 2', async () => {
    // Simula renovação pelo cron job
    const res = await request(app)
      .post('/api/subscriptions/renew')
      .set('Authorization', `Bearer ${process.env.CRON_SECRET}`)
      .send({ subscription_id: pedidoRecorrente.subscription_id })
    expect(res.status).toBe(201)
    expect(res.body.billing_cycle).toBe(2)
    expect(res.body.parent_order_id).toBe(pedidoRecorrente.id)
  })

  test('6.4 — Afiliado original recebe comissão na segunda cobrança', async () => {
    const comissoes = await pool.query(`
      SELECT c.* FROM commissions c
      JOIN orders o ON c.order_id = o.id
      WHERE o.billing_cycle = 2 AND o.subscription_id = $1
      AND c.affiliate_id = $2
    `, [pedidoRecorrente.subscription_id, afiliado1.id])
    expect(comissoes.rows.length).toBeGreaterThan(0)
    expect(comissoes.rows[0].status).not.toBe('cancelled')
  })

  test('6.5 — Cancelamento impede cobrança futura', async () => {
    const res = await request(app)
      .post(`/api/subscriptions/${pedidoRecorrente.subscription_id}/cancel`)
      .set('Authorization', `Bearer ${comprador.token}`)
    expect(res.status).toBe(200)

    // Tenta renovar manualmente — deve falhar
    const renew = await request(app)
      .post('/api/subscriptions/renew')
      .set('Authorization', `Bearer ${process.env.CRON_SECRET}`)
      .send({ subscription_id: pedidoRecorrente.subscription_id })
    expect(renew.status).toBe(400)
  })
})
