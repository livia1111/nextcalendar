-- Seed: estabelecimento de desenvolvimento
-- ID fixo que corresponde ao ESTABLISHMENT_ID usado no frontend-barbearia (ServicosScreen)
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
