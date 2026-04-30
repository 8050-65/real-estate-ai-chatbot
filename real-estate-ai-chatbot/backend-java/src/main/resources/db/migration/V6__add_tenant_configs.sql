
-- ============================================================================
-- V6: Tenant Configurations (Leadrat Mapping + Credentials)
-- ============================================================================
-- Maps internal tenant_code to Leadrat credentials
-- tenant_code: "black", "prdblack", "dubait11"
-- ============================================================================

-- Safety Check: Verify update_updated_at_column() function exists
-- Function created in V1 or V2, but safety check for migrations applied in sequence
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        RAISE EXCEPTION 'Function update_updated_at_column() not found. Check V1-V5 migrations executed successfully.';
    END IF;
END $$;

CREATE TABLE tenant_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant identifier (NOT UUID - use tenant_code from tenants table)
    tenant_code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Leadrat Integration
    leadrat_code VARCHAR(50) NOT NULL UNIQUE,     -- Leadrat organization code
    leadrat_api_key VARCHAR(500) NOT NULL,        -- ENCRYPTED with Fernet
    leadrat_secret_key VARCHAR(500) NOT NULL,     -- ENCRYPTED with Fernet
    leadrat_auth_url VARCHAR(500) NOT NULL,
    leadrat_base_url VARCHAR(500) NOT NULL,
    
    -- Sync Tracking
    last_lead_sync TIMESTAMPTZ,
    last_property_sync TIMESTAMPTZ,
    last_project_sync TIMESTAMPTZ,
    
    -- Sync Configuration
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sync_frequency_minutes INTEGER NOT NULL DEFAULT 60,
    
    -- Webhook Support
    webhook_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    webhook_secret VARCHAR(500),                  -- ENCRYPTED if provided
    webhook_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_sync_frequency CHECK (sync_frequency_minutes >= 5),
    CONSTRAINT unique_tenant_leadrat UNIQUE (tenant_code, leadrat_code)
);

-- Indexes for fast lookup
CREATE INDEX idx_tenant_configs_tenant_code ON tenant_configs(tenant_code);
CREATE INDEX idx_tenant_configs_leadrat_code ON tenant_configs(leadrat_code);

-- Auto-update timestamp
CREATE TRIGGER tenant_configs_update_trigger BEFORE UPDATE ON tenant_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify table created
-- SELECT tenant_code, leadrat_code, sync_enabled FROM tenant_configs;


