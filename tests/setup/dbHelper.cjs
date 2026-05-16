// tests/setup/dbHelper.js
// Utilitários compartilhados entre todos os testes

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres@localhost:5432/impakt_test'
})

/**
 * Limpa todas as tabelas na ordem correta (respeitando FKs)
 * Usar no beforeEach de cada suite de testes
 */
async function clearDatabase() {
  await pool.query(`
    TRUNCATE
      withdrawals,
      notifications,
      income_distributions,
      commissions,
      affiliate_chains,
      orders,
      affiliate_links,
      product_links,
      product_media,
      products,
      wallets,
      landing_registrations,
      users,
      categories
    RESTART IDENTITY CASCADE
  `)
}

/**
 * Insere categoria base para os testes
 */
async function seedBaseCategories() {
  await pool.query(`
    INSERT INTO categories (name, slug, sort_order) VALUES
      ('Digitais', 'digitais', 1),
      ('Físicos',  'fisicos',  2)
    ON CONFLICT (slug) DO NOTHING
  `)
}

/**
 * Cria um usuário de teste e retorna { id, token }
 */
async function createTestUser(app, data = {}) {
  const request = require('supertest')
  const defaults = {
    full_name: 'Usuário Teste',
    email: `teste_${Date.now()}@IMPAKT.com`,
    password: 'Senha@123',
    role: 'seller',
  }
  const payload = { ...defaults, ...data }
  const res = await request(app).post('/api/auth/register').send(payload)
  if (res.status !== 201) {
    throw new Error(`Falha ao criar usuário: ${JSON.stringify(res.body)}`)
  }
  return { id: res.body.user.id, token: res.body.token, email: payload.email }
}

/**
 * Cria um produto de teste e retorna o produto criado
 */
async function createTestProduct(app, token, data = {}) {
  const request = require('supertest')
  const defaults = {
    name: 'Produto Teste',
    price_cents: 10000,       // R$ 100,00
    affiliate_pct: 40,
    max_affiliate_levels: 2,
    product_type: 'digital',
  }
  const payload = { ...defaults, ...data }
  const res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send(payload)
  if (res.status !== 201) {
    throw new Error(`Falha ao criar produto: ${JSON.stringify(res.body)}`)
  }
  return res.body
}

/**
 * Simula um pagamento aprovado (mock do gateway)
 */
async function simulatePayment(orderId, status = 'paid') {
  await pool.query(
    `UPDATE orders SET status = $1,
      escrow_release_at = NOW() + INTERVAL '7 days'
     WHERE id = $2`,
    [status, orderId]
  )
}

/**
 * Força a liberação do escrow (simula passagem de 7 dias)
 */
async function forceReleaseEscrow(orderId) {
  await pool.query(
    `UPDATE orders SET escrow_release_at = NOW() - INTERVAL '1 minute'
     WHERE id = $1`,
    [orderId]
  )
}

module.exports = {
  pool,
  clearDatabase,
  seedBaseCategories,
  createTestUser,
  createTestProduct,
  simulatePayment,
  forceReleaseEscrow,
}
