-- ---------------------------------------------------------------------------
-- Datos demo de Hupi.Pet
--
-- Replica los identificadores y nombres EXACTOS de los mocks de `mobile/`,
-- para que la app se vea igual con backend o sin él.
--
-- Uso:
--   psql "$DATABASE_URL" -f backend/seeds/demo_data.sql
--
-- Es idempotente: los UUID se derivan del identificador textual del mock, así
-- que relanzarlo actualiza en lugar de duplicar.
-- ---------------------------------------------------------------------------

BEGIN;

-- UUID estable a partir del id del mock ('provider-andres', 'QA-WALK-001', ...).
CREATE OR REPLACE FUNCTION demo_id(mock_id TEXT)
RETURNS UUID
LANGUAGE sql IMMUTABLE STRICT
AS $$
    SELECT uuid_generate_v5('a0e1b2c3-d4e5-4f60-8a71-9b2c3d4e5f60'::uuid, mock_id)
$$;

-- ============================================================================
-- 1. CUENTAS
-- ============================================================================

INSERT INTO accounts (
    id, phone, phone_verified, email, email_validated,
    first_name, last_name, city, sector, onboarding_completed, profile_completed
) VALUES
    (demo_id('user-001'), '593991234567', TRUE, 'valentina@hupi.ec', TRUE,
     'Valentina', 'Paredes', 'Quito', 'La Carolina', TRUE, TRUE),

    (demo_id('provider-andres'), '593987654321', TRUE, 'andres@hupi.pet', TRUE,
     'Andrés', 'Luna', 'Quito', 'La Carolina', TRUE, TRUE),

    (demo_id('provider-sofia'), '593982223344', TRUE, 'sofia@hupi.pet', TRUE,
     'Sofía', 'M.', 'Quito', 'La Floresta', TRUE, TRUE),

    (demo_id('provider-mateo'), '593975557788', TRUE, 'mateo@hupi.pet', TRUE,
     'Mateo', 'R.', 'Quito', 'Iñaquito', TRUE, TRUE),

    (demo_id('provider-camila'), '593981112233', TRUE, 'camila@hupi.pet', TRUE,
     'Camila', 'Nala', 'Quito', 'Cumbayá', TRUE, TRUE),

    -- Proveedores que solo aparecen en el historial de reservas.
    (demo_id('provider-casa-colitas'), '593970000001', TRUE, 'casacolitas@hupi.pet', TRUE,
     'Casa', 'Colitas', 'Quito', 'Cumbayá', TRUE, TRUE),

    (demo_id('provider-patitas-hotel'), '593970000002', TRUE, 'patitas@hupi.pet', TRUE,
     'Patitas', 'Hotel', 'Quito', 'Iñaquito', TRUE, TRUE),

    (demo_id('provider-hogar-peludo'), '593970000003', TRUE, 'hogarpeludo@hupi.pet', TRUE,
     'Hogar', 'Peludo', 'Quito', 'La Floresta', TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    phone_verified = EXCLUDED.phone_verified,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    city = EXCLUDED.city,
    sector = EXCLUDED.sector,
    onboarding_completed = EXCLUDED.onboarding_completed,
    profile_completed = EXCLUDED.profile_completed,
    updated_at = now();

INSERT INTO account_preferences (account_id, language, appearance)
SELECT id, 'es', 'system' FROM accounts
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO account_consents (account_id, consent_key, consent_version)
SELECT id, 'terms_and_privacy', 'v1' FROM accounts
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. DIRECCIONES DEL CLIENTE
-- ============================================================================

INSERT INTO addresses (
    id, account_id, label_type, custom_label, icon_key, formatted_address,
    street_address, house_number, reference, city, province, country,
    latitude, longitude, is_default, source
) VALUES
    (demo_id('addr-home'), demo_id('user-001'), 'home', 'Casa', 'home',
     'Av. República, edificio Torre Norte, La Carolina, Quito',
     'Av. República, edificio Torre Norte', 'Departamento 802',
     'Frente al parque, recepción 24h', 'Quito', 'Pichincha', 'EC',
     -0.1839, -78.4848, TRUE, 'manual'),

    (demo_id('addr-work'), demo_id('user-001'), 'work', 'Trabajo', 'briefcase',
     'Av. Amazonas y Naciones Unidas, Iñaquito, Quito',
     'Av. Amazonas y Naciones Unidas', 'Piso 6',
     'Edificio corporativo junto a cafetería', 'Quito', 'Pichincha', 'EC',
     -0.1807, -78.4796, FALSE, 'manual')
ON CONFLICT (id) DO UPDATE SET
    formatted_address = EXCLUDED.formatted_address,
    street_address = EXCLUDED.street_address,
    house_number = EXCLUDED.house_number,
    reference = EXCLUDED.reference,
    is_default = EXCLUDED.is_default,
    updated_at = now();

INSERT INTO address_delivery_preferences (address_id, location_type, meeting_point_type, handoff_type, arrival_contact_preference)
VALUES
    (demo_id('addr-home'), 'apartment_building', 'building_lobby', 'hand_to_customer', 'chat'),
    (demo_id('addr-work'), 'office_or_store', 'office_reception', 'hand_to_customer', 'chat')
ON CONFLICT (address_id) DO NOTHING;

-- ============================================================================
-- 3. MASCOTA
-- ============================================================================

INSERT INTO pets (
    id, account_id, code, name, species, breed, birthday, weight_kg, sex, size,
    physical_activity, behavior, behavior_description, bites, allergies, medications,
    care_instructions, veterinarian_name, clinic_name, vaccines_up_to_date, sterilized
) VALUES (
    demo_id('pet-001'), demo_id('user-001'), '2049001001', 'Milo', 'Perro',
    'Golden retriever', DATE '2023-07-09', 28, 'Macho', 'Grande',
    'Alta', 'Social',
    'Se emociona al conocer otros perros y responde bien con premios.',
    FALSE, 'Polvo y algunos shampoos perfumados', 'Ninguno',
    'Usar arnés morado, evitar correr al inicio del paseo y ofrecer agua al final.',
    'Dra. Paula Ríos', 'Vet Norte', TRUE, TRUE
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    breed = EXCLUDED.breed,
    weight_kg = EXCLUDED.weight_kg,
    care_instructions = EXCLUDED.care_instructions,
    updated_at = now();

-- ============================================================================
-- 4. MÉTODOS DE PAGO Y FACTURACIÓN
-- ============================================================================
-- Solo se guarda el token de la pasarela, marca y últimos 4 dígitos.

INSERT INTO payment_methods (
    id, account_id, gateway_token, brand, last4, holder_name,
    expiry_month, expiry_year, is_default
) VALUES
    (demo_id('pay-visa-4242'), demo_id('user-001'), 'tok_demo_visa_4242',
     'Visa', '4242', 'Valentina Paredes', 9, 2029, TRUE),
    (demo_id('pay-master-7788'), demo_id('user-001'), 'tok_demo_master_7788',
     'Mastercard', '7788', 'Valentina Paredes', 4, 2028, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO billing_profiles (
    id, account_id, taxpayer_type, identification_type, identification_number,
    name_or_business_name, billing_email, contact_phone, fiscal_address, is_default
) VALUES (
    demo_id('billing-001'), demo_id('user-001'), 'Persona Natural', 'Cédula',
    '1712345678', 'Valentina Paredes', 'valentina@hupi.ec', '593991234567',
    'Av. República, edificio Torre Norte, Quito', TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. PROVEEDORES
-- ============================================================================

INSERT INTO providers (
    id, account_id, display_name, initials, level, avatar_color,
    is_verified_by_hupi, rating, review_count, completed_services,
    experience_years, zone, latitude, longitude,
    average_response_time_minutes, is_online, is_searchable
) VALUES
    (demo_id('provider-andres'), demo_id('provider-andres'), 'Andrés & Luna', 'AL',
     'Junior', '#614193', TRUE, 4.9, 128, 342, 5, 'La Carolina, Quito',
     -0.1825, -78.483, 5, TRUE, TRUE),

    (demo_id('provider-sofia'), demo_id('provider-sofia'), 'Sofía M.', 'SM',
     'Junior', '#e45336', TRUE, 4.8, 94, 218, 4, 'La Floresta, Quito',
     -0.2055, -78.482, 20, FALSE, TRUE),

    (demo_id('provider-mateo'), demo_id('provider-mateo'), 'Mateo R.', 'MR',
     'Junior', '#32966f', TRUE, 4.7, 61, 126, 3, 'Iñaquito, Quito',
     -0.1785, -78.4805, 12, TRUE, TRUE),

    (demo_id('provider-camila'), demo_id('provider-camila'), 'Camila & Nala', 'CN',
     'Junior', '#d69b28', FALSE, 4.6, 28, 54, 2, 'Cumbayá, Quito',
     -0.2002, -78.4297, 75, FALSE, TRUE),

    (demo_id('provider-casa-colitas'), demo_id('provider-casa-colitas'), 'Casa Colitas', 'CC',
     'Senior', '#32966f', TRUE, 4.8, 210, 640, 6, 'Cumbayá, Quito',
     -0.2010, -78.4300, 30, FALSE, FALSE),

    (demo_id('provider-patitas-hotel'), demo_id('provider-patitas-hotel'), 'Patitas Hotel', 'PH',
     'Senior', '#614193', TRUE, 4.7, 180, 520, 7, 'Iñaquito, Quito',
     -0.1790, -78.4810, 45, FALSE, FALSE),

    (demo_id('provider-hogar-peludo'), demo_id('provider-hogar-peludo'), 'Hogar Peludo', 'HP',
     'Junior', '#d69b28', TRUE, 4.5, 75, 160, 3, 'La Floresta, Quito',
     -0.2060, -78.4825, 60, FALSE, FALSE)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    initials = EXCLUDED.initials,
    level = EXCLUDED.level,
    avatar_color = EXCLUDED.avatar_color,
    is_verified_by_hupi = EXCLUDED.is_verified_by_hupi,
    rating = EXCLUDED.rating,
    review_count = EXCLUDED.review_count,
    completed_services = EXCLUDED.completed_services,
    zone = EXCLUDED.zone,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    average_response_time_minutes = EXCLUDED.average_response_time_minutes,
    is_online = EXCLUDED.is_online,
    is_searchable = EXCLUDED.is_searchable,
    updated_at = now();

-- Tarifas por servicio. `is_offered` refleja `serviceTypes` del mock.
INSERT INTO provider_service_prices (provider_id, service, price, is_offered) VALUES
    (demo_id('provider-andres'), 'walk',     12.50, TRUE),
    (demo_id('provider-andres'), 'sitter',   18.00, TRUE),
    (demo_id('provider-andres'), 'daycare',  27.00, TRUE),
    (demo_id('provider-andres'), 'boarding', 42.00, TRUE),

    (demo_id('provider-sofia'), 'walk',      11.00, TRUE),
    (demo_id('provider-sofia'), 'sitter',    20.00, TRUE),
    (demo_id('provider-sofia'), 'daycare',   25.00, TRUE),
    (demo_id('provider-sofia'), 'boarding',  46.00, FALSE),

    (demo_id('provider-mateo'), 'walk',       9.50, TRUE),
    (demo_id('provider-mateo'), 'sitter',    16.00, FALSE),
    (demo_id('provider-mateo'), 'daycare',   22.00, TRUE),
    (demo_id('provider-mateo'), 'boarding',  38.00, FALSE),

    (demo_id('provider-camila'), 'walk',      8.00, TRUE),
    (demo_id('provider-camila'), 'sitter',   17.00, TRUE),
    (demo_id('provider-camila'), 'daycare',  21.00, FALSE),
    (demo_id('provider-camila'), 'boarding', 36.00, TRUE)
ON CONFLICT (provider_id, service) DO UPDATE SET
    price = EXCLUDED.price,
    is_offered = EXCLUDED.is_offered,
    updated_at = now();

-- ============================================================================
-- 6. SERVICIO PASEOS
-- ============================================================================

INSERT INTO provider_walk_profiles (
    provider_id, description, accepted_dog_sizes, accepted_dog_ages,
    maximum_dogs_per_walk, modalities, walk_types, requirements,
    hourly_rate, status
) VALUES
    (demo_id('provider-andres'),
     'Paseos tranquilos por La Carolina con reporte de fotos al finalizar.',
     ARRAY['small','medium','large'], ARRAY['puppy','adult'], 3,
     ARRAY['individual','group'], ARRAY['calm','urban','park'],
     ARRAY['vaccines_current','secure_harness_or_collar'], 12.50, 'approved'),

    (demo_id('provider-sofia'),
     'Especialista en perros nerviosos, paseos individuales en La Floresta.',
     ARRAY['small','medium'], ARRAY['adult'], 2,
     ARRAY['individual'], ARRAY['calm','urban'],
     ARRAY['vaccines_current'], 11.00, 'approved'),

    (demo_id('provider-mateo'),
     'Paseos activos y largos para perros con mucha energía.',
     ARRAY['medium','large','giant'], ARRAY['adult'], 4,
     ARRAY['group'], ARRAY['active','park'],
     ARRAY['vaccines_current','identification_tag'], 9.50, 'approved'),

    (demo_id('provider-camila'),
     'Paseos en Cumbayá con enfoque en cachorros y socialización.',
     ARRAY['small','medium'], ARRAY['puppy','adult'], 2,
     ARRAY['individual','group'], ARRAY['calm','park'],
     ARRAY['vaccines_current'], 8.00, 'pending_approval')
ON CONFLICT (provider_id) DO UPDATE SET
    description = EXCLUDED.description,
    hourly_rate = EXCLUDED.hourly_rate,
    status = EXCLUDED.status,
    updated_at = now();

-- Planes: 'basic' es una hora suelta; 'frequent' son 3 paseos con 10 % de descuento.
INSERT INTO provider_walk_plans (
    id, provider_id, version_root_id, version, name, description, plan_type,
    duration_minutes, walk_count, pets_included, modality, price,
    includes, is_available, status
) VALUES
    (demo_id('plan-andres-basic'), demo_id('provider-andres'),
     demo_id('plan-andres-basic'), 1, 'Paseo individual',
     'Un paseo de 60 minutos con reporte fotográfico.', 'individual',
     60, 1, 1, 'individual', 12.50,
     ARRAY['Reporte con fotos','Agua fresca'], TRUE, 'approved'),

    (demo_id('plan-andres-frequent'), demo_id('provider-andres'),
     demo_id('plan-andres-frequent'), 1, 'Plan frecuente',
     'Tres paseos de 60 minutos con 10 % de descuento.', 'recurring',
     60, 3, 1, 'individual', 33.75,
     ARRAY['Reporte con fotos','Agua fresca','Horario preferente'], TRUE, 'approved'),

    (demo_id('plan-sofia-basic'), demo_id('provider-sofia'),
     demo_id('plan-sofia-basic'), 1, 'Paseo individual',
     'Paseo tranquilo de 60 minutos.', 'individual',
     60, 1, 1, 'individual', 11.00,
     ARRAY['Reporte con fotos'], TRUE, 'approved'),

    (demo_id('plan-mateo-basic'), demo_id('provider-mateo'),
     demo_id('plan-mateo-basic'), 1, 'Paseo activo',
     'Paseo de 60 minutos con ritmo alto.', 'individual',
     60, 1, 1, 'group', 9.50,
     ARRAY['Reporte con fotos'], TRUE, 'approved')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    status = EXCLUDED.status,
    updated_at = now();

-- ============================================================================
-- 7. RESERVAS
-- ============================================================================
-- QA-WALK-001 es la reserva compartida: cliente y proveedor leen esta misma
-- fila. Sus importes son los del mock, no recalculados.
--
-- Las fechas se anclan al día de ejecución conservando la hora del mock. Las
-- del mock original ya vencieron, y una reserva "próxima" en el pasado deja la
-- demo incoherente (no se puede iniciar el paseo ni cancelar sin penalización).

CREATE OR REPLACE FUNCTION demo_at(day_offset INT, at_time TIME)
RETURNS TIMESTAMPTZ
LANGUAGE sql STABLE
AS $$
    SELECT (((current_date + day_offset)::timestamp + at_time)
            AT TIME ZONE 'America/Guayaquil')
$$;

INSERT INTO bookings (
    id, reference_code, client_account_id, provider_id, pet_id, service,
    status, section, offer_title, scheduled_start_at, duration_minutes,
    total_paid, service_value, client_fee, provider_payout,
    hupi_provider_commission, hupi_total_revenue,
    chat_available, can_cancel, timeline_step, address_snapshot
) VALUES
    (demo_id('QA-WALK-001'), 'QA-WALK-001', demo_id('user-001'),
     demo_id('provider-andres'), demo_id('pet-001'), 'walk',
     'scheduled', 'upcoming', 'Paseo individual',
     demo_at(4, TIME '17:30'), 60,
     14.38, 12.50, 1.88, 8.75, 3.75, 5.63,
     TRUE, TRUE, 2,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito","sector":"La Carolina"}'::jsonb),

    (demo_id('booking-walk-001'), 'booking-walk-001', demo_id('user-001'),
     demo_id('provider-andres'), demo_id('pet-001'), 'walk',
     'confirmed', 'upcoming', 'Paseo individual',
     demo_at(1, TIME '17:30'), 60,
     14.38, 12.50, 1.88, 8.75, 3.75, 5.63,
     TRUE, TRUE, 2,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito","sector":"La Carolina"}'::jsonb),

    (demo_id('booking-daycare-002'), 'booking-daycare-002', demo_id('user-001'),
     demo_id('provider-casa-colitas'), demo_id('pet-001'), 'daycare',
     'upcoming', 'upcoming', 'Guardería jornada completa',
     demo_at(7, TIME '08:00'), 480,
     31.05, 27.00, 4.05, 18.90, 8.10, 12.15,
     TRUE, TRUE, 2,
     '{"formattedAddress":"Cumbayá, Quito","city":"Quito","sector":"Cumbayá"}'::jsonb),

    (demo_id('booking-sitter-003'), 'booking-sitter-003', demo_id('user-001'),
     demo_id('provider-sofia'), demo_id('pet-001'), 'sitter',
     'in_progress', 'current', 'Niñera por horas',
     now() - interval '1 hour', 240,
     25.30, 22.00, 3.30, 15.40, 6.60, 9.90,
     TRUE, FALSE, 3,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito","sector":"La Carolina"}'::jsonb),

    (demo_id('booking-walk-004'), 'booking-walk-004', demo_id('user-001'),
     demo_id('provider-andres'), demo_id('pet-001'), 'walk',
     'completed', 'history', 'Paseo individual',
     demo_at(-5, TIME '09:30'), 60,
     14.38, 12.50, 1.88, 8.75, 3.75, 5.63,
     FALSE, FALSE, 5,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito","sector":"La Carolina"}'::jsonb),

    (demo_id('booking-boarding-005'), 'booking-boarding-005', demo_id('user-001'),
     demo_id('provider-patitas-hotel'), demo_id('pet-001'), 'boarding',
     'completed', 'history', 'Hospedaje 2 noches',
     demo_at(-20, TIME '10:00'), 2880,
     82.80, 72.00, 10.80, 50.40, 21.60, 32.40,
     FALSE, FALSE, 5,
     '{"formattedAddress":"Iñaquito, Quito","city":"Quito","sector":"Iñaquito"}'::jsonb),

    (demo_id('booking-daycare-006'), 'booking-daycare-006', demo_id('user-001'),
     demo_id('provider-hogar-peludo'), demo_id('pet-001'), 'daycare',
     'cancelled', 'cancelled', 'Guardería media jornada',
     demo_at(-30, TIME '08:30'), 360,
     0, 21.00, 3.15, 0, 0, 0,
     FALSE, FALSE, 1,
     '{"formattedAddress":"La Floresta, Quito","city":"Quito","sector":"La Floresta"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    section = EXCLUDED.section,
    scheduled_start_at = EXCLUDED.scheduled_start_at,
    total_paid = EXCLUDED.total_paid,
    chat_available = EXCLUDED.chat_available,
    can_cancel = EXCLUDED.can_cancel,
    timeline_step = EXCLUDED.timeline_step,
    updated_at = now();

-- Cierres de los paseos completados y del cancelado.
UPDATE bookings SET
    started_at = scheduled_start_at,
    completed_at = scheduled_start_at + (duration_minutes || ' minutes')::interval,
    actual_duration_minutes = duration_minutes
WHERE reference_code IN ('booking-walk-004', 'booking-boarding-005');

UPDATE bookings SET started_at = scheduled_start_at
WHERE reference_code = 'booking-sitter-003';

UPDATE bookings SET
    cancelled_by = 'client',
    cancelled_at = scheduled_start_at - interval '2 days',
    cancellation_tier = 'free',
    client_refund_amount = 24.15
WHERE reference_code = 'booking-daycare-006';

INSERT INTO walk_events (id, booking_id, event_type, actor_role, actor_account_id, occurred_at)
SELECT demo_id('walkevent-started-' || b.reference_code), b.id, 'walk_started',
       'provider', p.account_id, b.started_at
FROM bookings b
JOIN providers p ON p.id = b.provider_id
WHERE b.reference_code = 'booking-walk-004'
ON CONFLICT (id) DO NOTHING;

INSERT INTO walk_events (id, booking_id, event_type, actor_role, actor_account_id, occurred_at)
SELECT demo_id('walkevent-completed-' || b.reference_code), b.id, 'walk_completed',
       'provider', p.account_id, b.completed_at
FROM bookings b
JOIN providers p ON p.id = b.provider_id
WHERE b.reference_code = 'booking-walk-004'
ON CONFLICT (id) DO NOTHING;

INSERT INTO booking_reviews (booking_id, rating, tags, comment)
VALUES (demo_id('booking-walk-004'), 5,
        ARRAY['Puntual','Cariñoso','Buen reporte'],
        'Milo volvió feliz y cansado. Excelente reporte con fotos.')
ON CONFLICT (booking_id) DO NOTHING;

-- ============================================================================
-- 8. MARKETPLACE: TIENDAS Y PRODUCTOS
-- ============================================================================

INSERT INTO stores (
    id, provider_id, name, description, categories, status,
    is_official_store, is_verified_by_hupi, province, city,
    rating, completed_orders
) VALUES
    (demo_id('store-hupi-bites'), demo_id('provider-andres'), 'Hupi Bites',
     'Snacks naturales seleccionados por Hupi para entrenar y premiar.',
     ARRAY['Snacks','Productos naturales'], 'enabled', TRUE, TRUE,
     'Pichincha', 'Quito', 4.9, 980),

    (demo_id('store-urban-pet'), demo_id('provider-sofia'), 'Urban Pet',
     'Accesorios urbanos resistentes para el día a día.',
     ARRAY['Accesorios'], 'enabled', FALSE, TRUE,
     'Pichincha', 'Quito', 4.7, 420),

    (demo_id('store-casa-colitas'), demo_id('provider-casa-colitas'), 'Casa Colitas',
     'Camas y descanso para mascotas.',
     ARRAY['Accesorios'], 'enabled', FALSE, TRUE,
     'Pichincha', 'Quito', 4.8, 310),

    (demo_id('store-kong'), demo_id('provider-mateo'), 'Play Hupi',
     'Juguetes resistentes para perros activos.',
     ARRAY['Juguetes'], 'enabled', FALSE, TRUE,
     'Pichincha', 'Quito', 4.6, 260),

    (demo_id('store-royal-canin'), demo_id('provider-camila'), 'NutriPet',
     'Alimento y suplementos premium.',
     ARRAY['Alimentos','Salud y bienestar'], 'enabled', TRUE, TRUE,
     'Pichincha', 'Quito', 4.8, 750),

    (demo_id('store-clean-paw'), demo_id('provider-hogar-peludo'), 'Clean Paw',
     'Higiene y limpieza para mascotas.',
     ARRAY['Higiene y limpieza'], 'enabled', FALSE, TRUE,
     'Pichincha', 'Quito', 4.5, 190)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    rating = EXCLUDED.rating,
    completed_orders = EXCLUDED.completed_orders,
    updated_at = now();

INSERT INTO store_shipping_settings (store_id, method, enabled, price, estimate)
SELECT s.id, m.method, TRUE, m.price, m.estimate
FROM stores s
CROSS JOIN (VALUES
    ('standard'::shipping_method, 2.50, '3 a 5 días hábiles'),
    ('express'::shipping_method,  4.50, '24 a 48 horas'),
    ('pickup'::shipping_method,   0.00, 'Retiro en tienda')
) AS m(method, price, estimate)
ON CONFLICT (store_id, method) DO NOTHING;

INSERT INTO products (
    id, store_id, name, description, brand, sku, product_type, category_id,
    tax_rate, card_price_after, transfer_price_after, stock, stock_alert_min,
    stock_status, status, approval_status, is_active, tags
) VALUES
    (demo_id('product-1'), demo_id('store-hupi-bites'), 'Snack natural de pollo',
     'Snack deshidratado de pollo, ideal para entrenamiento.', 'Hupi Bites',
     'HB-SNK-001', 'simple', 'Snacks', 0, 8.90, 7.99, 120, 10,
     'available', 'active', 'approved', TRUE, ARRAY['Recomendado']),

    (demo_id('product-2'), demo_id('store-urban-pet'), 'Arnés urbano ajustable',
     'Arnés acolchado con ajuste en cuatro puntos.', 'Urban Pet',
     'UP-ARN-002', 'simple', 'Accesorios', 0, 24.50, 22.99, 45, 5,
     'available', 'active', 'approved', TRUE, ARRAY['Nuevo']),

    (demo_id('product-3'), demo_id('store-casa-colitas'), 'Cama nube mediana',
     'Cama acolchada lavable para perros medianos.', 'Casa Colitas',
     'CC-CAM-003', 'simple', 'Accesorios', 0, 39.00, 36.50, 18, 3,
     'available', 'active', 'approved', TRUE, ARRAY[]::TEXT[]),

    (demo_id('product-4'), demo_id('store-kong'), 'Pelota resistente coral',
     'Pelota de caucho natural para juego intenso.', 'Play Hupi',
     'PH-PEL-004', 'simple', 'Juguetes', 0, 6.75, 5.99, 200, 20,
     'available', 'active', 'approved', TRUE, ARRAY['Oferta']),

    (demo_id('product-5'), demo_id('store-royal-canin'), 'Alimento premium adulto',
     'Alimento balanceado para perros adultos.', 'NutriPet',
     'NP-ALI-005', 'simple', 'Alimentos', 0, 18.99, 17.50, 60, 8,
     'available', 'active', 'approved', TRUE, ARRAY['Recomendado']),

    (demo_id('product-6'), demo_id('store-clean-paw'), 'Shampoo hipoalergénico',
     'Shampoo sin fragancia para pieles sensibles.', 'Clean Paw',
     'CP-SHA-006', 'simple', 'Higiene y limpieza', 0, 12.99, 11.99, 80, 10,
     'available', 'active', 'approved', TRUE, ARRAY[]::TEXT[]),

    (demo_id('product-7'), demo_id('store-royal-canin'), 'Suplemento piel y pelaje',
     'Suplemento con omega 3 y 6.', 'WellPet',
     'WP-SUP-007', 'simple', 'Salud y bienestar', 0, 15.90, 14.50, 35, 5,
     'available', 'active', 'approved', TRUE, ARRAY[]::TEXT[]),

    -- Referenciado por los pedidos demo aunque no está en el catálogo del mock.
    (demo_id('product-8'), demo_id('store-hupi-bites'), 'Mix entrenamiento premium',
     'Mezcla de snacks pequeños para sesiones de entrenamiento.', 'Hupi Bites',
     'HB-MIX-008', 'simple', 'Snacks', 0, 12.90, 12.90, 90, 10,
     'available', 'active', 'approved', TRUE, ARRAY['Nuevo'])
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    brand = EXCLUDED.brand,
    card_price_after = EXCLUDED.card_price_after,
    transfer_price_after = EXCLUDED.transfer_price_after,
    stock = EXCLUDED.stock,
    status = EXCLUDED.status,
    updated_at = now();

-- ============================================================================
-- 9. PEDIDOS DEL MARKETPLACE
-- ============================================================================

INSERT INTO orders (
    id, order_number, client_account_id, status, payment_method, payment_status,
    shipping_method, subtotal, shipping_cost, discount, donation,
    hupi_balance_applied, total, receipt_available, can_rate,
    delivery_address_snapshot, created_at
) VALUES
    (demo_id('order-001'), 'HUPI-MK-2048', demo_id('user-001'), 'delivered',
     'card', 'confirmed', 'standard', 42.30, 4.50, 3.23, 0, 0, 43.57, TRUE, TRUE,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito"}'::jsonb,
     TIMESTAMPTZ '2026-07-08 16:20:00-05'),

    (demo_id('order-002'), 'HUPI-MK-2049', demo_id('user-001'), 'payment_pending',
     'bank_transfer', 'proof_pending', 'standard', 12.90, 2.50, 0, 2.00, 0, 17.40, FALSE, FALSE,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito"}'::jsonb,
     TIMESTAMPTZ '2026-07-09 09:10:00-05'),

    (demo_id('order-003'), 'HUPI-MK-2050', demo_id('user-001'), 'payment_review',
     'deuna', 'proof_submitted', 'pickup', 22.99, 0, 0, 0, 0, 22.99, FALSE, FALSE,
     '{"formattedAddress":"Retiro en tienda","city":"Quito"}'::jsonb,
     TIMESTAMPTZ '2026-07-09 11:35:00-05'),

    (demo_id('order-004'), 'HUPI-MK-2051', demo_id('user-001'), 'preparing',
     'card', 'confirmed', 'standard', 26.70, 2.50, 0, 1.00, 0, 30.20, TRUE, FALSE,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito"}'::jsonb,
     TIMESTAMPTZ '2026-07-07 15:42:00-05'),

    (demo_id('order-005'), 'HUPI-MK-2052', demo_id('user-001'), 'payment_pending',
     'bank_transfer', 'proof_rejected', 'standard', 12.99, 2.50, 0, 0, 0, 15.49, FALSE, FALSE,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito"}'::jsonb,
     TIMESTAMPTZ '2026-07-06 18:04:00-05'),

    (demo_id('order-006'), 'HUPI-MK-2053', demo_id('user-001'), 'ready_to_ship',
     'bank_transfer', 'confirmed', 'standard', 22.99, 2.50, 0, 1.00, 0, 26.49, TRUE, FALSE,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito"}'::jsonb,
     TIMESTAMPTZ '2026-07-05 10:18:00-05'),

    (demo_id('order-007'), 'HUPI-MK-2054', demo_id('user-001'), 'cancelled',
     'card', 'confirmed', 'standard', 12.99, 2.50, 0, 0, 0, 15.49, FALSE, FALSE,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito"}'::jsonb,
     TIMESTAMPTZ '2026-07-04 13:25:00-05'),

    (demo_id('order-008'), 'HUPI-MK-2055', demo_id('user-001'), 'confirmed',
     'bank_transfer', 'confirmed', 'standard', 12.90, 2.50, 0, 0, 8.50, 6.90, TRUE, FALSE,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito"}'::jsonb,
     TIMESTAMPTZ '2026-07-08 10:00:00-05'),

    (demo_id('order-009'), 'HUPI-MK-2056', demo_id('user-001'), 'delivered',
     'bank_transfer', 'confirmed', 'standard', 17.80, 3.00, 0, 1.00, 0, 21.80, TRUE, TRUE,
     '{"formattedAddress":"Av. República, edificio Torre Norte, La Carolina, Quito","city":"Quito"}'::jsonb,
     TIMESTAMPTZ '2026-07-03 09:10:00-05'),

    (demo_id('order-010'), 'HUPI-MK-2060', demo_id('user-001'), 'confirmed',
     'hupi_balance', 'confirmed', 'pickup', 8.90, 0, 0, 0, 8.90, 0, TRUE, FALSE,
     '{"formattedAddress":"Retiro en tienda","city":"Quito"}'::jsonb,
     TIMESTAMPTZ '2026-07-10 09:20:00-05')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    total = EXCLUDED.total,
    hupi_balance_applied = EXCLUDED.hupi_balance_applied,
    updated_at = now();

UPDATE orders SET delivered_at = created_at + interval '3 days'
WHERE status = 'delivered';

-- Subpedido por tienda. Comisión Hupi del 30 %.
INSERT INTO provider_orders (
    id, provider_order_number, order_id, store_id, status, delivery_type,
    subtotal, hupi_commission, provider_net, placed_at
)
SELECT
    demo_id('provider-' || o.order_number),
    'PO-' || o.order_number,
    o.id,
    demo_id('store-hupi-bites'),
    o.status,
    o.shipping_method,
    o.subtotal,
    round(o.subtotal * 0.30, 2),
    round(o.subtotal * 0.70, 2),
    o.created_at
FROM orders o
WHERE o.client_account_id = demo_id('user-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (
    id, provider_order_id, product_id, product_name, sku, quantity, unit_price, line_total
) VALUES
    (demo_id('item-2048-1'), demo_id('provider-HUPI-MK-2048'), demo_id('product-1'), 'Snack natural de pollo', 'HB-SNK-001', 2, 8.90, 17.80),
    (demo_id('item-2048-2'), demo_id('provider-HUPI-MK-2048'), demo_id('product-2'), 'Arnés urbano ajustable', 'UP-ARN-002', 1, 24.50, 24.50),
    (demo_id('item-2049-1'), demo_id('provider-HUPI-MK-2049'), demo_id('product-8'), 'Mix entrenamiento premium', 'HB-MIX-008', 1, 12.90, 12.90),
    (demo_id('item-2050-1'), demo_id('provider-HUPI-MK-2050'), demo_id('product-2'), 'Arnés urbano ajustable', 'UP-ARN-002', 1, 22.99, 22.99),
    (demo_id('item-2051-1'), demo_id('provider-HUPI-MK-2051'), demo_id('product-1'), 'Snack natural de pollo', 'HB-SNK-001', 3, 8.90, 26.70),
    (demo_id('item-2052-1'), demo_id('provider-HUPI-MK-2052'), demo_id('product-6'), 'Shampoo hipoalergénico', 'CP-SHA-006', 1, 12.99, 12.99),
    (demo_id('item-2053-1'), demo_id('provider-HUPI-MK-2053'), demo_id('product-2'), 'Arnés urbano ajustable', 'UP-ARN-002', 1, 22.99, 22.99),
    (demo_id('item-2054-1'), demo_id('provider-HUPI-MK-2054'), demo_id('product-6'), 'Shampoo hipoalergénico', 'CP-SHA-006', 1, 12.99, 12.99),
    (demo_id('item-2055-1'), demo_id('provider-HUPI-MK-2055'), demo_id('product-8'), 'Mix entrenamiento premium', 'HB-MIX-008', 1, 12.90, 12.90),
    (demo_id('item-2056-1'), demo_id('provider-HUPI-MK-2056'), demo_id('product-1'), 'Snack natural de pollo', 'HB-SNK-001', 2, 8.90, 17.80),
    (demo_id('item-2060-1'), demo_id('provider-HUPI-MK-2060'), demo_id('product-1'), 'Snack natural de pollo', 'HB-SNK-001', 1, 8.90, 8.90)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. SALDO HUPI
-- ============================================================================

INSERT INTO wallet_movements (id, account_id, concept, amount, movement_type, status, created_at)
VALUES
    (demo_id('wallet-001'), demo_id('user-001'), 'Reembolso pedido HUPI-MK-2054',
     15.49, 'refund_credited', 'available', TIMESTAMPTZ '2026-07-04 18:00:00-05'),
    (demo_id('wallet-002'), demo_id('user-001'), 'Uso en pedido HUPI-MK-2055',
     -8.50, 'purchase_use', 'used', TIMESTAMPTZ '2026-07-08 10:00:00-05'),
    (demo_id('wallet-003'), demo_id('user-001'), 'Uso en pedido HUPI-MK-2060',
     -8.90, 'purchase_use', 'used', TIMESTAMPTZ '2026-07-10 09:20:00-05'),
    (demo_id('wallet-004'), demo_id('user-001'), 'Ajuste Hupi por demora',
     10.00, 'hupi_adjustment', 'available', TIMESTAMPTZ '2026-07-11 12:00:00-05')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. CHAT
-- ============================================================================

INSERT INTO conversations (
    id, conversation_type, client_account_id, provider_id, title, is_open, last_message_at
) VALUES
    (demo_id('chat-service-walk-001'), 'services', demo_id('user-001'),
     demo_id('provider-andres'), 'Andrés & Luna', TRUE,
     TIMESTAMPTZ '2026-08-24 18:05:00-05'),

    (demo_id('chat-support-client-2049'), 'support', demo_id('user-001'),
     NULL, 'Soporte Hupi', TRUE, TIMESTAMPTZ '2026-07-09 10:00:00-05'),

    (demo_id('chat-marketplace-2048-hupi-bites'), 'marketplace', demo_id('user-001'),
     demo_id('provider-andres'), 'Soporte Hupi', TRUE,
     TIMESTAMPTZ '2026-07-08 17:00:00-05')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    last_message_at = EXCLUDED.last_message_at;

INSERT INTO messages (id, conversation_id, sender_account_id, sender_role, body, status, created_at)
VALUES
    (demo_id('msg-walk-1'), demo_id('chat-service-walk-001'), demo_id('user-001'), 'client',
     '¿Podrías llevar agua para Milo? Hace calor.', 'read',
     TIMESTAMPTZ '2026-08-24 18:00:00-05'),
    (demo_id('msg-walk-2'), demo_id('chat-service-walk-001'), demo_id('provider-andres'), 'provider',
     'Llevaré agua y correa extra para Milo.', 'read',
     TIMESTAMPTZ '2026-08-24 18:05:00-05'),
    (demo_id('msg-support-1'), demo_id('chat-support-client-2049'), demo_id('user-001'), 'client',
     'No pude subir el comprobante del pedido.', 'read',
     TIMESTAMPTZ '2026-07-09 09:50:00-05'),
    (demo_id('msg-support-2'), demo_id('chat-support-client-2049'), NULL, 'support',
     'Estamos revisando la información.', 'sent',
     TIMESTAMPTZ '2026-07-09 10:00:00-05'),
    (demo_id('msg-market-1'), demo_id('chat-marketplace-2048-hupi-bites'), NULL, 'support',
     'Respondemos en máximo 24 horas.', 'sent',
     TIMESTAMPTZ '2026-07-08 17:00:00-05')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 12. NOTIFICACIONES
-- ============================================================================

INSERT INTO notifications (
    id, account_id, category, notification_type, title, body, priority,
    action_target, dedupe_key, created_at
) VALUES
    (demo_id('notif-001'), demo_id('user-001'), 'Reservas', 'booking_upcoming',
     'Tu paseo es mañana', 'Andrés & Luna paseará a Milo a las 17:30.', 'normal',
     '/client/booking-detail?bookingId=QA-WALK-001', 'booking-upcoming-QA-WALK-001',
     TIMESTAMPTZ '2026-08-24 09:00:00-05'),

    (demo_id('notif-002'), demo_id('user-001'), 'Pedidos', 'order_delivered',
     'Pedido entregado', 'Tu pedido HUPI-MK-2048 fue entregado.', 'normal',
     '/marketplace/order-detail?orderId=order-001', 'order-delivered-HUPI-MK-2048',
     TIMESTAMPTZ '2026-07-11 16:20:00-05'),

    (demo_id('notif-003'), demo_id('user-001'), 'Marketplace', 'payment_rejected',
     'Comprobante rechazado', 'Revisa el comprobante del pedido HUPI-MK-2052.', 'important',
     '/marketplace/order-detail?orderId=order-005', 'payment-rejected-HUPI-MK-2052',
     TIMESTAMPTZ '2026-07-06 19:00:00-05')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. SOPORTE
-- ============================================================================

INSERT INTO support_tickets (
    id, case_number, account_id, category, description, status, related_order_id, created_at
) VALUES (
    demo_id('ticket-2049'), 'HUPI-CS-2049', demo_id('user-001'),
    'Problema con el pago',
    'No pude subir el comprobante de transferencia del pedido HUPI-MK-2049.',
    'under_review', demo_id('order-002'), TIMESTAMPTZ '2026-07-09 09:45:00-05'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO support_ticket_messages (id, ticket_id, author_role, author_account_id, body, created_at)
VALUES
    (demo_id('ticketmsg-2049-1'), demo_id('ticket-2049'), 'client', demo_id('user-001'),
     'No pude subir el comprobante del pedido.', TIMESTAMPTZ '2026-07-09 09:50:00-05'),
    (demo_id('ticketmsg-2049-2'), demo_id('ticket-2049'), 'support', NULL,
     'Estamos revisando la información.', TIMESTAMPTZ '2026-07-09 10:00:00-05')
ON CONFLICT (id) DO NOTHING;

-- Códigos legibles: son los identificadores con los que navega la app.
UPDATE providers p SET code = c.code
FROM (VALUES
    ('provider-andres'), ('provider-sofia'), ('provider-mateo'), ('provider-camila'),
    ('provider-casa-colitas'), ('provider-patitas-hotel'), ('provider-hogar-peludo')
) AS c(code)
WHERE p.id = demo_id(c.code);

UPDATE products pr SET code = c.code
FROM (VALUES
    ('product-1'), ('product-2'), ('product-3'), ('product-4'),
    ('product-5'), ('product-6'), ('product-7'), ('product-8')
) AS c(code)
WHERE pr.id = demo_id(c.code);

UPDATE conversations cv SET code = c.code
FROM (VALUES
    ('chat-service-walk-001'),
    ('chat-support-client-2049'),
    ('chat-marketplace-2048-hupi-bites')
) AS c(code)
WHERE cv.id = demo_id(c.code);

COMMIT;

-- Resumen de lo cargado.
SELECT 'accounts'  AS tabla, count(*) FROM accounts
UNION ALL SELECT 'providers', count(*) FROM providers
UNION ALL SELECT 'pets', count(*) FROM pets
UNION ALL SELECT 'addresses', count(*) FROM addresses
UNION ALL SELECT 'walk_plans', count(*) FROM provider_walk_plans
UNION ALL SELECT 'bookings', count(*) FROM bookings
UNION ALL SELECT 'stores', count(*) FROM stores
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'order_items', count(*) FROM order_items
UNION ALL SELECT 'messages', count(*) FROM messages
UNION ALL SELECT 'notifications', count(*) FROM notifications
ORDER BY tabla;
