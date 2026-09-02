-- Pedidos del marketplace.
-- El pedido del cliente agrupa subpedidos por tienda. provider_orders es la
-- vista del vendedor sobre el MISMO pedido global, no una copia.

CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number        TEXT        NOT NULL UNIQUE,
    client_account_id   UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    status              order_status NOT NULL DEFAULT 'payment_pending',
    payment_method      payment_method NOT NULL,
    payment_status      payment_status NOT NULL DEFAULT 'proof_pending',
    shipping_method     shipping_method NOT NULL DEFAULT 'standard',

    -- Snapshots inmutables del momento de la compra.
    delivery_address_snapshot JSONB,
    billing_profile_snapshot  JSONB,

    subtotal            NUMERIC(12, 2) NOT NULL DEFAULT 0,
    shipping_cost       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount            NUMERIC(12, 2) NOT NULL DEFAULT 0,
    donation            NUMERIC(12, 2) NOT NULL DEFAULT 0,
    hupi_balance_applied NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total               NUMERIC(12, 2) NOT NULL DEFAULT 0,

    coupon_code         TEXT        REFERENCES coupons (code),
    proof_document_id   UUID        REFERENCES documents (id),
    receipt_available   BOOLEAN     NOT NULL DEFAULT FALSE,
    can_rate            BOOLEAN     NOT NULL DEFAULT FALSE,
    rating_submitted    BOOLEAN     NOT NULL DEFAULT FALSE,
    cancellation_reason TEXT,
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX orders_client_idx ON orders (client_account_id, status);

-- Subpedido por tienda.
CREATE TABLE provider_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_order_number TEXT      NOT NULL UNIQUE,
    order_id            UUID        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    store_id            UUID        NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
    status              order_status NOT NULL DEFAULT 'confirmed',
    delivery_type       shipping_method NOT NULL DEFAULT 'standard',
    carrier             TEXT,
    tracking_number     TEXT,
    shipping_guide_document_id UUID REFERENCES documents (id),
    delivery_evidence_document_id UUID REFERENCES documents (id),
    notes               TEXT,
    subtotal            NUMERIC(12, 2) NOT NULL DEFAULT 0,
    hupi_commission     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    provider_net        NUMERIC(12, 2) NOT NULL DEFAULT 0,
    placed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at        TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (order_id, store_id)
);

CREATE INDEX provider_orders_store_idx ON provider_orders (store_id, status);

CREATE TABLE order_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_order_id   UUID        NOT NULL REFERENCES provider_orders (id) ON DELETE CASCADE,
    product_id          UUID        REFERENCES products (id) ON DELETE SET NULL,
    variation_id        UUID        REFERENCES product_variations (id) ON DELETE SET NULL,
    -- Snapshot: el nombre y el precio del momento de la compra.
    product_name        TEXT        NOT NULL,
    variation_name      TEXT,
    sku                 TEXT,
    quantity            INTEGER     NOT NULL CHECK (quantity > 0),
    unit_price          NUMERIC(12, 2) NOT NULL,
    line_total          NUMERIC(12, 2) NOT NULL
);

CREATE INDEX order_items_provider_order_idx ON order_items (provider_order_id);

-- Timeline de actividad del subpedido.
CREATE TABLE provider_order_activities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_order_id   UUID        NOT NULL REFERENCES provider_orders (id) ON DELETE CASCADE,
    activity_type       TEXT        NOT NULL,
    title               TEXT        NOT NULL,
    description         TEXT,
    actor_role          actor_role  NOT NULL,
    actor_account_id    UUID        REFERENCES accounts (id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX provider_order_activities_idx
    ON provider_order_activities (provider_order_id, created_at);

CREATE TABLE order_reviews (
    order_id            UUID PRIMARY KEY REFERENCES orders (id) ON DELETE CASCADE,
    store_rating        SMALLINT    CHECK (store_rating BETWEEN 1 AND 5),
    product_rating      SMALLINT    CHECK (product_rating BETWEEN 1 AND 5),
    comment             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
