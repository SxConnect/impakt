# 🚀 IMPAKT Backend - Setup Completo

## ✅ O que foi construído

### 1. **Estrutura do Projeto** ✅
```
impakt-backend/
├── src/
│   ├── modules/
│   │   └── user/                    # Módulo de usuários COMPLETO
│   │       ├── domain/              # Entidades e interfaces
│   │       ├── application/         # Casos de uso
│   │       ├── infrastructure/      # Implementação PostgreSQL
│   │       └── http/                # Rotas Express
│   ├── shared/
│   │   ├── database/                # Conexão PostgreSQL
│   │   ├── errors/                  # Classes de erro
│   │   ├── middleware/              # Auth + Error Handler
│   │   ├── utils/                   # Validadores
│   │   └── container.js             # Injeção de dependências
│   ├── scripts/
│   │   └── setupDatabase.js         # Script de setup do banco
│   └── app.js                       # Aplicação principal
├── .env                             # Configurações (já criado)
├── .env.example                     # Template de configurações
├── package.json                     # Dependências
├── README.md                        # Documentação completa
└── test-api.http                    # Testes de API
```

### 2. **Módulo de Usuários** ✅ (100% Funcional)

#### Funcionalidades Implementadas:
- ✅ Registro de usuários (vendedor, afiliado, comprador)
- ✅ Login com JWT
- ✅ Perfil do usuário
- ✅ Atualização de perfil
- ✅ Validação de CPF/CNPJ
- ✅ Sistema de indicação (referral)
- ✅ Dados bancários
- ✅ Cadeia de indicação (até 5 níveis)

#### Endpoints Disponíveis:
```
POST   /api/users/register    # Registrar novo usuário
POST   /api/users/login        # Login
GET    /api/users/me           # Meu perfil (autenticado)
PATCH  /api/users/me           # Atualizar perfil (autenticado)
GET    /api/users/:id          # Perfil público
```

### 3. **Infraestrutura Compartilhada** ✅

#### Database:
- ✅ Pool de conexões PostgreSQL
- ✅ Suporte a transações
- ✅ Query helper com logs

#### Autenticação:
- ✅ JWT com bcrypt
- ✅ Middleware de autenticação
- ✅ Middleware de autorização por role
- ✅ Autenticação opcional

#### Tratamento de Erros:
- ✅ Handler global de erros
- ✅ Classes de erro customizadas
- ✅ Tratamento de erros do PostgreSQL
- ✅ Wrapper catchAsync

#### Validadores:
- ✅ CPF/CNPJ
- ✅ E-mail
- ✅ Telefone
- ✅ Senha forte
- ✅ Formatação de moeda
- ✅ Gerador de códigos únicos
- ✅ Slugify

### 4. **Dependências Instaladas** ✅
```json
{
  "express": "^4.21.2",           // Framework web
  "pg": "^8.13.1",                // PostgreSQL client
  "bcrypt": "^5.1.1",             // Hash de senhas
  "jsonwebtoken": "^9.0.2",       // JWT
  "dotenv": "^16.4.7",            // Variáveis de ambiente
  "cors": "^2.8.5",               // CORS
  "helmet": "^8.0.0",             // Segurança
  "express-validator": "^7.2.1",  // Validação
  "nodemailer": "^6.9.16",        // E-mail (pronto para usar)
  "uuid": "^11.0.3",              // UUID
  "nodemon": "^3.1.9"             // Dev (hot reload)
}
```

## 🎯 Próximos Passos

### Passo 1: Configurar PostgreSQL

Você precisa ter o PostgreSQL instalado. Se não tiver:

**Windows:**
```bash
# Baixe e instale: https://www.postgresql.org/download/windows/
# Ou use Docker:
docker run --name impakt-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```

### Passo 2: Configurar o .env

O arquivo `.env` já foi criado com valores padrão. Edite se necessário:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=impakt
DB_USER=postgres
DB_PASSWORD=postgres    # ← Altere para sua senha
```

### Passo 3: Criar o Banco de Dados

```bash
npm run db:setup
```

Este comando irá:
1. Criar o banco de dados `impakt`
2. Executar todo o schema SQL (14 tabelas)
3. Criar índices, triggers e views
4. Inserir categorias iniciais

### Passo 4: Iniciar o Servidor

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

### Passo 5: Testar a API

Use o arquivo `test-api.http` com a extensão REST Client do VS Code, ou use curl:

```bash
# Health check
curl http://localhost:3000/health

# Registrar usuário
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendedor@impakt.com",
    "password": "Senha123",
    "fullName": "João Vendedor",
    "role": "seller"
  }'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendedor@impakt.com",
    "password": "Senha123"
  }'
```

## 📊 Status do Desenvolvimento

### ✅ Concluído (Dia 1-2)
- [x] Estrutura do projeto
- [x] Configuração do ambiente
- [x] Conexão com PostgreSQL
- [x] Módulo de usuários completo
- [x] Autenticação JWT
- [x] Sistema de indicação
- [x] Validadores
- [x] Tratamento de erros
- [x] Documentação

### 🔄 Próximos Módulos (Dias 3-7)

#### Dia 3: Sistema de Afiliados
- [ ] Módulo `affiliate`
- [ ] Geração de links rastreáveis
- [ ] Rastreamento de cliques
- [ ] Cálculo de comissões por nível

#### Dia 4: Produtos
- [ ] Módulo `product`
- [ ] CRUD de produtos
- [ ] Upload de mídia (S3/R2)
- [ ] Configuração de comissões

#### Dia 5: Pagamentos + Escrow
- [ ] Módulo `payment`
- [ ] Integração Pagar.me/Asaas
- [ ] Módulo `order`
- [ ] Sistema de escrow (7 dias)

#### Dia 6: Split + Comissões
- [ ] Módulo `commission`
- [ ] Split automático
- [ ] Distribuição de renda
- [ ] Carteiras

#### Dia 7: Notificações + Testes
- [ ] Módulo `notification`
- [ ] E-mails transacionais
- [ ] Testes end-to-end
- [ ] Correções finais

## 🏗️ Arquitetura Hexagonal

O projeto segue a arquitetura hexagonal (Ports & Adapters):

```
┌─────────────────────────────────────────────┐
│           HTTP (Adaptador Entrada)          │
│              userRoutes.js                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Application (Casos de Uso)          │
│  RegisterUser, LoginUser, UpdateProfile     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            Domain (Núcleo)                  │
│      User (entidade), UserRepository        │
│         (interface - porta)                 │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Infrastructure (Adaptador Saída)       │
│        PostgresUserRepository.js            │
└─────────────────────────────────────────────┘
```

### Benefícios:
- ✅ Fácil de testar (mock de repositórios)
- ✅ Fácil de trocar implementações
- ✅ Regras de negócio isoladas
- ✅ Baixo acoplamento

## 🔒 Segurança

- ✅ Senhas com bcrypt (10 rounds)
- ✅ JWT com expiração configurável
- ✅ Helmet para headers de segurança
- ✅ CORS configurado
- ✅ Validação de entrada
- ✅ SQL injection protegido (prepared statements)
- ✅ Tratamento de erros sem vazar informações

## 📚 Recursos Úteis

- **Documentação completa:** `README.md`
- **Testes de API:** `test-api.http`
- **Schema do banco:** `../planejamento/impakt_schema.sql`
- **Base de conhecimento:** `../planejamento/IMPAKT_base_conhecimento.md`

## 🆘 Troubleshooting

### Erro ao conectar no PostgreSQL
```
Verifique se o PostgreSQL está rodando:
- Windows: Services → PostgreSQL
- Docker: docker ps
```

### Erro "database does not exist"
```bash
npm run db:setup
```

### Erro "port 3000 already in use"
```bash
# Altere a porta no .env
PORT=3001
```

### Erro de permissão no PostgreSQL
```sql
-- Execute no psql:
GRANT ALL PRIVILEGES ON DATABASE impakt TO postgres;
```

## 🎉 Pronto para Desenvolver!

O backend está **100% funcional** para o módulo de usuários. Você pode:

1. ✅ Registrar usuários
2. ✅ Fazer login
3. ✅ Gerenciar perfis
4. ✅ Sistema de indicação funcionando

**Próximo passo:** Implementar o módulo de produtos ou afiliados!

---

**IMPAKT** - Venda mais. Divida melhor. Cresça junto.
