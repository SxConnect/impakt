# IMPAKT — Testes Automatizados

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
