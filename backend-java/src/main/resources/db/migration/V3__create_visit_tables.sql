-- ============================================================================
-- V3: Site Visit Tables (HYBRID - our data + Leadrat references)
-- Stores visit scheduling/reminders, references Leadrat for property details
-- RULE: Never duplicate property_name, property_address, project_details
-- RULE: Store only leadrat_lead_id, leadrat_project_id references
-- ============================================================================

-- ============================================================================
-- Site Visits Table (Scheduling + sync status)
-- ============================================================================
CREATE TABLE site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    leadrat_lead_id VARCHAR(100) NOT NULL,
    leadrat_project_id VARCHAR(100),
    leadrat_visit_id VARCHAR(100),
    customer_name VARCHAR(200) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL,
    rm_id UUID REFERENCES users(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    visitor_count INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    google_maps_link TEXT,
    reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_2h_sent BOOLEAN NOT NULL DEFAULT FALSE,
    leadrat_synced BOOLEAN NOT NULL DEFAULT FALSE,
    leadrat_sync_error TEXT,
    cancelled_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_visitor_count CHECK (visitor_count > 0),
    CONSTRAINT check_status CHECK (status IN
        ('scheduled','confirmed','completed','cancelled','no_show'))
);

CREATE INDEX idx_site_visits_tenant_id ON site_visits(tenant_id);
CREATE INDEX idx_site_visits_leadrat_lead_id ON site_visits(leadrat_lead_id);
CREATE INDEX idx_site_visits_leadrat_project_id ON site_visits(leadrat_project_id);
CREATE INDEX idx_site_visits_status ON site_visits(status);
CREATE INDEX idx_site_visits_scheduled_at ON site_visits(scheduled_at);
CREATE INDEX idx_site_visits_created_at ON site_visits(created_at);

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================
CREATE TRIGGER site_visits_update_trigger BEFORE UPDATE ON site_visits
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
