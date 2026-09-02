-- Finanzas, soporte, notificaciones y trazabilidad transversal.

-- Saldo Hupi: ledger de movimientos, no un campo mutable.
CREATE TABLE wallet_movements (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    concept             TEXT        NOT NULL,
    amount              NUMERIC(12, 2) NOT NULL,
    movement_type       wallet_movement_type NOT NULL,
    status              wallet_movement_status NOT NULL DEFAULT 'available',
    related_order_id    UUID        REFERENCES orders (id) ON DELETE SET NULL,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wallet_movements_account_idx ON wallet_movements (account_id, created_at DESC);

CREATE TABLE marketplace_issues (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number         TEXT        NOT NULL UNIQUE,
    order_id            UUID        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    provider_order_id   UUID        REFERENCES provider_orders (id) ON DELETE SET NULL,
    client_account_id   UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    reason              TEXT        NOT NULL,
    description         TEXT        NOT NULL DEFAULT '',
    evidence_document_id UUID       REFERENCES documents (id),
    status              issue_status NOT NULL DEFAULT 'open',
    resolution_type     TEXT,
    refund_amount       NUMERIC(12, 2),
    admin_comment       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMPTZ
);

CREATE TABLE refunds (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id            UUID        REFERENCES marketplace_issues (id) ON DELETE SET NULL,
    order_id            UUID        REFERENCES orders (id) ON DELETE SET NULL,
    booking_id          UUID        REFERENCES bookings (id) ON DELETE SET NULL,
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    original_payment_method payment_method NOT NULL,
    method              refund_method NOT NULL,
    amount              NUMERIC(12, 2) NOT NULL,
    status              refund_status NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at        TIMESTAMPTZ
);

-- Liquidación mensual al proveedor. Comisión Hupi del 30 %.
CREATE TABLE provider_payouts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id            UUID        REFERENCES stores (id) ON DELETE CASCADE,
    provider_id         UUID        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    settlement_number   TEXT        NOT NULL UNIQUE,
    period_month        DATE        NOT NULL,
    gross_sales         NUMERIC(12, 2) NOT NULL DEFAULT 0,
    hupi_commission     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    provider_net        NUMERIC(12, 2) NOT NULL DEFAULT 0,
    refunds_adjustment  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cancelled_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0,
    administrative_discounts NUMERIC(12, 2) NOT NULL DEFAULT 0,
    other_adjustments   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_to_transfer   NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status              payout_status NOT NULL DEFAULT 'pending_payment',
    paid_at             TIMESTAMPTZ,
    next_payout_date    DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider_id, period_month)
);

CREATE TABLE provider_payout_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_id           UUID        NOT NULL REFERENCES provider_payouts (id) ON DELETE CASCADE,
    order_item_id       UUID        REFERENCES order_items (id) ON DELETE SET NULL,
    occurred_on         DATE        NOT NULL,
    description         TEXT        NOT NULL,
    quantity            INTEGER     NOT NULL DEFAULT 1,
    sold_price          NUMERIC(12, 2) NOT NULL,
    hupi_commission     NUMERIC(12, 2) NOT NULL,
    provider_value      NUMERIC(12, 2) NOT NULL
);

CREATE TABLE support_tickets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number         TEXT        NOT NULL UNIQUE,
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    category            TEXT        NOT NULL,
    description         TEXT        NOT NULL,
    status              ticket_status NOT NULL DEFAULT 'open',
    related_booking_id  UUID        REFERENCES bookings (id) ON DELETE SET NULL,
    related_order_id    UUID        REFERENCES orders (id) ON DELETE SET NULL,
    attachment_document_id UUID     REFERENCES documents (id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMPTZ
);

CREATE INDEX support_tickets_account_idx ON support_tickets (account_id, status);

CREATE TABLE support_ticket_messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id           UUID        NOT NULL REFERENCES support_tickets (id) ON DELETE CASCADE,
    author_role         actor_role  NOT NULL,
    author_account_id   UUID        REFERENCES accounts (id) ON DELETE SET NULL,
    body                TEXT        NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    category            TEXT        NOT NULL,
    notification_type   TEXT        NOT NULL,
    title               TEXT        NOT NULL,
    body                TEXT        NOT NULL DEFAULT '',
    priority            notification_priority NOT NULL DEFAULT 'normal',
    action_label        TEXT,
    action_target       TEXT,
    dedupe_key          TEXT,
    read_at             TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_account_idx
    ON notifications (account_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX notifications_dedupe_idx
    ON notifications (account_id, dedupe_key)
    WHERE dedupe_key IS NOT NULL;

CREATE TABLE favorite_provider_lists (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    name                TEXT        NOT NULL,
    service             service_id,
    is_locked           BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE favorite_providers (
    list_id             UUID        NOT NULL REFERENCES favorite_provider_lists (id) ON DELETE CASCADE,
    provider_id         UUID        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    added_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (list_id, provider_id)
);

-- Trazabilidad: toda mutación relevante deja actor, momento y datos.
CREATE TABLE audit_log (
    id                  BIGSERIAL PRIMARY KEY,
    actor_account_id    UUID        REFERENCES accounts (id) ON DELETE SET NULL,
    actor_role          actor_role  NOT NULL DEFAULT 'system',
    action              TEXT        NOT NULL,
    entity_type         TEXT        NOT NULL,
    entity_id           UUID,
    payload             JSONB,
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_entity_idx ON audit_log (entity_type, entity_id, occurred_at DESC);

-- Idempotencia de mutaciones: misma clave, misma respuesta.
CREATE TABLE idempotency_keys (
    key                 TEXT PRIMARY KEY,
    account_id          UUID        REFERENCES accounts (id) ON DELETE CASCADE,
    endpoint            TEXT        NOT NULL,
    response_status     SMALLINT,
    response_body       JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ NOT NULL
);
