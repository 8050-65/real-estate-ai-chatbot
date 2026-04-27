-- ============================================================================
-- V1: Core Tables (Tenants, Users, Bot Configs)
-- OUR DATA (not Leadrat references)
-- ============================================================================

-- ============================================================================
-- Tenants Table (Multi-Tenancy)
-- ============================================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'starter',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);

-- ============================================================================
-- Users Table (Admin, Sales Manager, RM, Marketing)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL,
    whatsapp_number VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_role CHECK (role IN ('ADMIN','SALES_MANAGER','RM','MARKETING')),
    UNIQUE(email, tenant_id)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- Bot Configurations Table (Per-Tenant Bot Settings)
-- ============================================================================
CREATE TABLE bot_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    persona_name VARCHAR(100) NOT NULL DEFAULT 'Aria',
    greeting_message TEXT NOT NULL,
    tone VARCHAR(20) NOT NULL DEFAULT 'friendly',
    active_hours_start TIME NOT NULL DEFAULT '09:00',
    active_hours_end TIME NOT NULL DEFAULT '21:00',
    after_hours_message TEXT NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_tone CHECK (tone IN ('formal','friendly')),
    CONSTRAINT unique_tenant_bot UNIQUE (tenant_id)
);

CREATE INDEX idx_bot_configs_tenant_id ON bot_configs(tenant_id);

-- ============================================================================
-- Auto-Update Timestamp Function
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE TRIGGER tenants_update_trigger BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_update_trigger BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER bot_configs_update_trigger BEFORE UPDATE ON bot_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
