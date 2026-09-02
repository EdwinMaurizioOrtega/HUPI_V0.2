-- Coordinación cliente-proveedor, ofertas y mensajería.

CREATE TABLE coordination_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_account_id   UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    provider_id         UUID        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    pet_id              UUID        REFERENCES pets (id) ON DELETE SET NULL,
    service             service_id  NOT NULL DEFAULT 'walk',
    tentative_date      DATE,
    tentative_time      TEXT,
    zone                TEXT,
    status              booking_status NOT NULL DEFAULT 'request_created',
    meeting_preferences JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX coordination_requests_client_idx ON coordination_requests (client_account_id);
CREATE INDEX coordination_requests_provider_idx ON coordination_requests (provider_id);

CREATE TABLE conversations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_type   conversation_type NOT NULL,
    client_account_id   UUID        REFERENCES accounts (id) ON DELETE CASCADE,
    provider_id         UUID        REFERENCES providers (id) ON DELETE CASCADE,
    related_request_id  UUID        REFERENCES coordination_requests (id) ON DELETE SET NULL,
    related_order_id    UUID,
    related_ticket_id   UUID,
    title               TEXT        NOT NULL DEFAULT '',
    is_open             BOOLEAN     NOT NULL DEFAULT TRUE,
    last_message_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id     UUID        NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender_account_id   UUID        REFERENCES accounts (id) ON DELETE SET NULL,
    sender_role         actor_role  NOT NULL,
    body                TEXT        NOT NULL DEFAULT '',
    attachment_document_id UUID     REFERENCES documents (id),
    attachment_kind     attachment_type,
    status              message_status NOT NULL DEFAULT 'sent',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_idx ON messages (conversation_id, created_at);

-- Oferta enviada por el proveedor. El desglose económico queda congelado.
CREATE TABLE service_offers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id          UUID        NOT NULL REFERENCES coordination_requests (id) ON DELETE CASCADE,
    provider_id         UUID        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    approved_plan_id    UUID        REFERENCES provider_walk_plans (id),
    service             service_id  NOT NULL DEFAULT 'walk',
    title               TEXT        NOT NULL,
    description         TEXT        NOT NULL DEFAULT '',
    proposed_date       DATE,
    proposed_time       TEXT,
    duration_minutes    INTEGER,
    walk_count          INTEGER     NOT NULL DEFAULT 1,
    base_price          NUMERIC(12, 2) NOT NULL,
    client_fee          NUMERIC(12, 2) NOT NULL,
    client_total        NUMERIC(12, 2) NOT NULL,
    provider_amount     NUMERIC(12, 2) NOT NULL,
    hupi_commission     NUMERIC(12, 2) NOT NULL,
    conditions          TEXT[]      NOT NULL DEFAULT '{}',
    status              offer_status NOT NULL DEFAULT 'draft',
    expires_at          TIMESTAMPTZ,
    viewed_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX service_offers_request_idx ON service_offers (request_id);
