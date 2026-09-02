-- Cuenta única por persona. El rol de proveedor se añade sobre esta misma
-- cuenta (ver 0005): nunca se duplica la identidad.

CREATE TABLE accounts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone               TEXT        NOT NULL UNIQUE,
    phone_verified      BOOLEAN     NOT NULL DEFAULT FALSE,
    email               TEXT        UNIQUE,
    email_validated     BOOLEAN     NOT NULL DEFAULT FALSE,
    password_hash       TEXT,
    first_name          TEXT        NOT NULL DEFAULT '',
    last_name           TEXT        NOT NULL DEFAULT '',
    profile_photo_uri   TEXT,
    city                TEXT,
    sector              TEXT,
    onboarding_completed BOOLEAN    NOT NULL DEFAULT FALSE,
    profile_completed   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX accounts_email_idx ON accounts (email) WHERE email IS NOT NULL;

-- Preferencias de usuario (idioma, apariencia, notificaciones).
CREATE TABLE account_preferences (
    account_id          UUID PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
    language            app_language   NOT NULL DEFAULT 'es',
    appearance          app_appearance NOT NULL DEFAULT 'system',
    notifications_enabled BOOLEAN      NOT NULL DEFAULT TRUE,
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Consentimientos versionados (aceptación legal del registro).
CREATE TABLE account_consents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    consent_key         TEXT        NOT NULL,
    consent_version     TEXT        NOT NULL,
    accepted_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (account_id, consent_key, consent_version)
);

-- Sesiones emitidas. Permite revocar tokens.
CREATE TABLE sessions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    refresh_token_hash  TEXT        NOT NULL UNIQUE,
    auth_mode           auth_mode   NOT NULL,
    user_agent          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ
);

CREATE INDEX sessions_account_idx ON sessions (account_id) WHERE revoked_at IS NULL;

-- Códigos OTP. Se guarda el hash, nunca el código en claro.
CREATE TABLE otp_codes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        REFERENCES accounts (id) ON DELETE CASCADE,
    phone               TEXT        NOT NULL,
    code_hash           TEXT        NOT NULL,
    channel             verification_channel NOT NULL DEFAULT 'sms',
    attempts            INTEGER     NOT NULL DEFAULT 0,
    max_attempts        INTEGER     NOT NULL DEFAULT 5,
    consumed_at         TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX otp_codes_phone_idx ON otp_codes (phone, created_at DESC);

-- Tokens de recuperación de acceso. La respuesta al usuario es siempre neutral
-- para no permitir enumeración de cuentas.
CREATE TABLE access_recovery_tokens (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    token_hash          TEXT        NOT NULL UNIQUE,
    channel             verification_channel NOT NULL,
    consumed_at         TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
