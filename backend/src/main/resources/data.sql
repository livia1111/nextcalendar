-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Usuário Gestor (Owner)
-- Credencial: gestor@barbearia.com / 123456
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO users (
    id,
    name,
    email,
    password_hash,
    role,
    active,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Gestor Barbearia',
    'gestor@barbearia.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi',
    'MANAGER',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Estabelecimento Principal
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO establishments (
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
) VALUES (
    '3fa85f64-5717-4562-b3fc-2c963f66afa6',
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

-- Estabelecimento espelho para atender o ID procurado na Home do cliente (dd7460ab...)
INSERT INTO establishments (
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
) VALUES (
    'dd7460ab-eca5-41b1-a9d6-86fb4661bc97',
    '00000000-0000-0000-0000-000000000001',
    'Barbearia Premium LTDA',
    'Barbearia Premium',
    '11111111000199',
    '(11) 98888-0000',
    '(11) 98888-0000',
    'premium@barbearia.com',
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Profissionais de teste
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO professionals (
    id, establishment_id, name, nickname, cpf, email, password,
    phone, gender, photo_url, commission, active, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    'João Barbeiro', 'João', '12345678909', 'joao.barbeiro@teste.com', 'senha1234',
    '51999990000', 'M', 'https://i.pravatar.cc/150?img=12', 30, TRUE,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Horários de trabalho
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO working_hours (id, professional_id, day_of_week, start_time, end_time, break_start, break_end, active)
VALUES
    ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', 'MONDAY',   '09:00:00', '19:00:00', '12:00:00', '13:00:00', TRUE),
    ('66666666-6666-6666-6666-666666666664', '11111111-1111-1111-1111-111111111111', 'THURSDAY', '09:00:00', '19:00:00', '12:00:00', '13:00:00', TRUE);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Serviços de teste (vinculados a ambos os estabelecimentos)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO services (id, establishment_id, name, price, duration, category, active, created_at, updated_at)
VALUES
    ('22222222-2222-2222-2222-222222222221', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 'Corte Degradê', 70.00, 40, 'Cabelo', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 'Barba',         40.00, 20, 'Barba',  TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222223', 'dd7460ab-eca5-41b1-a9d6-86fb4661bc97', 'Corte Tradicional', 50.00, 30, 'Cabelo', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222224', 'dd7460ab-eca5-41b1-a9d6-86fb4661bc97', 'Barba Completa',    35.00, 20, 'Barba',  TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Produtos de teste
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO products (id, establishment_id, name, category, price, stock_quantity, active, created_at, updated_at)
VALUES (
    '33333333-3333-3333-3333-333333333333', '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    'Pomada Modeladora', 'Finalizador', 50.00, 20, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. Clientes de teste
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO clients (id, name, phone, email, date_of_birth, photo_url, notes, active, created_at, updated_at)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'Maria Cliente', '51988887777', 'maria.cliente@teste.com', '1995-05-20',
    'https://i.pravatar.cc/150?img=5', 'Prefere cortes curtos', TRUE,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. Agendamentos de teste
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO appointments (
    id, establishment_id, professional_id, client_id, service_id,
    start_date_time, end_date_time, status, is_fit_in, notes, version, created_at, updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222221',
    '2026-09-10 14:00:00', '2026-09-10 14:40:00', 'SCHEDULED', FALSE, 'Agendamento de teste', 0,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);