# 🚀 IMPAKT Backend

**I**mpulsionando **M**ercados com **P**agamentos **A**utomáticos, **K**omissões e **T**ransações

Sistema completo de marketplace com programa de afiliados multinível, split payment automático e gestão de comissões.

[![GitHub](https://img.shields.io/badge/GitHub-SxConnect%2Fimpakt-blue)](https://github.com/SxConnect/impakt)
[![Node.js](https://img.shields.io/badge/Node.js-ES6%20Modules-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-75%20passing-success)](./TESTES-ATUALIZADOS.md)
[![Coverage](https://img.shields.io/badge/Coverage-80%25%2B-brightgreen)](./coverage/index.html)

---

## 📋 Sobre o Projeto

IMPAKT é uma plataforma de marketplace que permite:

- 🛍️ **Marketplace Completo** - Vendedores, produtos, pedidos e pagamentos
- 🤝 **Programa de Afiliados** - Sistema multinível com rastreamento de conversões
- 💰 **Split Payment Automático** - Divisão inteligente de valores entre participantes
- 📊 **Gestão de Comissões** - Cálculo e liberação automática de comissões
- 🔒 **Escrow** - Retenção de valores até confirmação de entrega
- 🔄 **Recorrência** - Suporte a assinaturas e pagamentos recorrentes

---

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture** com separação clara de responsabilidades:

```
src/
├── modules/              # Módulos de domínio
│   ├── affiliate/       # Sistema de afiliados
│   ├── commission/      # Cálculo de comissões
│   ├── order/           # Gestão de pedidos
│   ├── payment/         # Processamento de pagamentos
│   ├── product/         # Catálogo de produtos
│   ├── user/            # Gestão de usuários
│   └── notification/    # Notificações
├── shared/              # Código compartilhado
│   ├── database/        # Conexão com banco
│   ├── middleware/      # Middlewares Express
│   ├── services/        # Serviços compartilhados
│   └── utils/           # Utilitários
└── jobs/                # Jobs agendados
```

Cada módulo segue a estrutura:
- **domain/** - Entidades e regras de negócio
- **application/** - Casos de uso
- **infrastructure/** - Implementações (repositórios, gateways)
- **http/** - Rotas e controllers

---

## 🧪 Testes Automatizados

Suite completa de testes para o marketplace IMPAKT.  
Integrada com os **Agent Hooks do Kiro** para execução automática.

---

## Instalação

```bash
npm install
```

---

## Como rodar

| Comando | O que faz |
|---|---|
| `npm test` | Roda todos os testes (unit + e2e) |
| `npm run test:unit` | Só testes unitários + cobertura |
| `npm run test:e2e` | Só testes E2E ponta a ponta |
| `npm run test:split` | Só o CommissionCalculator (crítico) |
| `npm run test:escrow` | Só a lógica de escrow |
| `npm run test:watch` | Modo watch — reroda ao salvar |
| `npm run test:ci` | Modo CI/CD — falha se cobertura < mínimo |

---

## Estrutura dos arquivos

```
tests/
├── setup/
│   ├── globalSetup.js       # Cria banco IMPAKT_test antes de tudo
│   ├── globalTeardown.js    # Limpa banco após todos os testes
│   └── dbHelper.js          # Utilitários compartilhados
│
├── unit/
│   ├── commission/
│   │   └── CommissionCalculator.test.js  # Lógica de split
│   ├── order/
│   │   └── escrow.test.js               # Lógica de escrow
│   └── affiliate/
│       └── AffiliateChain.test.js        # Cadeia de indicação
│
└── e2e/
    └── fluxo-completo.test.js  # Fluxo ponta a ponta com banco real

.kiro/
├── steering/
│   └── testing.md              # Contexto persistente para o Kiro
└── hooks/
    ├── split-guard.yaml         # Roda testes de split ao salvar commission/
    ├── escrow-guard.yaml        # Roda testes de escrow ao salvar order/
    └── auto-test-generation.yaml # Gera testes ao salvar qualquer módulo
```

---

## Fluxos testados no E2E

1. **Cadastro** — Vendedor, afiliado N1, afiliado N2 (indicado por N1), comprador
2. **Produto** — Criação com % de afiliados, validação de limites (25%–50%)
3. **Link de afiliado** — Geração de link rastreável, cliques, unicidade
4. **Compra** — Pedido via link, escrow retido, status correto
5. **Split** — 1% plataforma + 40% afiliados + 59% vendedor, sem centavo perdido
6. **Multinível** — Quem vende recebe mais, soma fecha em 100% do pool
7. **Devolução** — Estorno total, zero comissão, carteiras não atualizadas
8. **Recorrência** — Assinatura mensal, billing_cycle++, afiliado recebe todo mês

---

## Cobertura mínima exigida

| Módulo | Mínimo |
|---|---|
| commission/ | 95% |
| order/ | 90% |
| Geral | 80% |

---

## Configuração do banco de teste

O banco `IMPAKT_test` é criado automaticamente pelo `globalSetup.js`.  
Certifique-se de ter o PostgreSQL rodando localmente com:

```
host:     localhost
port:     5432
user:     postgres
password: postgres
```

Ou sobrescreva via variáveis de ambiente:

```bash
DB_HOST=meu-host DB_USER=meu-user DB_PASSWORD=minha-senha npm test
```

---

## Integração com o Kiro

Os hooks em `.kiro/hooks/` rodam automaticamente quando você salva arquivos.  
O arquivo `.kiro/steering/testing.md` mantém o contexto das regras de negócio  
do IMPAKT para que o Kiro gere testes corretos automaticamente.

**Para pedir ao Kiro que gere testes de um novo módulo:**

> *"Leia .kiro/steering/testing.md e gere os testes Jest para o módulo  
> src/modules/[nome]/application/[UseCase].js seguindo as regras do IMPAKT."*
