import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para criar o banco de dados e executar o schema SQL
 */
async function setupDatabase() {
    console.log('🔧 Iniciando configuração do banco de dados...\n');

    // Conecta ao PostgreSQL (banco postgres padrão)
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: 'postgres', // Conecta ao banco padrão primeiro
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao PostgreSQL\n');

        // Verifica se o banco já existe
        const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
        const result = await client.query(checkDbQuery, [process.env.DB_NAME]);

        if (result.rows.length === 0) {
            // Cria o banco de dados
            console.log(`📦 Criando banco de dados: ${process.env.DB_NAME}`);
            await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log('✅ Banco de dados criado com sucesso\n');
        } else {
            console.log(`ℹ️  Banco de dados ${process.env.DB_NAME} já existe\n`);
        }

        await client.end();

        // Conecta ao banco criado
        const dbClient = new Client({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });

        await dbClient.connect();
        console.log(`✅ Conectado ao banco: ${process.env.DB_NAME}\n`);

        // Lê o arquivo SQL do schema
        const schemaPath = path.join(__dirname, '../../../planejamento/IMPAKT_schema.sql');

        if (!fs.existsSync(schemaPath)) {
            console.error('❌ Arquivo IMPAKT_schema.sql não encontrado em:', schemaPath);
            console.log('ℹ️  Certifique-se de que o arquivo está na pasta planejamento/');
            process.exit(1);
        }

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log('📄 Executando schema SQL...\n');

        // Executa o schema
        await dbClient.query(schemaSql);
        console.log('✅ Schema executado com sucesso\n');

        // Verifica as tabelas criadas
        const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
        const tables = await dbClient.query(tablesQuery);

        console.log('📊 Tabelas criadas:');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        console.log('');

        await dbClient.end();

        console.log('🎉 Configuração do banco de dados concluída com sucesso!\n');
        console.log('💡 Próximos passos:');
        console.log('   1. Configure o arquivo .env com suas credenciais');
        console.log('   2. Execute: npm run dev');
        console.log('');

    } catch (error) {
        console.error('❌ Erro ao configurar banco de dados:', error.message);
        console.error('\n📋 Detalhes do erro:', error);
        process.exit(1);
    }
}

// Executa o script
setupDatabase();
