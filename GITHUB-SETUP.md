# 🚀 Guia de Publicação no GitHub

## 📋 Pré-requisitos

1. Conta no GitHub (https://github.com)
2. Git instalado no seu computador
3. Projeto IMPAKT completo (✅ já temos!)

---

## 🔧 Passo a Passo

### 1. Inicializar Git no Projeto

```bash
# Navegar até a pasta do projeto
cd h:\dev-afiliados\IMPAKT-backend

# Inicializar repositório Git
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "🎉 Initial commit - IMPAKT MVP completo"
```

### 2. Criar Repositório no GitHub

1. Acesse https://github.com
2. Clique em **"New repository"** (botão verde)
3. Preencha:
   - **Repository name:** `IMPAKT-backend`
   - **Description:** `IMPAKT - Divisão de Renda Inteligente para Vendas e Afiliados. Marketplace com sistema de afiliados multinível, comissões automáticas e múltiplos gateways de pagamento.`
   - **Visibility:** 
     - ✅ **Public** (para apresentação e portfólio)
     - ou **Private** (se preferir manter privado)
   - ❌ **NÃO** marque "Add a README file" (já temos)
   - ❌ **NÃO** adicione .gitignore (já temos)
4. Clique em **"Create repository"**

### 3. Conectar e Enviar para GitHub

```bash
# Adicionar o repositório remoto (substitua SEU-USUARIO pelo seu username)
git remote add origin https://github.com/SEU-USUARIO/IMPAKT-backend.git

# Renomear branch para main (padrão do GitHub)
git branch -M main

# Enviar código para GitHub
git push -u origin main
```

### 4. Configurar Repositório no GitHub

Após o push, acesse seu repositório no GitHub e configure:

#### 4.1. Adicionar Topics (Tags)
Clique em ⚙️ (Settings) ao lado de "About" e adicione:
- `nodejs`
- `express`
- `postgresql`
- `marketplace`
- `affiliate-marketing`
- `payment-gateway`
- `hexagonal-architecture`
- `split-payment`
- `escrow`
- `commission-system`

#### 4.2. Adicionar Website
No mesmo local, adicione:
- **Website:** URL da sua demo (se tiver)

#### 4.3. Proteger Secrets
⚠️ **IMPORTANTE:** Nunca commite o arquivo `.env` com dados reais!

Verifique se `.env` está no `.gitignore`:
```bash
# Verificar se .env está ignorado
cat .gitignore | grep .env
```

Se não estiver, adicione:
```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "🔒 Adicionar .env ao gitignore"
git push
```

---

## 📝 Melhorar o README para GitHub

Vou criar um README otimizado para apresentação no GitHub:

### README.md Sugerido

```markdown
# 🚀 IMPAKT Backend

<div align="center">

**Divisão de Renda Inteligente para Vendas e Afiliados**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-MVP%20Complete-success.svg)]()

Sistema de marketplace com split de pagamento automático, escrow de 7 dias e sistema de afiliados multinível.

[Documentação](#-documentação) • [Instalação](#-instalação) • [API](#-api) • [Arquitetura](#-arquitetura)

</div>

---

## ✨ Características

- 🎯 **Sistema de Afiliados Multinível** - Até 5 níveis de indicação
- 💰 **Comissões Automáticas** - Cálculo e distribuição automática
- 🔒 **Escrow de 7 dias** - Proteção contra fraudes
- 💳 **Múltiplos Gateways** - Pagar.me, Stripe e Asaas
- 🏗️ **Arquitetura Hexagonal** - Troca de gateway sem afetar código
- ⏰ **Jobs Agendados** - Liberação automática de comissões
- 📧 **Notificações** - Emails transacionais automáticos
- 📊 **Dashboard Completo** - Estatísticas e relatórios

## 🎯 Funcionalidades

### Para Vendedores
- ✅ Cadastro e gestão de produtos
- ✅ Configuração de comissões por nível
- ✅ Distribuição de renda entre beneficiários
- ✅ Dashboard de vendas
- ✅ Estatísticas detalhadas

### Para Afiliados
- ✅ Geração de links rastreáveis
- ✅ Dashboard com métricas
- ✅ Taxa de conversão
- ✅ Comissões em tempo real
- ✅ Histórico de ganhos

### Para Compradores
- ✅ Múltiplos métodos de pagamento
- ✅ Cartão, boleto e PIX
- ✅ Parcelamento até 12x
- ✅ Histórico de pedidos

## 🏗️ Arquitetura

### Padrões Implementados
- **Hexagonal Architecture** (Ports & Adapters)
- **Domain-Driven Design** (DDD)
- **Repository Pattern**
- **Use Cases** (Application Layer)
- **Dependency Injection**
- **Factory Pattern**
- **Strategy Pattern**

### Estrutura de Módulos
```
src/modules/
├── user/         # Autenticação e perfis
├── product/      # Catálogo de produtos
├── affiliate/    # Sistema de afiliados
├── commission/   # Comissões e split
├── order/        # Pedidos e escrow
├── payment/      # Gateways de pagamento
└── notification/ # Emails e notificações
```

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 16+
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/SEU-USUARIO/IMPAKT-backend.git
cd IMPAKT-backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

4. **Configure o banco de dados**
```bash
npm run db:setup
```

5. **Inicie o servidor**
```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

## 📡 API

### Endpoints Principais

#### Usuários
- `POST /api/users/register` - Registrar usuário
- `POST /api/users/login` - Login
- `GET /api/users/profile` - Perfil do usuário

#### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `POST /api/products/:id/publish` - Publicar produto

#### Afiliados
- `POST /api/affiliates/links` - Gerar link de afiliado
- `GET /api/affiliates/dashboard` - Dashboard do afiliado
- `GET /api/affiliates/click/:code` - Rastrear clique (público)

#### Pedidos
- `POST /api/orders` - Criar pedido
- `GET /api/orders` - Listar pedidos
- `GET /api/orders/stats/:type` - Estatísticas

#### Pagamentos
- `POST /api/payments` - Processar pagamento
- `POST /api/payments/webhook/:provider` - Webhook (público)
- `POST /api/payments/:id/refund` - Reembolsar

#### Comissões
- `GET /api/commissions` - Listar comissões
- `GET /api/commissions/summary` - Resumo financeiro
- `GET /api/commissions/period` - Por período

### Testes de API
Use os arquivos `.http` incluídos no projeto com a extensão REST Client do VS Code.

## 💳 Gateways de Pagamento

### Suportados
- ✅ **Pagar.me** - Cartão, Boleto, PIX
- ✅ **Stripe** - Cartão, PIX
- ✅ **Asaas** - Cartão, Boleto, PIX

### Trocar de Gateway
```javascript
// Via .env
PAYMENT_PROVIDER=pagarme  // ou 'stripe' ou 'asaas'

// Via código (por pedido)
{
  "provider": "stripe",  // Escolhe o gateway
  "method": "credit_card"
}
```

## 📊 Comissões

### Cálculo Automático
- Até 5 níveis de afiliados
- Regra: "Quem vende recebe mais"
- Distribuição configurável por produto
- Ajuste automático de arredondamento

### Escrow
- Período de 7 dias
- Liberação automática (job diário)
- Proteção contra fraudes
- Notificação por email

## ⏰ Jobs Agendados

### ReleaseCommissionsJob
- **Frequência:** Diário às 00:00
- **Função:** Libera comissões após 7 dias
- **Notificação:** Email automático

## 📧 Notificações

### Templates de Email
- `order-created` - Pedido criado
- `payment-confirmed` - Pagamento confirmado
- `commission-earned` - Nova comissão
- `commission-released` - Comissão liberada
- `welcome` - Boas-vindas

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=IMPAKT
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=sua_chave_secreta_min_32_caracteres
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# Gateway de Pagamento
PAYMENT_PROVIDER=pagarme
PAGARME_API_KEY=sk_test_...
STRIPE_API_KEY=sk_test_...
ASAAS_API_KEY=$aact_...
```

## 📚 Documentação

- [MVP Completo](./MVP-COMPLETE.md) - Visão geral do MVP
- [Arquitetura de Pagamentos](./PAYMENT-ARCHITECTURE.md) - Arquitetura hexagonal
- [Módulo de Comissões](./COMMISSION-MODULE.md) - Sistema de comissões
- [Módulo de Afiliados](./AFFILIATE-MODULE.md) - Sistema de afiliados
- [Progresso](./PROGRESS.md) - Histórico de desenvolvimento

## 🧪 Testes

```bash
# Executar testes (quando implementados)
npm test

# Testes de API
# Use os arquivos .http com REST Client do VS Code
```

## 📈 Roadmap

### Implementado ✅
- [x] Sistema de usuários e autenticação
- [x] CRUD de produtos
- [x] Sistema de afiliados multinível
- [x] Comissões automáticas
- [x] Pedidos e escrow
- [x] Múltiplos gateways de pagamento
- [x] Jobs agendados
- [x] Notificações por email

### Futuro 🔮
- [ ] Notificações in-app
- [ ] Upload de imagens (S3/R2)
- [ ] Sistema de saques
- [ ] Relatórios avançados
- [ ] Painel administrativo
- [ ] Testes automatizados
- [ ] CI/CD
- [ ] Documentação Swagger

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Seu Nome**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- LinkedIn: [Seu Nome](https://linkedin.com/in/seu-perfil)

## 🙏 Agradecimentos

- Node.js Community
- PostgreSQL Team
- Todos os contribuidores

---

<div align="center">

**Desenvolvido com ❤️ para revolucionar o mercado de afiliados no Brasil**

⭐ Se este projeto te ajudou, considere dar uma estrela!

</div>
```

---

## 🎨 Adicionar Badges e Imagens

### 1. Criar Logo (Opcional)
Use ferramentas como:
- Canva (https://canva.com)
- Figma (https://figma.com)
- LogoMakr (https://logomakr.com)

Salve como `logo.png` na pasta raiz e adicione no README:
```markdown
![IMPAKT Logo](./logo.png)
```

### 2. Adicionar Screenshots
Crie uma pasta `docs/images/` e adicione prints:
- Dashboard
- API Response
- Arquitetura

```markdown
![Dashboard](./docs/images/dashboard.png)
```

---

## 🌟 Destacar o Projeto

### 1. GitHub Topics
Adicione no repositório:
- `nodejs`
- `express`
- `postgresql`
- `marketplace`
- `affiliate-marketing`
- `payment-gateway`
- `hexagonal-architecture`

### 2. GitHub About
Configure:
- ✅ Website (se tiver demo)
- ✅ Topics
- ✅ Description

### 3. Criar Releases
```bash
git tag -a v1.0.0 -m "🎉 MVP Completo"
git push origin v1.0.0
```

No GitHub:
1. Vá em "Releases"
2. "Create a new release"
3. Tag: `v1.0.0`
4. Title: `🎉 MVP Completo - v1.0.0`
5. Description: Copie do MVP-COMPLETE.md

---

## 📊 Analytics (Opcional)

### GitHub Insights
Ative em Settings > Insights para ver:
- Visitantes
- Clones
- Forks
- Stars

---

## 🔐 Segurança

### Verificar Secrets
```bash
# NUNCA commite estes arquivos:
.env
.env.local
.env.production
node_modules/
*.log
```

### GitHub Secrets (para CI/CD)
Settings > Secrets and variables > Actions
- `DB_PASSWORD`
- `JWT_SECRET`
- `PAGARME_API_KEY`
- etc.

---

## 🚀 Deploy (Opcional)

### Opções de Hospedagem
1. **Heroku** - Fácil e rápido
2. **Railway** - Moderno e simples
3. **Render** - Gratuito para começar
4. **DigitalOcean** - VPS completo
5. **AWS** - Escalável

### Deploy Rápido no Railway
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

---

## 📝 Checklist Final

Antes de publicar:

- [ ] `.env` está no `.gitignore`
- [ ] README.md está completo
- [ ] Documentação está atualizada
- [ ] Código está comentado
- [ ] Não há senhas ou tokens no código
- [ ] LICENSE está incluída
- [ ] .gitignore está configurado
- [ ] Commits têm mensagens claras

---

## 🎉 Pronto!

Seu projeto IMPAKT estará disponível em:
```
https://github.com/SEU-USUARIO/IMPAKT-backend
```

Compartilhe com:
- 💼 LinkedIn
- 🐦 Twitter
- 📧 Email
- 💬 WhatsApp

---

**Boa sorte com seu projeto! 🚀**
