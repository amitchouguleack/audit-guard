-- 003_api_functions.sql
-- API functions for programmatic access (RPC endpoints)

-- Function to validate API key and return org_id
CREATE OR REPLACE FUNCTION validate_api_key(
    p_api_key TEXT,
    p_api_key_hash TEXT,
    p_api_key_salt TEXT
) RETURNS UUID AS $$
DECLARE
    v_computed_hash TEXT;
BEGIN
    -- Compute HMAC SHA-256 hash of the provided key
    v_computed_hash := encode(
        hmac(
            p_api_key::bytea,
            p_api_key_salt::bytea,
            'sha256'
        ),
        'hex'
    );

    IF v_computed_hash = p_api_key_hash THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization by API key
CREATE OR REPLACE FUNCTION get_org_by_api_key(p_api_key TEXT)
RETURNS TABLE (
    org_id UUID,
    org_name TEXT,
    webhook_url TEXT
) AS $$
DECLARE
    v_org RECORD;
    v_valid BOOLEAN;
BEGIN
    -- Find organization and validate key
    FOR v_org IN
        SELECT id, name, api_key_hash, api_key_salt, webhook_url
        FROM organizations
    LOOP
        v_valid := validate_api_key(p_api_key, v_org.api_key_hash, v_org.api_key_salt);
        IF v_valid THEN
            -- Update last used timestamp
            UPDATE api_tokens
            SET last_used_at = NOW()
            WHERE org_id = v_org.id
              AND token_hash = encode(
                  hmac(p_api_key::bytea, 'token'::bytea, 'sha256'),
                  'hex'
              );

            RETURN QUERY SELECT v_org.id, v_org.name, v_org.webhook_url;
            RETURN;
        END IF;
    END LOOP;

    -- No valid org found
    RAISE EXCEPTION 'Invalid API key';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit audit log via RPC
CREATE OR REPLACE FUNCTION submit_audit_log(
    p_org_id UUID,
    p_source_identifier TEXT,
    p_raw_content TEXT
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_content_hash TEXT;
BEGIN
    -- Generate content hash for deduplication
    v_content_hash := encode(
        sha256(p_raw_content::bytea),
        'hex'
    );

    -- Check for duplicate content within last 24 hours
    IF EXISTS (
        SELECT 1 FROM audit_logs
        WHERE org_id = p_org_id
          AND content_hash = v_content_hash
          AND created_at > NOW() - INTERVAL '24 hours'
    ) THEN
        RAISE EXCEPTION 'Duplicate content detected within last 24 hours';
    END IF;

    -- Insert new audit log
    INSERT INTO audit_logs (org_id, source_identifier, raw_content, content_hash)
    VALUES (p_org_id, p_source_identifier, p_raw_content, v_content_hash)
    RETURNING id INTO v_log_id;

    -- Queue for processing
    INSERT INTO ingestion_queue (org_id, payload)
    VALUES (p_org_id, jsonb_build_object(
        'log_id', v_log_id,
        'source', p_source_identifier,
        'content_length', length(p_raw_content)
    ));

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get compliance summary for dashboard
CREATE OR REPLACE FUNCTION get_compliance_summary(p_org_id UUID)
RETURNS TABLE (
    total_logs BIGINT,
    pending_logs BIGINT,
    completed_logs BIGINT,
    failed_logs BIGINT,
    total_violations BIGINT,
    critical_violations BIGINT,
    avg_risk_score NUMERIC,
    recent_violations JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE TRUE),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'failed'),
        (SELECT COUNT(*) FROM violations WHERE org_id = p_org_id),
        (SELECT COUNT(*) FROM violations WHERE org_id = p_org_id AND severity = 'critical'),
        (SELECT ROUND(AVG(risk_score), 2) FROM audit_logs WHERE org_id = p_org_id AND risk_score IS NOT NULL),
        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', v.id,
                'type', v.violation_type,
                'severity', v.severity,
                'created_at', v.created_at
            )
        ), '[]'::jsonb)
         FROM violations v
         WHERE v.org_id = p_org_id
         ORDER BY v.created_at DESC
         LIMIT 10)
    FROM audit_logs
    WHERE audit_logs.org_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_org_id UUID,
    p_window_seconds INTEGER DEFAULT 60,
    p_max_requests INTEGER DEFAULT 100
) RETURNS BOOLEAN AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM audit_logs
    WHERE org_id = p_org_id
      AND created_at > NOW() - (p_window_seconds || ' seconds')::INTERVAL;

    IF v_count >= p_max_requests THEN
        RETURN FALSE;
    ELSE
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
