-- Mascotas. Único por pet_id; el historial se consulta desde bookings.

CREATE TABLE pets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    code                TEXT,
    name                TEXT        NOT NULL,
    species             TEXT,
    breed               TEXT,
    birthday            DATE,
    weight_kg           NUMERIC(6, 2),
    sex                 TEXT,
    size                TEXT,
    physical_activity   TEXT,
    behavior            TEXT,
    behavior_description TEXT,
    bites               BOOLEAN,
    allergies           TEXT,
    medications         TEXT,
    care_instructions   TEXT,
    veterinarian_name   TEXT,
    clinic_name         TEXT,
    emergency_contact_name  TEXT,
    emergency_contact_phone TEXT,
    vaccines_up_to_date BOOLEAN     NOT NULL DEFAULT FALSE,
    sterilized          BOOLEAN     NOT NULL DEFAULT FALSE,
    photo_uri           TEXT,
    vaccine_card_document_id UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pets_account_idx ON pets (account_id);
