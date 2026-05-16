import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Configuração do pool de conexões PostgreSQL
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Evento de erro no pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões PostgreSQL:', err);
  process.exit(-1);
});

// Teste de conexão
pool.on('connect', () => {
  console.log('✅ Conexão com PostgreSQL estabelecida');
});

/**
 * Executa uma query no banco de dados
 * @param {string} text - Query SQL
 * @param {Array} params - Parâmetros da query
 * @returns {Promise<Object>} Resultado da query
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Query executada:', { text, duration: `${duration}ms`, rows: res.rowCount });
    }

    return res;
  } catch (error) {
    console.error('❌ Erro na query:', { text, error: error.message });
    throw error;
  }
};

/**
 * Obtém um cliente do pool para transações
 * @returns {Promise<Object>} Cliente do pool
 */
export const getClient = async () => {
  const client = await pool.connect();

  const originalQuery = client.query;
  const originalRelease = client.release;

  // Timeout para evitar que o cliente fique preso
  const timeout = setTimeout(() => {
    console.error('⚠️ Cliente do pool não foi liberado após 5 segundos');
  }, 5000);

  // Override do método release para limpar o timeout
  client.release = () => {
    clearTimeout(timeout);
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease.apply(client);
  };

  return client;
};

/**
 * Executa múltiplas queries em uma transação
 * @param {Function} callback - Função que recebe o client e executa as queries
 * @returns {Promise<any>} Resultado da transação
 */
export const transaction = async (callback) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Encerra o pool de conexões
 */
export const closePool = async () => {
  await pool.end();
  console.log('🔌 Pool de conexões PostgreSQL encerrado');
};

// Export default
export default {
  query,
  getClient,
  transaction,
  closePool,
  pool,
};
