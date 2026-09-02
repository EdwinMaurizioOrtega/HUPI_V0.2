-- Reservas y operación del paseo.
-- REGLA CENTRAL: una entidad por booking. Cliente y proveedor son vistas
-- sobre la MISMA fila. started_at, completed_at, payout y refund nunca se
-- duplican en stores separados por actor.

CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_account_id   UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    provider_id         UUID        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    pet_id              UUID        REFERENCES pets (id) ON DELETE SET NULL,
    service             service_id  NOT NULL DEFAULT 'walk',
    status              booking_status NOT NULL DEFAULT 'scheduled',
    section             booking_section NOT NULL DEFAULT 'upcoming',

    request_id          UUID        REFERENCES coordination_requests (id) ON DELETE SET NULL,
    offer_id            UUID        REFERENCES service_offers (id) ON DELETE SET NULL,
    plan_id             UUID        REFERENCES provider_walk_plans (id),

    -- Snapshots: preservan el historial aunque la entidad origen cambie.
    offer_title         TEXT,
    address_snapshot    JSONB,
    meeting_preferences JSONB,
    plan_snapshot       JSONB,

    scheduled_start_at  TIMESTAMPTZ NOT NULL,
    duration_minutes    INTEGER     NOT NULL DEFAULT 60,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    actual_duration_minutes INTEGER,

    total_paid          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    service_value       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    client_fee          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    provider_payout     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    hupi_provider_commission NUMERIC(12, 2) NOT NULL DEFAULT 0,
    hupi_total_revenue  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    client_refund_amount NUMERIC(12, 2),

    cancelled_by        actor_role,
    cancelled_at        TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancellation_tier   cancellation_tier,

    chat_available      BOOLEAN     NOT NULL DEFAULT TRUE,
    can_cancel          BOOLEAN     NOT NULL DEFAULT TRUE,
    timeline_step       INTEGER     NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT bookings_completed_needs_start
        CHECK (completed_at IS NULL OR started_at IS NOT NULL)
);

CREATE INDEX bookings_client_idx ON bookings (client_account_id, section);
CREATE INDEX bookings_provider_idx ON bookings (provider_id, section);
CREATE INDEX bookings_scheduled_idx ON bookings (scheduled_start_at);

-- Bitácora inmutable de la operación del paseo.
CREATE TABLE walk_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID        NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
    event_type          walk_event_type NOT NULL,
    actor_role          actor_role  NOT NULL,
    actor_account_id    UUID        REFERENCES accounts (id) ON DELETE SET NULL,
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX walk_events_booking_idx ON walk_events (booking_id, occurred_at);

-- Tracking GPS: tabla preparada. La ingestión en vivo no está implementada.
CREATE TABLE walk_tracking_points (
    id                  BIGSERIAL PRIMARY KEY,
    booking_id          UUID        NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
    latitude            DOUBLE PRECISION NOT NULL,
    longitude           DOUBLE PRECISION NOT NULL,
    accuracy_meters     REAL,
    recorded_at         TIMESTAMPTZ NOT NULL
);

CREATE INDEX walk_tracking_booking_idx ON walk_tracking_points (booking_id, recorded_at);

-- Una reseña por booking.
CREATE TABLE booking_reviews (
    booking_id          UUID PRIMARY KEY REFERENCES bookings (id) ON DELETE CASCADE,
    rating              SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    tags                TEXT[]      NOT NULL DEFAULT '{}',
    comment             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cotización de cancelación aplicada, con la política versionada usada.
CREATE TABLE booking_cancellations (
    booking_id          UUID PRIMARY KEY REFERENCES bookings (id) ON DELETE CASCADE,
    tier                cancellation_tier NOT NULL,
    penalty_percent     SMALLINT    NOT NULL,
    original_amount     NUMERIC(12, 2) NOT NULL,
    cancellation_charge NUMERIC(12, 2) NOT NULL,
    refund_amount       NUMERIC(12, 2) NOT NULL,
    refund_method       refund_method NOT NULL DEFAULT 'original_payment_method',
    hours_until_start   NUMERIC(10, 4) NOT NULL,
    policy_version      TEXT        NOT NULL DEFAULT 'hupi-standard-cancellation-v1',
    cancelled_by        actor_role  NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pagos. Nunca se almacena PAN ni CVV, solo el token de la pasarela.
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    booking_id          UUID        REFERENCES bookings (id) ON DELETE SET NULL,
    order_id            UUID,
    method              payment_method NOT NULL,
    status              payment_status NOT NULL DEFAULT 'proof_pending',
    amount              NUMERIC(12, 2) NOT NULL,
    currency            TEXT        NOT NULL DEFAULT 'USD',
    proof_document_id   UUID        REFERENCES documents (id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment_methods (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    gateway_token       TEXT        NOT NULL,
    brand               TEXT        NOT NULL,
    last4               CHAR(4)     NOT NULL,
    holder_name         TEXT        NOT NULL,
    expiry_month        SMALLINT    NOT NULL,
    expiry_year         SMALLINT    NOT NULL,
    is_default          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payment_methods_single_default_idx
    ON payment_methods (account_id)
    WHERE is_default;

CREATE TABLE billing_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    taxpayer_type       TEXT        NOT NULL,
    identification_type TEXT        NOT NULL,
    identification_number TEXT      NOT NULL,
    name_or_business_name TEXT      NOT NULL,
    billing_email       TEXT        NOT NULL,
    contact_phone       TEXT,
    fiscal_address      TEXT,
    is_default          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX billing_profiles_single_default_idx
    ON billing_profiles (account_id)
    WHERE is_default;
