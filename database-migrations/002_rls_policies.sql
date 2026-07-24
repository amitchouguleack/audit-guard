-- 002_rls_policies.sql
-- Row-Level Security policies for multi-tenant isolation

-- Enable RLS on all tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's org_id from JWT
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'org_id', '')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Organizations: users can only see their own org
CREATE POLICY "org_select_own" ON organizations
    FOR SELECT
    USING (id = auth.user_org_id());

CREATE POLICY "org_update_own" ON organizations
    FOR UPDATE
    USING (id = auth.user_org_id());

-- Audit logs: organization-scoped access
CREATE POLICY "audit_logs_select_own" ON audit_logs
    FOR SELECT
    USING (org_id = auth.user_org_id());

CREATE POLICY "audit_logs_insert_own" ON audit_logs
    FOR INSERT
    WITH CHECK (org_id = auth.user_org_id());

CREATE POLICY "audit_logs_update_own" ON audit_logs
    FOR UPDATE
    USING (org_id = auth.user_org_id());

-- Violations: organization-scoped access
CREATE POLICY "violations_select_own" ON violations
    FOR SELECT
    USING (org_id = auth.user_org_id());

CREATE POLICY "violations_insert_own" ON violations
    FOR INSERT
    WITH CHECK (org_id = auth.user_org_id());

CREATE POLICY "violations_delete_own" ON violations
    FOR DELETE
    USING (org_id = auth.user_org_id());

-- API tokens: organization-scoped access
CREATE POLICY "api_tokens_select_own" ON api_tokens
    FOR SELECT
    USING (org_id = auth.user_org_id());

CREATE POLICY "api_tokens_insert_own" ON api_tokens
    FOR INSERT
    WITH CHECK (org_id = auth.user_org_id());

CREATE POLICY "api_tokens_update_own" ON api_tokens
    FOR UPDATE
    USING (org_id = auth.user_org_id());

CREATE POLICY "api_tokens_delete_own" ON api_tokens
    FOR DELETE
    USING (org_id = auth.user_org_id());

-- Ingestion queue: organization-scoped access
CREATE POLICY "ingestion_queue_select_own" ON ingestion_queue
    FOR SELECT
    USING (org_id = auth.user_org_id());

CREATE POLICY "ingestion_queue_insert_own" ON ingestion_queue
    FOR INSERT
    WITH CHECK (org_id = auth.user_org_id());

CREATE POLICY "ingestion_queue_update_own" ON ingestion_queue
    FOR UPDATE
    USING (org_id = auth.user_org_id());

-- Service role bypass for edge functions (Supabase service key has full access)
CREATE POLICY "service_role_all_audit_logs" ON audit_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_violations" ON violations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_ingestion_queue" ON ingestion_queue
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_api_tokens" ON api_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_organizations" ON organizations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
