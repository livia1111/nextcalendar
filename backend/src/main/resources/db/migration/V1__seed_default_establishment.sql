-- ═══════════════════════════════════════════════════════════════════════════
-- V1: Seed do estabelecimento padrão (single-tenant)
--
-- UUID FIXO: 11111111-1111-1111-1111-111111111111
-- Este valor é a fonte de verdade para o frontend e o backend.
-- Atualize o .env do frontend para bater com este UUID.
--
-- Sintaxe H2: MERGE INTO ... (idempotente — não falha em reruns)
-- Ao migrar para PostgreSQL, substitua por:
--   INSERT INTO ... ON CONFLICT (id) DO NOTHING;
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Estabelecimento padrão ───────────────────────────────────────────────────
MERGE INTO establishments (
    id,
    owner_id,
    legal_name,
    name,
    cnpj,
    phone,
    whatsapp,
    email,
    business_type,
    logo_url,
    trial_start_date,
    trial_end_date,
    terms_accepted,
    terms_accepted_at,
    active,
    created_at,
    updated_at
) KEY (id) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Barbearia Dev LTDA',
    'Barbearia Dev',
    '00000000000000',
    '(11) 99999-0000',
    '(11) 99999-0000',
    'dev@barbearia.com',
    'Barbearia',
    NULL,
    CURRENT_TIMESTAMP,
    DATEADD('DAY', 30, CURRENT_TIMESTAMP),
    TRUE,
    CURRENT_TIMESTAMP,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ── Profissional de teste ────────────────────────────────────────────────────
MERGE INTO professionals (
    id, establishment_id, name, nickname, cpf, email, password,
    phone, gender, photo_url, commission, active, created_at, updated_at
) KEY (id) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'João Barbeiro', 'João', '12345678909', 'joao.barbeiro@teste.com', 'senha1234',
    '51999990000', 'M', 'https://i.pravatar.cc/150?img=12', 30, TRUE,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ── Horários de trabalho (segunda e quinta, 09h-19h, almoço 12h-13h) ─────────
MERGE INTO working_hours (id, professional_id, day_of_week, start_time, end_time, break_start, break_end, active)
KEY (id) VALUES
    ('66666666-6666-6666-6666-666666666661', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MONDAY',   '09:00:00', '19:00:00', '12:00:00', '13:00:00', TRUE);

MERGE INTO working_hours (id, professional_id, day_of_week, start_time, end_time, break_start, break_end, active)
KEY (id) VALUES
    ('66666666-6666-6666-6666-666666666664', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'THURSDAY', '09:00:00', '19:00:00', '12:00:00', '13:00:00', TRUE);

-- ── Serviços de teste ────────────────────────────────────────────────────────
MERGE INTO services (id, establishment_id, name, price, duration, category, active, created_at, updated_at)
KEY (id) VALUES
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Corte Degradê', 70.00, 40, 'Cabelo', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

MERGE INTO services (id, establishment_id, name, price, duration, category, active, created_at, updated_at)
KEY (id) VALUES
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Barba', 40.00, 20, 'Barba', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ── Produto de teste ─────────────────────────────────────────────────────────
MERGE INTO products (id, establishment_id, name, category, price, stock_quantity, active, created_at, updated_at)
KEY (id) VALUES (
    '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
    'Pomada Modeladora', 'Finalizador', 50.00, 20, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ── Cliente de teste ─────────────────────────────────────────────────────────
MERGE INTO clients (id, name, phone, email, date_of_birth, photo_url, notes, active, created_at, updated_at)
KEY (id) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'Maria Cliente', '51988887777', 'maria.cliente@teste.com', '1995-05-20',
    'https://i.pravatar.cc/150?img=5', 'Prefere cortes curtos', TRUE,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ── Agendamento de teste ─────────────────────────────────────────────────────
MERGE INTO appointments (
    id, establishment_id, professional_id, client_id, service_id,
    start_date_time, end_date_time, status, is_fit_in, notes, version, created_at, updated_at
) KEY (id) VALUES (
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222221',
    '2026-12-15 14:00:00', '2026-12-15 14:40:00', 'SCHEDULED', FALSE, 'Agendamento de teste', 0,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
