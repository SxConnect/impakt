// tests/setup/globalTeardown.js
// Executado UMA vez após todos os testes

const { Client } = require('pg')

module.exports = async () => {
  // Em CI/CD: apaga o banco de teste por completo
  // Em dev local: mantém para inspeção
  if (process.env.CI) {
    const client = new Client({
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres',
    })

    await client.connect()
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = 'IMPAKT_test' AND pid <> pg_backend_pid()
    `)
    await client.query('DROP DATABASE IF EXISTS IMPAKT_test')
    await client.end()
    console.log('🧹 Banco IMPAKT_test removido (CI)')
  } else {
    console.log('🔍 Banco IMPAKT_test mantido para inspeção local')
  }
}
