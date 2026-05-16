// tests/setup/globalSetup.js
// Executado UMA vez antes de todos os testes
// Cria o banco IMPAKT_test e roda as migrations

const { Client } = require('pg')

module.exports = async () => {
  console.log('🔧 Iniciando setup dos testes...')

  try {
    // Conecta no postgres padrão para criar o banco de teste
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: 'postgres',
    })

    console.log('📡 Conectando ao PostgreSQL...')
    await client.connect()
    console.log('✅ Conectado ao PostgreSQL')

    // Cria banco de teste se não existir
    const exists = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = 'impakt_test'`
    )

    if (exists.rowCount === 0) {
      console.log('📦 Criando banco impakt_test...')
      await client.query('CREATE DATABASE impakt_test')
      console.log('✅ Banco impakt_test criado')
    } else {
      console.log('✅ Banco impakt_test já existe')
    }

    await client.end()

    // Conecta no banco de teste e roda o schema
    const testClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: 'impakt_test',
    })

    console.log('📡 Conectando ao banco impakt_test...')
    await testClient.connect()
    console.log('✅ Conectado ao impakt_test')

    const fs = require('fs')
    const path = require('path')

    // Verifica se o schema existe
    const schemaPath = path.join(__dirname, '../../IMPAKT_schema.sql')
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Arquivo IMPAKT_schema.sql não encontrado em:', schemaPath)
      throw new Error('Schema SQL não encontrado')
    }

    // Roda o schema SQL completo
    console.log('📄 Aplicando schema SQL...')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Ignora erros de "já existe" para idempotência
    try {
      await testClient.query(schema)
      console.log('✅ Schema aplicado no impakt_test')
    } catch (err) {
      // Schema já existe — tudo certo
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log('✅ Schema já existe (OK)')
      } else {
        console.error('❌ Erro ao aplicar schema:', err.message)
        throw err
      }
    }

    await testClient.end()

    // Salva a URL do banco de teste nas variáveis de ambiente
    process.env.DATABASE_URL = 'postgresql://postgres@localhost:5432/impakt_test'
    process.env.NODE_ENV = 'test'

    console.log('🚀 Ambiente de teste pronto!')
    console.log('')
  } catch (error) {
    console.error('❌ Erro no setup dos testes:')
    console.error('   Mensagem:', error.message)
    console.error('   Código:', error.code)
    console.error('')
    console.error('💡 Verifique se:')
    console.error('   1. PostgreSQL está rodando')
    console.error('   2. Usuário "postgres" existe')
    console.error('   3. Porta 5432 está disponível')
    console.error('')
    throw error
  }
}
