-- Servicio Paseos. La aprobación del servicio es INDEPENDIENTE de la
-- aprobación general del proveedor.

CREATE TABLE provider_walk_profiles (
    provider_id         UUID PRIMARY KEY REFERENCES providers (id) ON DELETE CASCADE,
    description         TEXT        NOT NULL DEFAULT '',
    accepted_dog_sizes  TEXT[]      NOT NULL DEFAULT '{}',
    accepted_dog_ages   TEXT[]      NOT NULL DEFAULT '{}',
    maximum_dogs_per_walk INTEGER   NOT NULL DEFAULT 1
        CHECK (maximum_dogs_per_walk BETWEEN 1 AND 8),
    modalities          TEXT[]      NOT NULL DEFAULT '{}',
    walk_types          TEXT[]      NOT NULL DEFAULT '{}',
    special_handling    TEXT[]      NOT NULL DEFAULT '{}',
    requirements        TEXT[]      NOT NULL DEFAULT '{}',
    hourly_rate         NUMERIC(12, 2),
    status              approval_status NOT NULL DEFAULT 'draft',
    review_notes        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE provider_certifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id         UUID        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    name                TEXT        NOT NULL,
    institution         TEXT        NOT NULL,
    year                INTEGER,
    status              approval_status NOT NULL DEFAULT 'draft',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Planes versionados: version_root_id agrupa todas las versiones de un plan.
-- Al aprobar una nueva versión, la anterior pasa a 'superseded'.
CREATE TABLE provider_walk_plans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id         UUID        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    version_root_id     UUID        NOT NULL,
    version             INTEGER     NOT NULL DEFAULT 1,
    replaces_plan_id    UUID        REFERENCES provider_walk_plans (id),
    name                TEXT        NOT NULL,
    description         TEXT        NOT NULL DEFAULT '',
    plan_type           TEXT        NOT NULL DEFAULT 'individual',
    duration_minutes    INTEGER     NOT NULL CHECK (duration_minutes > 0),
    walk_count          INTEGER     NOT NULL DEFAULT 1 CHECK (walk_count > 0),
    frequency_per_week  INTEGER,
    frequency_type      TEXT,
    validity_days       INTEGER,
    pets_included       INTEGER     NOT NULL DEFAULT 1,
    modality            TEXT        NOT NULL DEFAULT 'individual',
    price               NUMERIC(12, 2) NOT NULL CHECK (price > 0),
    includes            TEXT[]      NOT NULL DEFAULT '{}',
    specific_conditions TEXT[]      NOT NULL DEFAULT '{}',
    is_available        BOOLEAN     NOT NULL DEFAULT TRUE,
    available_from      DATE,
    available_until     DATE,
    status              approval_status NOT NULL DEFAULT 'draft',
    review_notes        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (version_root_id, version)
);

CREATE INDEX provider_walk_plans_provider_idx ON provider_walk_plans (provider_id, status);

-- Términos versionados del servicio.
CREATE TABLE provider_terms_versions (
    id                  TEXT PRIMARY KEY,
    version             INTEGER     NOT NULL,
    effective_date      DATE        NOT NULL,
    status              approval_status NOT NULL DEFAULT 'approved',
    free_reschedule_hours INTEGER,
    late_reschedule_window_hours INTEGER,
    late_reschedule_penalty_percent INTEGER,
    minimum_cancellation_hours INTEGER,
    late_cancellation_penalty_percent INTEGER,
    maximum_waiting_minutes INTEGER,
    maximum_delay_minutes INTEGER,
    rain_treatment      TEXT,
    maximum_contact_attempts INTEGER,
    plan_validity_days  INTEGER,
    walk_recovery_conditions TEXT,
    specific_service_conditions TEXT,
    operational_contact_instructions TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evidencia legal inmutable: referencia la versión exacta aceptada.
CREATE TABLE provider_terms_acceptances (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    terms_id            TEXT        NOT NULL REFERENCES provider_terms_versions (id),
    terms_version       INTEGER     NOT NULL,
    effective_date      DATE        NOT NULL,
    provider_id         UUID        NOT NULL REFERENCES providers (id),
    client_account_id   UUID        NOT NULL REFERENCES accounts (id),
    service_or_plan_id  UUID,
    accepted_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO provider_terms_versions (id, version, effective_date, status)
VALUES ('hupi-standard-walk-terms-v1', 1, DATE '2026-08-05', 'approved');
