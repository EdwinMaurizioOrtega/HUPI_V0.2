-- Dirección canónica del cliente. Booking y order guardan un snapshot legible
-- para preservar el historial aunque la dirección cambie después.

CREATE TABLE addresses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    label_type          address_label_type NOT NULL DEFAULT 'home',
    custom_label        TEXT,
    icon_key            TEXT        NOT NULL DEFAULT 'home',
    formatted_address   TEXT        NOT NULL,
    street_address      TEXT        NOT NULL DEFAULT '',
    house_number        TEXT,
    reference           TEXT,
    city                TEXT        NOT NULL DEFAULT '',
    province            TEXT        NOT NULL DEFAULT '',
    country             TEXT        NOT NULL DEFAULT 'EC',
    postal_code         TEXT,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    is_default          BOOLEAN     NOT NULL DEFAULT FALSE,
    source              address_source NOT NULL DEFAULT 'manual',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX addresses_account_idx ON addresses (account_id);

-- Garantiza una sola dirección por defecto por cuenta.
CREATE UNIQUE INDEX addresses_single_default_idx
    ON addresses (account_id)
    WHERE is_default;

-- Preferencias de entrega, en tabla aparte por ser opcionales y extensas.
CREATE TABLE address_delivery_preferences (
    address_id          UUID PRIMARY KEY REFERENCES addresses (id) ON DELETE CASCADE,
    location_type       location_type NOT NULL DEFAULT 'house',
    meeting_point_type  TEXT        NOT NULL DEFAULT 'house_exterior_door',
    handoff_type        handoff_type NOT NULL DEFAULT 'hand_to_customer',
    arrival_contact_preference arrival_contact_preference NOT NULL DEFAULT 'chat',
    instructions        TEXT,
    building_name       TEXT,
    tower_or_block      TEXT,
    floor               TEXT,
    apartment_or_suite  TEXT,
    doorbell_name       TEXT,
    access_code         TEXT,
    has_elevator        BOOLEAN,
    entrance_type       TEXT,
    receiver_name       TEXT,
    schedule_or_restrictions TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
