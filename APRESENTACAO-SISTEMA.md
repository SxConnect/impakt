# 🚀 IMPAKT - Sistema de Marketplace com Afiliados

**I**mpulsionando **M**ercados com **P**agamentos **A**utomáticos, **K**omissões e **T**ransações

---

## 📋 Visão Geral

IMPAKT é uma plataforma completa de marketplace que integra vendedores, afiliados e compradores em um ecossistema automatizado de vendas e comissões. O sistema gerencia todo o ciclo de vida de uma venda, desde a geração de links de afiliados até o pagamento automático de comissões.

### 🎯 Problema que Resolve

- **Vendedores** precisam expandir seu alcance sem investir em marketing
- **Afiliados** querem promover produtos e receber comissões de forma transparente
- **Plataformas** precisam automatizar split de pagamentos e gestão de comissões
- **Compradores** querem segurança nas transações com período de garantia

---

## ✨ Funcionalidades Principais

### 1. 🤝 Sistema de Afiliados Multinível

**O que faz:**
- Permite que qualquer usuário se torne afiliado de produtos
- Gera links rastreáveis únicos para cada afiliado
- Rastreia cliques e conversões automaticamente
- Suporta cadeia de indicação (afiliado indica outro afiliado)

**Funcionalidades:**
- ✅ Geração automática de links de afiliado com código único
- ✅ Rastreamento de cliques em tempo real
- ✅ Dashboard com métricas de performance (cliques, conversões, comissões)
- ✅ Sistema multinível: quem vende recebe mais, quem indica também recebe
- ✅ Validação de limites de comissão (25% a 50% do valor do produto)
- ✅ Histórico completo de indicações e vendas

**Endpoints:**
```
POST   /api/affiliates/links          # Gerar link de afiliado
GET    /api/affiliates/links          # Listar meus links
GET    /api/affiliates/dashboard      # Dashboard com métricas
POST   /api/affiliates/track/:code    # Rastrear clique (público)
GET    /api/products/:id/affiliates   # Ver afiliados de um produto
```

---

### 2. 💰 Split Payment Automático

**O que faz:**
- Divide automaticamente o valor de cada venda entre todos os participantes
- Garante que 100% do valor seja distribuído sem perder centavos
- Aplica regras de negócio complexas de forma transparente

**Regras de Divisão:**
- **1%** → Plataforma (taxa fixa)
- **40%** → Pool de afiliados (dividido entre quem vendeu e quem indicou)
  - Quem vendeu recebe mais (peso maior)
  - Quem indicou recebe menos (peso menor)
  - Divisão proporcional ao nível na cadeia
- **59%** → Vendedor (criador do produto)

**Exemplo Prático:**
```
Venda de R$ 100,00:
├─ R$ 1,00  → Plataforma
├─ R$ 40,00 → Afiliados
│  ├─ R$ 28,00 → Afiliado que vendeu (70% do pool)
│  └─ R$ 12,00 → Afiliado que indicou (30% do pool)
└─ R$ 59,00 → Vendedor

Total: R$ 100,00 (sem perder centavos)
```

---

### 3. 📊 Gestão de Comissões

**O que faz:**
- Calcula comissões automaticamente após cada venda
- Mantém comissões em escrow durante período de garantia
- Libera pagamentos automaticamente após confirmação
- Cancela comissões em caso de devolução

**Status de Comissões:**
- `pending` → Aguardando confirmação de entrega (escrow)
- `released` → Liberada para saque
- `paid` → Paga ao afiliado
- `cancelled` → Cancelada (devolução)

**Funcionalidades:**
- ✅ Cálculo automático de comissões por venda
- ✅ Sistema de escrow (retenção temporária)
- ✅ Liberação automática após período configurável
- ✅ Cancelamento automático em devoluções
- ✅ Relatórios por período (dia, semana, mês)
- ✅ Resumo de comissões por afiliado
- ✅ Histórico completo de transações

**Endpoints:**
```
GET    /api/commissions                    # Listar minhas comissões
GET    /api/commissions/summary            # Resumo financeiro
GET    /api/commissions/period             # Comissões por período
POST   /api/commissions/calculate/:orderId # Calcular comissões (interno)
POST   /api/commissions/release/:orderId   # Liberar comissões (interno)
POST   /api/commissions/cancel/:orderId    # Cancelar comissões (interno)
```

---

### 4. 🔒 Sistema de Escrow (Garantia)

**O que faz:**
- Retém valores até confirmação de entrega
- Protege compradores contra fraudes
- Protege vendedores contra chargebacks indevidos
- Libera pagamentos automaticamente após período de garantia

**Fluxo:**
1. **Compra realizada** → Pagamento aprovado
2. **Escrow ativado** → Valores retidos (vendedor + afiliados)
3. **Período de garantia** → 7 dias (configurável)
4. **Entrega confirmada** → Valores liberados automaticamente
5. **Devolução solicitada** → Valores estornados, comissões canceladas

**Configurações:**
- Período de escrow: 7 dias (padrão, configurável via `.env`)
- Liberação automática via job agendado
- Notificações por e-mail em cada etapa

---

### 5. 🔄 Suporte a Recorrência (Assinaturas)

**O que faz:**
- Permite produtos com cobrança recorrente (mensal, anual)
- Afiliados recebem comissão em TODAS as renovações
- Rastreamento de ciclos de cobrança
- Cancelamento automático de comissões se assinatura cancelar

**Funcionalidades:**
- ✅ Produtos com cobrança recorrente
- ✅ Comissões recorrentes para afiliados
- ✅ Rastreamento de ciclos (`billing_cycle`)
- ✅ Renovação automática de comissões
- ✅ Cancelamento em caso de inadimplência

**Exemplo:**
```
Assinatura de R$ 50/mês:
├─ Mês 1: Afiliado recebe R$ 20 (40% do pool)
├─ Mês 2: Afiliado recebe R$ 20 (40% do pool)
├─ Mês 3: Afiliado recebe R$ 20 (40% do pool)
└─ ... enquanto assinatura estiver ativa
```

---

### 6. 🛍️ Gestão de Produtos

**O que faz:**
- Vendedores criam e gerenciam seus produtos
- Configuração de preços e comissões
- Publicação e despublicação de produtos
- Controle de estoque e disponibilidade

**Funcionalidades:**
- ✅ CRUD completo de produtos
- ✅ Configuração de % de comissão (25% a 50%)
- ✅ Suporte a produtos físicos e digitais
- ✅ Suporte a produtos recorrentes (assinaturas)
- ✅ Upload de imagens e descrições
- ✅ Controle de status (draft, published, archived)

**Endpoints:**
```
POST   /api/products              # Criar produto
GET    /api/products              # Listar produtos
GET    /api/products/:id          # Ver detalhes
PUT    /api/products/:id          # Atualizar produto
DELETE /api/products/:id          # Deletar produto
POST   /api/products/:id/publish  # Publicar produto
```

---

### 7. 📦 Gestão de Pedidos

**O que faz:**
- Processa pedidos de compra
- Integra com gateways de pagamento
- Rastreia status de entrega
- Gerencia devoluções e cancelamentos

**Status de Pedidos:**
- `pending` → Aguardando pagamento
- `paid` → Pagamento confirmado
- `processing` → Em processamento
- `shipped` → Enviado
- `delivered` → Entregue
- `cancelled` → Cancelado
- `refunded` → Reembolsado

**Funcionalidades:**
- ✅ Criação de pedidos via link de afiliado
- ✅ Processamento de pagamento automático
- ✅ Rastreamento de status
- ✅ Confirmação de entrega
- ✅ Cancelamento e reembolso
- ✅ Estatísticas de vendas

**Endpoints:**
```
POST   /api/orders                # Criar pedido
GET    /api/orders                # Listar pedidos
GET    /api/orders/:id            # Ver detalhes
POST   /api/orders/:id/confirm    # Confirmar pagamento
POST   /api/orders/:id/cancel     # Cancelar pedido
GET    /api/orders/stats          # Estatísticas
```

---

### 8. 💳 Processamento de Pagamentos

**O que faz:**
- Integra com múltiplos gateways de pagamento
- Processa pagamentos de forma segura
- Gerencia webhooks de confirmação
- Suporta reembolsos

**Gateways Suportados:**
- ✅ **Pagar.me** (implementado)
- ✅ **Asaas** (implementado)
- ✅ **Stripe** (implementado)
- 🔄 Fácil adicionar novos gateways (padrão Factory)

**Funcionalidades:**
- ✅ Processamento de cartão de crédito
- ✅ Processamento de boleto
- ✅ Processamento de PIX
- ✅ Webhooks para confirmação automática
- ✅ Reembolsos totais e parciais
- ✅ Retry automático em falhas

**Endpoints:**
```
POST   /api/payments/process      # Processar pagamento
GET    /api/payments/:id          # Ver detalhes
POST   /api/payments/:id/refund   # Reembolsar
POST   /api/payments/webhook      # Webhook (público)
```

---

### 9. 👥 Gestão de Usuários

**O que faz:**
- Cadastro e autenticação de usuários
- Controle de perfis (vendedor, afiliado, comprador)
- Gerenciamento de carteiras digitais
- Histórico de transações

**Tipos de Usuário:**
- **Vendedor** → Cria produtos, recebe vendas
- **Afiliado** → Promove produtos, recebe comissões
- **Comprador** → Compra produtos
- **Admin** → Gerencia plataforma

**Funcionalidades:**
- ✅ Registro com validação de e-mail
- ✅ Login com JWT
- ✅ Perfis múltiplos (um usuário pode ser vendedor E afiliado)
- ✅ Carteira digital integrada
- ✅ Histórico de transações
- ✅ Atualização de perfil

**Endpoints:**
```
POST   /api/users/register        # Cadastrar
POST   /api/users/login           # Login
GET    /api/users/profile         # Ver perfil
PUT    /api/users/profile         # Atualizar perfil
POST   /api/users/activate        # Ativar conta
```

---

### 10. 📧 Sistema de Notificações

**O que faz:**
- Envia e-mails transacionais
- Notifica sobre eventos importantes
- Mantém histórico de notificações

**Eventos Notificados:**
- ✅ Novo pedido (vendedor)
- ✅ Pagamento confirmado (comprador)
- ✅ Comissão gerada (afiliado)
- ✅ Comissão liberada (afiliado)
- ✅ Pedido enviado (comprador)
- ✅ Pedido entregue (comprador)
- ✅ Reembolso processado (comprador)

**Canais:**
- ✅ E-mail (SMTP configurável)
- 🔄 WhatsApp (estrutura pronta, aguardando integração)
- 🔄 SMS (estrutura pronta, aguardando integração)

---

## 🏗️ Arquitetura Técnica

### Padrões Utilizados

- **Clean Architecture** → Separação clara de responsabilidades
- **Domain-Driven Design** → Lógica de negócio no domínio
- **Repository Pattern** → Abstração de acesso a dados
- **Factory Pattern** → Criação de gateways de pagamento
- **Dependency Injection** → Baixo acoplamento entre módulos

### Estrutura de Módulos

Cada módulo segue a mesma estrutura:

```
module/
├── domain/              # Entidades e regras de negócio
│   ├── Entity.js       # Entidade do domínio
│   └── Repository.js   # Interface do repositório
├── application/         # Casos de uso
│   └── UseCase.js      # Lógica de aplicação
├── infrastructure/      # Implementações
│   └── PostgresRepo.js # Repositório concreto
└── http/               # Rotas e controllers
    └── routes.js       # Endpoints REST
```

### Tecnologias

- **Node.js** → Runtime JavaScript
- **Express** → Framework web
- **PostgreSQL** → Banco de dados relacional
- **JWT** → Autenticação stateless
- **Jest** → Testes automatizados
- **Nodemailer** → Envio de e-mails

---

## 📊 Métricas e Relatórios

### Dashboard do Afiliado

```
📊 Meu Desempenho
├─ 👁️  Cliques: 1.234
├─ 🛒 Conversões: 45 (3.6%)
├─ 💰 Comissões Pendentes: R$ 1.250,00
├─ ✅ Comissões Liberadas: R$ 3.890,00
└─ 💳 Comissões Pagas: R$ 12.450,00
```

### Dashboard do Vendedor

```
📊 Minhas Vendas
├─ 🛍️  Pedidos: 156
├─ 💰 Faturamento: R$ 45.600,00
├─ 🤝 Afiliados Ativos: 23
├─ 📈 Taxa de Conversão: 4.2%
└─ ⭐ Ticket Médio: R$ 292,31
```

### Dashboard da Plataforma

```
📊 Visão Geral
├─ 👥 Usuários: 1.234
├─ 🛍️  Produtos: 456
├─ 💰 Volume Total: R$ 1.234.567,00
├─ 💵 Taxa Plataforma: R$ 12.345,67
└─ 🤝 Comissões Pagas: R$ 493.826,80
```

---

## 🔐 Segurança

### Implementações

- ✅ **Autenticação JWT** → Tokens seguros com expiração
- ✅ **Validação de Entrada** → Sanitização de dados
- ✅ **SQL Injection Protection** → Queries parametrizadas
- ✅ **Rate Limiting** → Proteção contra ataques
- ✅ **CORS** → Controle de origem
- ✅ **Helmet** → Headers de segurança
- ✅ **Bcrypt** → Hash de senhas
- ✅ **Variáveis de Ambiente** → Dados sensíveis protegidos

### Boas Práticas

- Senhas nunca armazenadas em texto plano
- Tokens JWT com tempo de expiração
- Validação de permissões em todas as rotas
- Logs de auditoria para operações críticas
- Transações de banco para operações financeiras

---

## 🧪 Testes Automatizados

### Cobertura

- **Testes Unitários** → 80%+ de cobertura
- **Testes E2E** → Fluxo completo de venda
- **Testes de Integração** → Banco de dados real

### Suíte de Testes

```bash
npm test              # Todos os testes
npm run test:unit     # Só unitários
npm run test:e2e      # Só E2E
npm run test:coverage # Com relatório de cobertura
```

### Casos Testados

- ✅ Cálculo de comissões multinível
- ✅ Split payment sem perder centavos
- ✅ Sistema de escrow
- ✅ Cadeia de indicação de afiliados
- ✅ Cancelamento e reembolso
- ✅ Recorrência de assinaturas
- ✅ Validação de limites de comissão

---

## 🚀 Como Usar

### 1. Instalação

```bash
# Clonar repositório
git clone https://github.com/SxConnect/impakt.git
cd impakt

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Criar banco de dados
psql -U postgres -c "CREATE DATABASE impakt_test;"
psql -U postgres -d impakt_test -f IMPAKT_schema.sql

# Rodar testes
npm test

# Iniciar servidor
npm start
```

### 2. Fluxo Básico

**Vendedor:**
1. Cadastrar-se na plataforma
2. Criar produto com % de comissão
3. Publicar produto
4. Aguardar vendas

**Afiliado:**
1. Cadastrar-se na plataforma
2. Gerar link de afiliado para produto
3. Compartilhar link nas redes sociais
4. Receber comissões automaticamente

**Comprador:**
1. Clicar no link do afiliado
2. Realizar compra
3. Aguardar entrega
4. Confirmar recebimento

---

## 📈 Casos de Uso Reais

### E-commerce de Cursos Online

```
Cenário: Plataforma de cursos com afiliados
├─ Vendedor: Instrutor cria curso de R$ 497
├─ Afiliado 1: Influencer promove e vende 50 cursos
├─ Afiliado 2: Foi indicado pelo Afiliado 1, vende 20 cursos
└─ Resultado:
   ├─ Instrutor: R$ 14.663,00 (59% de R$ 24.850)
   ├─ Afiliado 1: R$ 6.958,00 (vendas próprias + indicação)
   ├─ Afiliado 2: R$ 3.980,00 (vendas próprias)
   └─ Plataforma: R$ 248,50 (1%)
```

### SaaS com Assinaturas

```
Cenário: Software com plano mensal de R$ 99
├─ Afiliado promove e converte 10 clientes
├─ Comissão mensal: R$ 396,00 (40% do pool de R$ 990)
└─ Comissão anual: R$ 4.752,00 (se todos mantiverem)
```

### Marketplace de Produtos Físicos

```
Cenário: Loja de eletrônicos
├─ Produto: Fone Bluetooth R$ 299
├─ Afiliado vende 100 unidades
├─ Comissão: R$ 11.960,00 (40% do pool de R$ 29.900)
└─ Escrow: 7 dias após entrega confirmada
```

---

## 🎯 Diferenciais Competitivos

### 1. Split Automático Perfeito
- Não perde centavos no arredondamento
- Divisão proporcional justa
- Transparência total

### 2. Multinível Inteligente
- Quem vende recebe mais
- Quem indica também recebe
- Incentiva crescimento orgânico

### 3. Escrow Integrado
- Proteção para compradores
- Segurança para vendedores
- Liberação automática

### 4. Recorrência Nativa
- Comissões em todas as renovações
- Incentiva vendas de assinaturas
- Receita previsível para afiliados

### 5. Arquitetura Escalável
- Clean Architecture
- Fácil manutenção
- Fácil adicionar features

---

## 📞 Suporte e Documentação

### Documentação Disponível

- ✅ **README.md** → Visão geral e instalação
- ✅ **API-DOCUMENTATION.md** → Todos os endpoints
- ✅ **AFFILIATE-MODULE.md** → Sistema de afiliados
- ✅ **COMMISSION-MODULE.md** → Gestão de comissões
- ✅ **PAYMENT-ARCHITECTURE.md** → Arquitetura de pagamentos
- ✅ **TESTES-README.md** → Como rodar testes
- ✅ **SETUP.md** → Configuração completa

### Arquivos de Teste HTTP

- ✅ `test-api.http` → Testes gerais
- ✅ `test-api-affiliates.http` → Testes de afiliados
- ✅ `test-api-commissions.http` → Testes de comissões
- ✅ `test-api-orders.http` → Testes de pedidos
- ✅ `test-api-payments.http` → Testes de pagamentos

---

## 🎓 Próximos Passos

### Roadmap

**Fase 1 - MVP** ✅ (Concluído)
- Sistema de afiliados multinível
- Split payment automático
- Gestão de comissões
- Escrow e recorrência

**Fase 2 - Melhorias** 🔄 (Em Planejamento)
- Dashboard visual com gráficos
- Relatórios avançados em PDF
- Integração com WhatsApp
- App mobile para afiliados

**Fase 3 - Escala** 📋 (Futuro)
- Sistema de cupons de desconto
- Programa de fidelidade
- Gamificação para afiliados
- IA para recomendação de produtos

---

## 💡 Conclusão

IMPAKT é uma solução completa e robusta para marketplaces que desejam implementar um programa de afiliados profissional com split payment automático e gestão inteligente de comissões.

### Principais Benefícios

✅ **Automatização Total** → Menos trabalho manual, mais vendas  
✅ **Transparência** → Todos sabem quanto vão receber  
✅ **Escalabilidade** → Arquitetura preparada para crescer  
✅ **Segurança** → Escrow e validações em todas as operações  
✅ **Flexibilidade** → Fácil customizar e adicionar features  

---

## 📊 Estatísticas do Projeto

- **Linhas de Código**: ~23.000
- **Arquivos**: 129
- **Módulos**: 7 (affiliate, commission, order, payment, product, user, notification)
- **Endpoints**: 40+
- **Testes**: 75+ casos
- **Cobertura**: 80%+
- **Tempo de Desenvolvimento**: 6 dias

---

## 🔗 Links Úteis

- **Repositório**: https://github.com/SxConnect/impakt
- **Documentação Completa**: Ver arquivos `.md` na raiz
- **Schema do Banco**: `IMPAKT_schema.sql`
- **Testes**: `npm test`

---

**Desenvolvido com ❤️ para revolucionar o mercado de afiliados**
