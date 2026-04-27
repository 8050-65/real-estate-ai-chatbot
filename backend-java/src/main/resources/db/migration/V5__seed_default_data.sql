-- ============================================================================
-- V5: Seed Default Data (Default Tenant, Admin User, Bot Config)
-- ============================================================================

-- ============================================================================
-- Insert Default Tenant
-- ============================================================================
INSERT INTO tenants (id, name, slug, plan, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'CRM Chatbot',
    'black',
    'enterprise',
    TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Insert Default Admin User
-- ============================================================================
-- Password: admin123 (bcrypt hash for production, change immediately)
INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    full_name,
    role,
    is_active
)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'admin@crm-cbt.com',
    '$2b$10$FNi4SUkVr.SGdt8rRFHqAuMKXHRMoxZtIYZaUUdTmKuF4vKAq5fry',
    'System Admin',
    'ADMIN',
    TRUE
)
ON CONFLICT (email, tenant_id) DO NOTHING;

-- ============================================================================
-- Insert Default Bot Configuration (Aria)
-- ============================================================================
INSERT INTO bot_configs (
    id,
    tenant_id,
    persona_name,
    greeting_message,
    tone,
    active_hours_start,
    active_hours_end,
    after_hours_message,
    language,
    is_active
)
VALUES (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    'Aria',
    'Hi! I am Aria your real estate assistant. How can I help you today?',
    'friendly',
    '09:00'::TIME,
    '21:00'::TIME,
    'Thanks for reaching out! Our team will respond 9AM-9PM.',
    'en',
    TRUE
)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- Insert Default Sales Manager User (Optional)
-- ============================================================================
INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    full_name,
    role,
    whatsapp_number,
    is_active
)
VALUES (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'sales@crm-cbt.com',
    '$2b$10$FNi4SUkVr.SGdt8rRFHqAuMKXHRMoxZtIYZaUUdTmKuF4vKAq5fry',
    'John Sales',
    'SALES_MANAGER',
    '+919876543210',
    TRUE
)
ON CONFLICT (email, tenant_id) DO NOTHING;

-- ============================================================================
-- Insert Default RM User (Optional)
-- ============================================================================
INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    full_name,
    role,
    whatsapp_number,
    is_active
)
VALUES (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    'rm@crm-cbt.com',
    '$2b$10$FNi4SUkVr.SGdt8rRFHqAuMKXHRMoxZtIYZaUUdTmKuF4vKAq5fry',
    'Jane RM',
    'RM',
    '+919876543211',
    TRUE
)
ON CONFLICT (email, tenant_id) DO NOTHING;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- SELECT id, name, slug FROM tenants;
-- SELECT id, email, full_name, role FROM users WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
-- SELECT id, persona_name, tone FROM bot_configs WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
