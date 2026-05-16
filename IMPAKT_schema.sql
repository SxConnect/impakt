-- ============================================================
-- impakt MARKETPLACE — Esquema PostgreSQL 16
-- Otimizado para: alto volume de usuários, produtos, afiliados,
-- mídias (imagem/vídeo/link) e transações recorrentes
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- busca full-text com LIKE otimizado
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- índices GIN em tipos simples
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- hash seguro de senhas no banco

-- ============================================================
-- ENUMS — tipos fixos do domínio
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'seller', 'affiliate', 'buyer');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'banned');
CREATE TYPE product_type AS ENUM ('physical', 'digital', 'service', 'subscription');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'paused', 'deleted');
CREATE TYPE media_type AS ENUM ('image', 'video_upload', 'video_link', 'document', 'link');
CREATE TYPE order_status AS ENUM (
  'pending_payment', 'paid', 'processing', 'delivered',
  'confirmed', 'disputed', 'refunded', 'cancelled'
);
CREATE TYPE commission_status AS ENUM ('pending', 'held', 'released', 'cancelled');
CREATE TYPE payment_method AS ENUM ('credit_card', 'pix', 'boleto', 'subscription');
CREATE TYPE notification_type AS ENUM (
  'sale', 'commission_released', 'refund', 'welcome',
  'escrow_released', 'subscription_renewed', 'product_confirmed'
);

-- ============================================================
-- TABELA: users
-- Alta inserção — particionada por status para queries rápidas
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(320) NOT NULL,
  phone           VARCHAR(20),
  password_hash   TEXT NOT NULL,
  full_name       VARCHAR(200) NOT NULL,
  cpf_cnpj        VARCHAR(18),                        -- obrigatório para saque
  role            user_role NOT NULL DEFAULT 'buyer',
  status          user_status NOT NULL DEFAULT 'pending',
  avatar_url      TEXT,
  bio             TEXT,
  bank_account    JSONB,                               -- { bank, agency, account, pix_key }
  referral_code   VARCHAR(20) UNIQUE,                 -- código único de afiliado
  referred_by     UUID REFERENCES users(id),          -- quem indicou este usuário
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}'                  -- dados extras sem alterar schema
);

-- Índices para users (cobrindo os acessos mais comuns)
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_cpf_cnpj ON users(cpf_cnpj) WHERE cpf_cnpj IS NOT NULL;
CREATE UNIQUE INDEX idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX idx_users_referred_by ON users(referred_by) WHERE referred_by IS NOT NULL;
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================
-- TABELA: categories
-- Hierárquica com closure table para queries eficientes
-- ============================================================

CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) UNIQUE NOT NULL,
  parent_id   INT REFERENCES categories(id),
  icon_url    TEXT,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- ============================================================
-- TABELA: products
-- Particionada por status — o volume de ativos é muito menor
-- que o histórico de deletados
-- ============================================================

CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id         INT REFERENCES categories(id),
  name                VARCHAR(300) NOT NULL,
  slug                VARCHAR(350) UNIQUE NOT NULL,
  description         TEXT,
  short_description   VARCHAR(500),
  product_type        product_type NOT NULL DEFAULT 'digital',
  status              product_status NOT NULL DEFAULT 'draft',

  -- Preço e recorrência
  price_cents         INT NOT NULL CHECK (price_cents > 0),    -- em centavos (R$ 100 = 10000)
  is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_days      SMALLINT DEFAULT 30,                     -- ciclo em dias (30 = mensal)

  -- Configuração de afiliados
  affiliate_pct       NUMERIC(5,2) NOT NULL DEFAULT 25.00      -- % total para afiliados + distribuição
                        CHECK (affiliate_pct BETWEEN 25 AND 50),
  max_affiliate_levels SMALLINT NOT NULL DEFAULT 3
                        CHECK (max_affiliate_levels BETWEEN 1 AND 5),
  level_commission    JSONB NOT NULL DEFAULT '[]',             -- [{level:1, pct:40}, {level:2, pct:35}...]

  -- Configuração de distribuição de renda
  income_dist_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  income_dist_config  JSONB DEFAULT '[]',                      -- [{user_id, pct}, ...] até 5 pessoas

  -- Garantia
  warranty_days       SMALLINT NOT NULL DEFAULT 7,

  -- Busca full-text
  search_vector       TSVECTOR GENERATED ALWAYS AS (
                        to_tsvector('portuguese',
                          coalesce(name, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(description, '')
                        )
                      ) STORED,

  -- Estatísticas desnormalizadas (atualizadas via trigger)
  total_sales         INT NOT NULL DEFAULT 0,
  total_revenue_cents BIGINT NOT NULL DEFAULT 0,
  avg_rating          NUMERIC(3,2) DEFAULT NULL,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at        TIMESTAMPTZ,
  deleted_at          TIMESTAMPTZ                              -- soft delete
);

-- Índices para products
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_price ON products(price_cents);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_active ON products(seller_id, status)
  WHERE status = 'active' AND deleted_at IS NULL;   -- índice parcial — só ativos

-- ============================================================
-- TABELA: product_media
-- Separada para não inflar a tabela products
-- Suporta imagens, vídeos (upload e link) e documentos
-- ============================================================

CREATE TABLE product_media (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_type    media_type NOT NULL,
  url           TEXT NOT NULL,                        -- S3/R2 URL ou link externo
  cdn_url       TEXT,                                 -- URL via CDN (gerada após upload)
  thumbnail_url TEXT,                                 -- thumbnail gerada automaticamente
  alt_text      VARCHAR(300),
  title         VARCHAR(300),
  duration_sec  INT,                                  -- para vídeos: duração em segundos
  file_size_kb  INT,                                  -- tamanho em KB
  mime_type     VARCHAR(100),
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_cover      BOOLEAN NOT NULL DEFAULT FALSE,       -- imagem principal do produto
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_product ON product_media(product_id);
CREATE INDEX idx_media_product_type ON product_media(product_id, media_type);
CREATE INDEX idx_media_cover ON product_media(product_id, is_cover) WHERE is_cover = TRUE;

-- Garantir no máximo 1 cover por produto
CREATE UNIQUE INDEX idx_media_one_cover ON product_media(product_id)
  WHERE is_cover = TRUE;

-- ============================================================
-- TABELA: product_links
-- Links externos associados ao produto (demo, site, docs)
-- ============================================================

CREATE TABLE product_links (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label       VARCHAR(100) NOT NULL,
  url         TEXT NOT NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_links_product ON product_links(product_id);

-- ============================================================
-- TABELA: affiliate_links
-- Link único por afiliado por produto — rastreável
-- ============================================================

CREATE TABLE affiliate_links (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  affiliate_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code          VARCHAR(20) UNIQUE NOT NULL,          -- sufixo do link: impakt.com/p/produto?ref=CODE
  clicks        INT NOT NULL DEFAULT 0,
  conversions   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_afflink_product_affiliate ON affiliate_links(product_id, affiliate_id);
CREATE INDEX idx_afflink_code ON affiliate_links(code);
CREATE INDEX idx_afflink_affiliate ON affiliate_links(affiliate_id);

-- ============================================================
-- TABELA: affiliate_chains
-- Registra a cadeia completa de indicação para cada venda
-- Essencial para calcular comissões multinível corretamente
-- ============================================================

CREATE TABLE affiliate_chains (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL,                      -- FK adicionada após criar orders
  product_id      UUID NOT NULL REFERENCES products(id),
  seller_id       UUID NOT NULL REFERENCES users(id),
  levels          JSONB NOT NULL,                     -- [{level:1, user_id, pct, amount_cents}, ...]
  total_pct       NUMERIC(5,2) NOT NULL,
  total_cents     INT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affchain_order ON affiliate_chains(order_id);
CREATE INDEX idx_affchain_product ON affiliate_chains(product_id);

-- ============================================================
-- TABELA: orders
-- Alta inserção — índices parciais por status reduzem varredura
-- ============================================================

CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id            UUID NOT NULL REFERENCES users(id),
  product_id          UUID NOT NULL REFERENCES products(id),
  seller_id           UUID NOT NULL REFERENCES users(id),
  affiliate_link_id   UUID REFERENCES affiliate_links(id),  -- qual link gerou a venda

  -- Valores (todos em centavos)
  amount_cents        INT NOT NULL CHECK (amount_cents > 0),
  platform_fee_cents  INT NOT NULL,                         -- 1%
  affiliate_amt_cents INT NOT NULL DEFAULT 0,               -- total para afiliados
  seller_amt_cents    INT NOT NULL,                         -- restante ao vendedor

  -- Pagamento
  payment_method      payment_method NOT NULL,
  gateway_id          VARCHAR(200),                         -- ID da transação no gateway
  gateway_response    JSONB DEFAULT '{}',                   -- resposta completa do webhook

  -- Status e escrow
  status              order_status NOT NULL DEFAULT 'pending_payment',
  escrow_release_at   TIMESTAMPTZ,                          -- quando o escrow libera
  confirmed_at        TIMESTAMPTZ,                          -- comprador confirmou
  delivered_at        TIMESTAMPTZ,                          -- vendedor marcou entregue
  refunded_at         TIMESTAMPTZ,

  -- Recorrência
  parent_order_id     UUID REFERENCES orders(id),           -- null = primeira compra
  subscription_id     UUID,                                 -- ID da assinatura no gateway
  billing_cycle       SMALLINT NOT NULL DEFAULT 1,          -- 1=primeira, 2=segunda...

  -- Endereço de entrega (físicos)
  shipping_address    JSONB,                                -- {street, number, city, state, zip}
  tracking_code       VARCHAR(100),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para orders
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_escrow ON orders(escrow_release_at)
  WHERE status = 'paid';                                    -- só libera escrow de pagos
CREATE INDEX idx_orders_gateway ON orders(gateway_id) WHERE gateway_id IS NOT NULL;
CREATE INDEX idx_orders_subscription ON orders(subscription_id) WHERE subscription_id IS NOT NULL;

-- FK do affiliate_chains para orders (após criar orders)
ALTER TABLE affiliate_chains
  ADD CONSTRAINT fk_affchain_order FOREIGN KEY (order_id) REFERENCES orders(id);

-- ============================================================
-- TABELA: commissions
-- Uma linha por afiliado por ordem — facilita relatórios
-- ============================================================

CREATE TABLE commissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id),
  affiliate_id    UUID NOT NULL REFERENCES users(id),
  product_id      UUID NOT NULL REFERENCES products(id),
  level           SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
  pct             NUMERIC(5,2) NOT NULL,
  amount_cents    INT NOT NULL CHECK (amount_cents >= 0),
  status          commission_status NOT NULL DEFAULT 'pending',
  released_at     TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comm_order ON commissions(order_id);
CREATE INDEX idx_comm_affiliate ON commissions(affiliate_id);
CREATE INDEX idx_comm_status ON commissions(status);
CREATE INDEX idx_comm_affiliate_status ON commissions(affiliate_id, status);  -- painel do afiliado

-- ============================================================
-- TABELA: income_distributions
-- Distribuição de renda dos beneficiários indicados pelo vendedor
-- ============================================================

CREATE TABLE income_distributions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id),
  product_id      UUID NOT NULL REFERENCES products(id),
  beneficiary_id  UUID NOT NULL REFERENCES users(id),
  pct             NUMERIC(5,2) NOT NULL,
  amount_cents    INT NOT NULL CHECK (amount_cents >= 0),
  status          commission_status NOT NULL DEFAULT 'pending',
  released_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incdist_order ON income_distributions(order_id);
CREATE INDEX idx_incdist_beneficiary ON income_distributions(beneficiary_id, status);

-- ============================================================
-- TABELA: wallets
-- Saldo de cada usuário — atualizado via trigger em commissions
-- ============================================================

CREATE TABLE wallets (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id),
  balance_cents         BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  pending_cents         BIGINT NOT NULL DEFAULT 0 CHECK (pending_cents >= 0),
  total_earned_cents    BIGINT NOT NULL DEFAULT 0,
  total_withdrawn_cents BIGINT NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_wallet_user ON wallets(user_id);

-- ============================================================
-- TABELA: withdrawals
-- Saques solicitados pelos usuários
-- ============================================================

CREATE TABLE withdrawals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  amount_cents    INT NOT NULL CHECK (amount_cents > 0),
  status          VARCHAR(20) NOT NULL DEFAULT 'requested',  -- requested, processing, done, failed
  bank_account    JSONB NOT NULL,                            -- snapshot dos dados bancários
  gateway_id      VARCHAR(200),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- ============================================================
-- TABELA: notifications
-- Notificações in-app + e-mail — particionada por lida/não-lida
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',    -- dados contextuais (order_id, product_id, etc)
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, created_at DESC)
  WHERE read = FALSE;                                 -- índice parcial — só não lidas
CREATE INDEX idx_notif_user ON notifications(user_id, created_at DESC);

-- ============================================================
-- TABELA: landing_registrations
-- Cadastros da landing page (pré-plataforma)
-- ============================================================

CREATE TABLE landing_registrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       VARCHAR(200) NOT NULL,
  email           VARCHAR(320) NOT NULL,
  phone           VARCHAR(20),
  role            VARCHAR(20) NOT NULL,               -- 'seller' ou 'affiliate'

  -- Dados do vendedor
  product_name    VARCHAR(300),
  product_type    VARCHAR(50),
  price_estimate  INT,
  affiliate_pct   SMALLINT,
  levels_desired  SMALLINT,
  description     TEXT,

  -- Dados do afiliado
  niche           VARCHAR(100),
  channels        VARCHAR(300),
  experience      VARCHAR(100),

  accepted_terms  BOOLEAN NOT NULL DEFAULT FALSE,
  converted       BOOLEAN NOT NULL DEFAULT FALSE,     -- TRUE quando virou usuário real
  user_id         UUID REFERENCES users(id),          -- FK após conversão
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_landreg_email ON landing_registrations(email);
CREATE INDEX idx_landreg_role ON landing_registrations(role);
CREATE INDEX idx_landreg_converted ON landing_registrations(converted);

-- ============================================================
-- TRIGGERS — atualização automática de updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER — atualiza wallet quando comissão é liberada
-- ============================================================

CREATE OR REPLACE FUNCTION release_commission_to_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'released' AND OLD.status != 'released' THEN
    UPDATE wallets
    SET
      balance_cents      = balance_cents + NEW.amount_cents,
      pending_cents      = GREATEST(0, pending_cents - NEW.amount_cents),
      total_earned_cents = total_earned_cents + NEW.amount_cents,
      updated_at         = NOW()
    WHERE user_id = NEW.affiliate_id;
  END IF;

  IF NEW.status = 'pending' AND OLD.status IS DISTINCT FROM 'pending' THEN
    UPDATE wallets
    SET pending_cents = pending_cents + NEW.amount_cents,
        updated_at    = NOW()
    WHERE user_id = NEW.affiliate_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_commission_wallet AFTER UPDATE ON commissions
  FOR EACH ROW EXECUTE FUNCTION release_commission_to_wallet();

-- ============================================================
-- TRIGGER — atualiza estatísticas do produto após venda
-- ============================================================

CREATE OR REPLACE FUNCTION update_product_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE products
    SET
      total_sales         = total_sales + 1,
      total_revenue_cents = total_revenue_cents + NEW.seller_amt_cents,
      updated_at          = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_product_stats AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_product_stats();

-- ============================================================
-- VIEW — painel do afiliado (comissões consolidadas)
-- ============================================================

CREATE MATERIALIZED VIEW mv_affiliate_summary AS
SELECT
  c.affiliate_id,
  COUNT(DISTINCT c.order_id)                        AS total_sales,
  SUM(c.amount_cents) FILTER (WHERE c.status = 'released')  AS earned_cents,
  SUM(c.amount_cents) FILTER (WHERE c.status = 'held')      AS pending_cents,
  COUNT(DISTINCT c.product_id)                      AS products_promoted,
  MAX(c.created_at)                                 AS last_sale_at
FROM commissions c
GROUP BY c.affiliate_id
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_affiliate_summary ON mv_affiliate_summary(affiliate_id);

-- Atualizar a view manualmente ou via cron: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_affiliate_summary;

-- ============================================================
-- DADOS INICIAIS — categoria raiz
-- ============================================================

INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
  ('Produtos Digitais',  'digitais',   NULL, 1),
  ('Produtos Físicos',   'fisicos',    NULL, 2),
  ('Serviços',           'servicos',   NULL, 3),
  ('Assinaturas',        'assinaturas',NULL, 4),
  ('Cursos e Educação',  'cursos',     1,    1),
  ('E-books',            'ebooks',     1,    2),
  ('Software e Apps',    'software',   1,    3),
  ('Moda e Beleza',      'moda',       2,    1),
  ('Casa e Decoração',   'casa',       2,    2),
  ('Saúde e Bem-estar',  'saude',      2,    3);

-- ============================================================
-- FIM DO SCHEMA impakt v1.0
-- ============================================================
