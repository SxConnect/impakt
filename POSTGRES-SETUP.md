# PostgreSQL Portable - Setup Completo

## 📋 Resumo

Este documento descreve o setup completo do PostgreSQL portable para o projeto IMPAKT Backend.

## 🎯 O que foi feito

### 1. Download e Instalação do PostgreSQL

- **Versão**: PostgreSQL 16 (Windows x64)
- **Localização**: `H:\dev-afiliados\postgres-portable\`
- **Binários**: Extraídos em `H:\dev-afiliados\postgres-portable\pgsql\`

### 2. Inicialização do Banco de Dados

```powershell
# Criar pasta para dados
mkdir H:\dev-afiliados\postgres-portable\data

# Inicializar cluster PostgreSQL
.\pgsql\bin\initdb.exe -D .\data -U postgres -E UTF8 --locale=C
```

### 3. Iniciar o Servidor PostgreSQL

```powershell
# Iniciar servidor
.\pgsql\bin\pg_ctl.exe -D .\data -l logfile start

# Verificar status
.\pgsql\bin\pg_ctl.exe -D .\data status

# Parar servidor (quando necessário)
.\pgsql\bin\pg_ctl.exe -D .\data stop
```

### 4. Criação do Banco de Dados de Teste

```powershell
# Criar banco de dados
.\pgsql\bin\createdb.exe -U postgres impakt_test

# Aplicar schema SQL
.\pgsql\bin\psql.exe -U postgres -d impakt_test -f ..\driva-backend\IMPAKT_schema.sql
```

### 5. Configuração do Projeto

Arquivo `.env` atualizado com as configurações:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=impakt_test
DB_USER=postgres
DB_PASSWORD=
DB_SSL=false
```

### 6. Correção de Bugs

**Problema encontrado**: O arquivo `src/shared/database/postgres.js` não estava exportando corretamente o `pool`.

**Solução**: Alterada a declaração de `const pool` para `export const pool` para permitir named export.

## 🚀 Como Usar

### Iniciar o PostgreSQL

```powershell
cd H:\dev-afiliados\postgres-portable
.\pgsql\bin\pg_ctl.exe -D .\data -l logfile start
```

### Iniciar o Backend

```powershell
cd H:\dev-afiliados\driva-backend
npm start
```

### Verificar se está funcionando

```powershell
# Health check
curl http://localhost:3000/health

# Ou no PowerShell
Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing
```

### Parar o PostgreSQL

```powershell
cd H:\dev-afiliados\postgres-portable
.\pgsql\bin\pg_ctl.exe -D .\data stop
```

## 🔧 Comandos Úteis do PostgreSQL

### Conectar ao banco via psql

```powershell
.\pgsql\bin\psql.exe -U postgres -d impakt_test
```

### Listar bancos de dados

```powershell
.\pgsql\bin\psql.exe -U postgres -l
```

### Executar query SQL

```powershell
.\pgsql\bin\psql.exe -U postgres -d impakt_test -c "SELECT * FROM users LIMIT 5;"
```

### Backup do banco

```powershell
.\pgsql\bin\pg_dump.exe -U postgres -d impakt_test -f backup.sql
```

### Restaurar backup

```powershell
.\pgsql\bin\psql.exe -U postgres -d impakt_test -f backup.sql
```

## 📁 Estrutura de Arquivos

```
H:\dev-afiliados\
├── postgres-portable\
│   ├── pgsql\              # Binários do PostgreSQL
│   │   ├── bin\            # Executáveis (psql, pg_ctl, etc)
│   │   ├── lib\            # Bibliotecas
│   │   └── share\          # Arquivos de suporte
│   ├── data\               # Dados do banco (cluster)
│   └── logfile             # Log do servidor
└── driva-backend\
    ├── src\
    │   └── shared\
    │       └── database\
    │           └── postgres.js  # Configuração do pool
    ├── .env                # Configurações de ambiente
    └── IMPAKT_schema.sql   # Schema do banco
```

## ⚠️ Notas Importantes

1. **Autenticação**: O PostgreSQL está configurado com autenticação "trust" (sem senha) para localhost. Isso é adequado para desenvolvimento, mas **NÃO use em produção**.

2. **Porta**: O PostgreSQL está rodando na porta padrão 5432. Se você já tiver outro PostgreSQL rodando, precisará mudar a porta.

3. **Dados**: Os dados do banco estão em `H:\dev-afiliados\postgres-portable\data\`. Faça backup desta pasta regularmente.

4. **Logs**: Os logs do servidor estão em `H:\dev-afiliados\postgres-portable\logfile`.

5. **Inicialização**: O PostgreSQL **NÃO** inicia automaticamente. Você precisa iniciar manualmente com `pg_ctl start`.

## 🐛 Troubleshooting

### Servidor não inicia

```powershell
# Verificar se já está rodando
.\pgsql\bin\pg_ctl.exe -D .\data status

# Ver logs
type logfile
```

### Porta 3000 já em uso

```powershell
# Encontrar processo
Get-NetTCPConnection -LocalPort 3000 | Select-Object -Property LocalPort, OwningProcess

# Matar processo
Stop-Process -Id <PID> -Force
```

### Erro de conexão no backend

1. Verificar se o PostgreSQL está rodando
2. Verificar configurações no `.env`
3. Verificar logs do servidor: `type H:\dev-afiliados\postgres-portable\logfile`

## ✅ Status Atual

- ✅ PostgreSQL 16 instalado e configurado
- ✅ Banco de dados `impakt_test` criado
- ✅ Schema SQL aplicado (todas as tabelas criadas)
- ✅ Backend conectando corretamente ao banco
- ✅ Servidor PostgreSQL rodando na porta 5432
- ✅ Todas as 14 tabelas criadas com sucesso
- ✅ Extensões instaladas: uuid-ossp, pgcrypto, pg_trgm, unaccent
- ✅ Triggers e funções criadas
- ✅ Dados de teste (10 categorias) inseridos

### Verificação de Conexão

O teste de conexão foi bem-sucedido:
```
📡 Conectando ao PostgreSQL...
✅ Conectado ao PostgreSQL
✅ Banco impakt_test já existe
📡 Conectando ao banco impakt_test...
✅ Conectado ao impakt_test
📄 Aplicando schema SQL...
✅ Schema já existe (OK)
🚀 Ambiente de teste pronto!
```

### Tabelas Criadas

```
affiliate_chains      | affiliate_links       | categories
commissions           | income_distributions  | landing_registrations
notifications         | orders                | product_links
product_media         | products              | users
wallets               | withdrawals
```

## 📚 Próximos Passos

1. ~~Criar dados de teste (seeds)~~ ✅ 10 categorias já inseridas
2. Testar endpoints da API
3. Configurar backup automático
4. Documentar APIs
5. **Corrigir configuração do Jest** - Os testes estão falhando devido a problemas com ES modules, não por problemas de banco de dados

### Nota sobre os Testes

Os testes estão falhando por problemas de configuração do Jest com ES modules:
- `SyntaxError: Unexpected token 'export'` - Jest não está transpilando os módulos ES6
- Solução: Configurar Babel ou converter para CommonJS (require/module.exports)
- **O banco de dados está funcionando perfeitamente** - o problema é apenas na configuração do Jest
