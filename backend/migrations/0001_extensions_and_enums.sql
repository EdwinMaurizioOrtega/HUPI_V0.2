-- Extensiones y enums compartidos.
-- Convención: los enums usan códigos estables en inglés snake_case.
-- Las etiquetas visibles en español/inglés se resuelven en el cliente vía i18n.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Identidad y sesión -------------------------------------------------------
CREATE TYPE auth_mode AS ENUM ('login', 'register');
CREATE TYPE verification_channel AS ENUM ('sms', 'email');
CREATE TYPE app_language AS ENUM ('es', 'en');
CREATE TYPE app_appearance AS ENUM ('system', 'light', 'dark');

-- Proveedor ----------------------------------------------------------------
CREATE TYPE provider_entity_type AS ENUM ('natural', 'legal');

CREATE TYPE provider_verification_status AS ENUM (
    'not_started', 'in_progress', 'submitted', 'under_review',
    'changes_requested', 'approved', 'rejected', 'suspended'
);

CREATE TYPE provider_section_status AS ENUM (
    'pending', 'complete', 'under_review', 'approved', 'changes_requested'
);

CREATE TYPE provider_section_key AS ENUM (
    'account', 'personal', 'identity', 'address', 'contact', 'bank', 'general',
    'company', 'company_documents', 'legal_representative'
);

-- Workflow de aprobación de catálogo (perfil de servicio, planes, certificaciones)
CREATE TYPE approval_status AS ENUM (
    'draft', 'pending_approval', 'changes_requested', 'approved',
    'rejected', 'suspended', 'archived', 'superseded'
);

-- Servicios ----------------------------------------------------------------
-- El MVP solo habilita 'walk' y 'marketplace'; el resto existe en definiciones.
CREATE TYPE service_id AS ENUM (
    'walk', 'sitter', 'boarding', 'daycare', 'grooming', 'training', 'marketplace'
);

-- Reservas -----------------------------------------------------------------
CREATE TYPE booking_status AS ENUM (
    'request_created', 'coordination_request', 'offer_sent', 'payment_pending',
    'confirmed', 'scheduled', 'upcoming', 'in_progress', 'finished',
    'completed', 'cancelled'
);

CREATE TYPE booking_section AS ENUM ('upcoming', 'current', 'history', 'cancelled');

CREATE TYPE walk_event_type AS ENUM (
    'walk_started', 'walk_completed', 'provider_cancelled_walk'
);

CREATE TYPE actor_role AS ENUM ('client', 'provider', 'support', 'system', 'hupi');

CREATE TYPE cancellation_tier AS ENUM ('free', 'half', 'full');

-- Ofertas ------------------------------------------------------------------
CREATE TYPE offer_status AS ENUM (
    'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'cancelled'
);

-- Pagos --------------------------------------------------------------------
CREATE TYPE payment_status AS ENUM (
    'proof_pending', 'proof_submitted', 'payment_review', 'confirmed', 'proof_rejected'
);

CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'deuna', 'hupi_balance');

-- Marketplace --------------------------------------------------------------
CREATE TYPE product_status AS ENUM ('active', 'paused', 'under_review', 'out_of_stock');
CREATE TYPE product_type AS ENUM ('simple', 'variable');
CREATE TYPE stock_status AS ENUM ('available', 'out_of_stock', 'paused');

CREATE TYPE order_status AS ENUM (
    'payment_pending', 'payment_review', 'confirmed', 'preparing',
    'ready_to_ship', 'in_transit', 'delivered', 'cancelled'
);

CREATE TYPE shipping_method AS ENUM ('standard', 'express', 'pickup');

CREATE TYPE store_status AS ENUM ('under_review', 'enabled', 'needs_changes', 'disabled');

-- Incidencias y reembolsos -------------------------------------------------
CREATE TYPE issue_status AS ENUM ('open', 'under_review', 'approved', 'rejected', 'closed');
CREATE TYPE refund_status AS ENUM ('pending', 'processed', 'rejected');
CREATE TYPE refund_method AS ENUM ('hupi_balance', 'original_payment_method', 'manual_transfer');

CREATE TYPE wallet_movement_type AS ENUM (
    'refund_credited', 'purchase_use', 'hupi_adjustment', 'balance_expired'
);
CREATE TYPE wallet_movement_status AS ENUM ('available', 'used', 'pending', 'reversed');

CREATE TYPE payout_status AS ENUM ('pending_payment', 'paid');

-- Soporte y notificaciones -------------------------------------------------
CREATE TYPE ticket_status AS ENUM (
    'open', 'under_review', 'awaiting_reply', 'resolved', 'closed'
);

CREATE TYPE conversation_type AS ENUM ('marketplace', 'services', 'support');
CREATE TYPE message_status AS ENUM ('sent', 'read');
CREATE TYPE attachment_type AS ENUM ('image', 'document', 'receipt');

CREATE TYPE notification_priority AS ENUM ('normal', 'important', 'urgent');

-- Direcciones --------------------------------------------------------------
CREATE TYPE address_label_type AS ENUM ('home', 'work', 'other');
CREATE TYPE address_source AS ENUM ('manual', 'current_location', 'map', 'legacy');
CREATE TYPE location_type AS ENUM (
    'house', 'apartment_building', 'residential_complex', 'office_or_store'
);
CREATE TYPE handoff_type AS ENUM ('hand_to_customer', 'leave_at_location');
CREATE TYPE arrival_contact_preference AS ENUM (
    'chat', 'call', 'chat_and_call', 'instructions_only'
);
