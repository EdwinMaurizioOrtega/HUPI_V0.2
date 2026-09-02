-- El prototipo muestra nombres comerciales de proveedor ("Andrés & Luna") y
-- códigos de reserva legibles ("QA-WALK-001"). Sin estas columnas el backend
-- solo podría devolver UUIDs y la pantalla cambiaría respecto al diseño.

ALTER TABLE providers
    ADD COLUMN display_name TEXT,
    ADD COLUMN initials     TEXT,
    ADD COLUMN level        TEXT,
    ADD COLUMN avatar_color TEXT,
    ADD COLUMN is_searchable BOOLEAN NOT NULL DEFAULT TRUE;

-- Tarifa por servicio: un proveedor publica precio distinto por cada servicio.
CREATE TABLE provider_service_prices (
    provider_id     UUID        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    service         service_id  NOT NULL,
    price           NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    is_offered      BOOLEAN     NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (provider_id, service)
);

ALTER TABLE bookings
    ADD COLUMN reference_code TEXT UNIQUE;

CREATE INDEX bookings_reference_code_idx ON bookings (reference_code);
