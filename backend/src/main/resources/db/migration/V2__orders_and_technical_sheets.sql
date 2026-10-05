-- ═══════════════════════════════════════════════════════════════════════════
-- V2: Tabelas e seeds para Comandas (Orders), Fichas Técnicas e Fotos
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    establishment_id UUID NOT NULL,
    appointment_id UUID NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    closed_total_amount NUMERIC(10, 2),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    service_id UUID,
    product_id UUID,
    name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS technical_sheets (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL UNIQUE,
    observations TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS technical_sheet_entries (
    id UUID PRIMARY KEY,
    technical_sheet_id UUID NOT NULL,
    appointment_id UUID NOT NULL,
    professional_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS technical_sheet_photos (
    id UUID PRIMARY KEY,
    entry_id UUID NOT NULL,
    photo_url VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY,
    data BLOB NOT NULL,
    content_type VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- ── Produtos adicionais para o estabelecimento padrão ────────────────────────
MERGE INTO products (id, establishment_id, name, category, price, stock_quantity, active, created_at, updated_at)
KEY (id) VALUES (
    '33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111',
    'Óleo para Barba', 'Barba', 45.00, 15, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

MERGE INTO products (id, establishment_id, name, category, price, stock_quantity, active, created_at, updated_at)
KEY (id) VALUES (
    '33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111',
    'Shampoo Anticaspa', 'Cabelo', 38.00, 10, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
