-- Enrolamiento y verificación del proveedor.
-- El proveedor es un ROL sobre la cuenta existente: account_id es único.

CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    -- Los documentos KYC no se sirven públicamente; se accede por URL firmada.
    storage_key         TEXT        NOT NULL,
    file_name           TEXT        NOT NULL,
    mime_type           TEXT        NOT NULL,
    byte_size           BIGINT,
    is_sensitive        BOOLEAN     NOT NULL DEFAULT TRUE,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX documents_account_idx ON documents (account_id);

CREATE TABLE provider_enrollments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL UNIQUE REFERENCES accounts (id) ON DELETE CASCADE,
    entity_type         provider_entity_type NOT NULL,
    status              provider_verification_status NOT NULL DEFAULT 'in_progress',
    email_validated     BOOLEAN     NOT NULL DEFAULT FALSE,
    last_pending_section provider_section_key,
    website             TEXT,
    general_information TEXT,
    submitted_at        TIMESTAMPTZ,
    reviewed_at         TIMESTAMPTZ,
    review_notes        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estado por sección. El override administrativo tiene prioridad sobre el
-- estado derivado de la completitud.
CREATE TABLE provider_verification_sections (
    enrollment_id       UUID        NOT NULL REFERENCES provider_enrollments (id) ON DELETE CASCADE,
    section_key         provider_section_key NOT NULL,
    status_override     provider_section_status,
    is_complete         BOOLEAN     NOT NULL DEFAULT FALSE,
    review_notes        TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (enrollment_id, section_key)
);

-- Persona natural: identidad y documentos.
CREATE TABLE provider_identities (
    enrollment_id       UUID PRIMARY KEY REFERENCES provider_enrollments (id) ON DELETE CASCADE,
    national_id         TEXT,
    birth_date          DATE,
    nationality         TEXT,
    selfie_document_id  UUID REFERENCES documents (id),
    id_front_document_id UUID REFERENCES documents (id),
    id_back_document_id UUID REFERENCES documents (id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Persona jurídica: la empresa es una entidad separada de la cuenta.
CREATE TABLE provider_companies (
    enrollment_id       UUID PRIMARY KEY REFERENCES provider_enrollments (id) ON DELETE CASCADE,
    legal_name          TEXT,
    trade_name          TEXT,
    ruc                 TEXT,
    company_type        TEXT,
    incorporation_date  DATE,
    phone               TEXT,
    email               TEXT,
    website             TEXT,
    ruc_document_id     UUID REFERENCES documents (id),
    incorporation_document_id UUID REFERENCES documents (id),
    appointment_document_id UUID REFERENCES documents (id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE provider_legal_representatives (
    enrollment_id       UUID PRIMARY KEY REFERENCES provider_enrollments (id) ON DELETE CASCADE,
    first_name          TEXT,
    last_name           TEXT,
    national_id         TEXT,
    birth_date          DATE,
    nationality         TEXT,
    phone               TEXT,
    email               TEXT,
    selfie_document_id  UUID REFERENCES documents (id),
    id_front_document_id UUID REFERENCES documents (id),
    id_back_document_id UUID REFERENCES documents (id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dirección del proveedor: snapshot editable, no la dirección del cliente.
CREATE TABLE provider_addresses (
    enrollment_id       UUID PRIMARY KEY REFERENCES provider_enrollments (id) ON DELETE CASCADE,
    address             TEXT,
    city                TEXT,
    sector              TEXT,
    house_number        TEXT,
    location_type       TEXT        NOT NULL DEFAULT 'house',
    building_name       TEXT,
    unit_number         TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Persona de contacto. Si contact_is_legal_representative es true, los datos
-- se derivan del representante: se guarda el flag, no una copia divergente.
CREATE TABLE provider_contacts (
    enrollment_id       UUID PRIMARY KEY REFERENCES provider_enrollments (id) ON DELETE CASCADE,
    contact_is_legal_representative BOOLEAN NOT NULL DEFAULT FALSE,
    first_name          TEXT,
    last_name           TEXT,
    role                TEXT,
    phone               TEXT,
    email               TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE provider_bank_details (
    enrollment_id       UUID PRIMARY KEY REFERENCES provider_enrollments (id) ON DELETE CASCADE,
    bank                TEXT,
    account_type        TEXT,
    account_number      TEXT,
    account_holder      TEXT,
    holder_tax_id       TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proyección pública del proveedor aprobado.
CREATE TABLE providers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL UNIQUE REFERENCES accounts (id) ON DELETE CASCADE,
    is_verified_by_hupi BOOLEAN     NOT NULL DEFAULT FALSE,
    rating              NUMERIC(3, 2) NOT NULL DEFAULT 0,
    review_count        INTEGER     NOT NULL DEFAULT 0,
    completed_services  INTEGER     NOT NULL DEFAULT 0,
    experience_years    INTEGER,
    zone                TEXT,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    average_response_time_minutes INTEGER,
    is_online           BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX providers_location_idx ON providers (latitude, longitude);
