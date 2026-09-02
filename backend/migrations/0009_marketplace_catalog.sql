-- Marketplace: tienda y catálogo.

CREATE TABLE stores (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id         UUID        NOT NULL UNIQUE REFERENCES providers (id) ON DELETE CASCADE,
    name                TEXT        NOT NULL,
    description         TEXT        NOT NULL DEFAULT '',
    categories          TEXT[]      NOT NULL DEFAULT '{}',
    logo_document_id    UUID        REFERENCES documents (id),
    status              store_status NOT NULL DEFAULT 'under_review',
    is_official_store   BOOLEAN     NOT NULL DEFAULT FALSE,
    is_verified_by_hupi BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Identidad legal reutilizada como readonly desde la verificación.
    province            TEXT,
    city                TEXT,
    pickup_address      TEXT,
    address_reference   TEXT,
    billing_email       TEXT,
    billing_phone       TEXT,
    internal_email      TEXT,
    internal_phone      TEXT,
    rating              NUMERIC(3, 2) NOT NULL DEFAULT 0,
    completed_orders    INTEGER     NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE store_schedule_days (
    store_id            UUID        NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
    day_of_week         SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    enabled             BOOLEAN     NOT NULL DEFAULT TRUE,
    opens_at            TIME,
    closes_at           TIME,
    PRIMARY KEY (store_id, day_of_week)
);

CREATE TABLE store_shipping_settings (
    store_id            UUID        NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
    method              shipping_method NOT NULL,
    enabled             BOOLEAN     NOT NULL DEFAULT FALSE,
    price               NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estimate            TEXT,
    instructions        TEXT,
    PRIMARY KEY (store_id, method)
);

CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id            UUID        NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
    name                TEXT        NOT NULL,
    description         TEXT        NOT NULL DEFAULT '',
    brand               TEXT,
    sku                 TEXT,
    product_type        product_type NOT NULL DEFAULT 'simple',
    category_id         TEXT,
    category_other      TEXT,
    tax_rate            NUMERIC(4, 2) NOT NULL DEFAULT 0 CHECK (tax_rate IN (0, 15)),
    card_price_before   NUMERIC(12, 2),
    card_price_after    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    transfer_price_before NUMERIC(12, 2),
    transfer_price_after NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock               INTEGER     NOT NULL DEFAULT 0,
    stock_alert_min     INTEGER     NOT NULL DEFAULT 0,
    stock_status        stock_status NOT NULL DEFAULT 'available',
    status              product_status NOT NULL DEFAULT 'under_review',
    approval_status     approval_status NOT NULL DEFAULT 'draft',
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    tags                TEXT[]      NOT NULL DEFAULT '{}',
    weight              NUMERIC(10, 3),
    weight_unit         TEXT,
    length_cm           NUMERIC(10, 2),
    width_cm            NUMERIC(10, 2),
    height_cm           NUMERIC(10, 2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX products_store_idx ON products (store_id, status);

-- Índice de búsqueda sin acentos, equivalente a normalizeMarketplaceSearch.
-- unaccent(text) es STABLE, así que no puede indexarse directamente: se envuelve
-- en la variante de dos argumentos, que sí es IMMUTABLE.
CREATE OR REPLACE FUNCTION immutable_unaccent(TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

CREATE INDEX products_search_idx ON products
    USING GIN (to_tsvector('simple', immutable_unaccent(name || ' ' || coalesce(brand, '') || ' ' || description)));

CREATE TABLE product_images (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id          UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    document_id         UUID        REFERENCES documents (id),
    label               TEXT,
    is_primary          BOOLEAN     NOT NULL DEFAULT FALSE,
    sort_order          INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE product_variation_groups (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id          UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    kind                TEXT        NOT NULL,
    name                TEXT        NOT NULL,
    sort_order          INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE product_variation_options (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id            UUID        NOT NULL REFERENCES product_variation_groups (id) ON DELETE CASCADE,
    name                TEXT        NOT NULL,
    color_hex           TEXT,
    sort_order          INTEGER     NOT NULL DEFAULT 0
);

-- Combinación concreta vendible, con su propio stock y precio.
CREATE TABLE product_variations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id          UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    name                TEXT        NOT NULL,
    sku                 TEXT,
    selected_options    JSONB       NOT NULL DEFAULT '{}',
    price_before_card   NUMERIC(12, 2),
    price_after_card    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price_before_transfer NUMERIC(12, 2),
    price_after_transfer NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock               INTEGER     NOT NULL DEFAULT 0,
    stock_alert_min     INTEGER     NOT NULL DEFAULT 0,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    status              product_status NOT NULL DEFAULT 'active',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX product_variations_product_idx ON product_variations (product_id);

-- Ledger de inventario: el stock se mueve por eventos, no por edición directa.
CREATE TABLE stock_movements (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          UUID        REFERENCES products (id) ON DELETE CASCADE,
    variation_id        UUID        REFERENCES product_variations (id) ON DELETE CASCADE,
    delta               INTEGER     NOT NULL,
    reason              TEXT        NOT NULL,
    actor_account_id    UUID        REFERENCES accounts (id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE carts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL UNIQUE REFERENCES accounts (id) ON DELETE CASCADE,
    coupon_code         TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id             UUID        NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
    product_id          UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    variation_id        UUID        REFERENCES product_variations (id) ON DELETE CASCADE,
    quantity            INTEGER     NOT NULL CHECK (quantity > 0),
    unit_price_snapshot NUMERIC(12, 2) NOT NULL,
    added_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cart_id, product_id, variation_id)
);

CREATE TABLE coupons (
    code                TEXT PRIMARY KEY,
    discount_percent    SMALLINT,
    discount_amount     NUMERIC(12, 2),
    valid_from          TIMESTAMPTZ,
    valid_until         TIMESTAMPTZ,
    max_uses            INTEGER,
    used_count          INTEGER     NOT NULL DEFAULT 0,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE
);
