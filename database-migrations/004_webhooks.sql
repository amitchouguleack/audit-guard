-- 004_webhooks.sql
-- Database webhooks for real-time event handling

-- Function to handle new violations and trigger external webhooks
CREATE OR REPLACE FUNCTION handle_violation_webhook()
RETURNS TRIGGER AS $$
DECLARE
    v_org RECORD;
    v_payload JSONB;
    v_webhook_url TEXT;
BEGIN
    -- Get organization webhook URL
    SELECT webhook_url INTO v_webhook_url
    FROM organizations
    WHERE id = NEW.org_id;

    -- Only proceed if webhook URL is configured
    IF v_webhook_url IS NULL OR v_webhook_url = '' THEN
        RETURN NEW;
    END IF;

    -- Build payload for external webhook
    v_payload := jsonb_build_object(
        'event', 'violation_detected',
        'timestamp', NOW()::TEXT,
        'violation', jsonb_build_object(
            'id', NEW.id,
            'log_id', NEW.log_id,
            'type', NEW.violation_type,
            'severity', NEW.severity,
            'matched_content', NEW.matched_content,
            'match_offset', NEW.match_offset,
            'created_at', NEW.created_at
        ),
        'organization', jsonb_build_object(
            'id', NEW.org_id,
            'name', (SELECT name FROM organizations WHERE id = NEW.org_id)
        )
    );

    -- Queue webhook delivery to ingestion queue for async processing
    INSERT INTO ingestion_queue (org_id, payload, status)
    VALUES (
        NEW.org_id,
        jsonb_build_object(
            'action', 'webhook_delivery',
            'target_url', v_webhook_url,
            'payload', v_payload,
            'retry_count', 0
        ),
        'queued'
    );

    -- If critical severity, also create a high-priority alert
    IF NEW.severity = 'critical' THEN
        INSERT INTO ingestion_queue (org_id, payload, status)
        VALUES (
            NEW.org_id,
            jsonb_build_object(
                'action', 'critical_alert',
                'violation_id', NEW.id,
                'violation_type', NEW.violation_type,
                'severity', NEW.severity,
                'org_id', NEW.org_id
            ),
            'queued'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for violation webhooks
CREATE TRIGGER trg_violation_webhook
    AFTER INSERT ON violations
    FOR EACH ROW
    EXECUTE FUNCTION handle_violation_webhook();

-- Function to update audit log status and timestamps
CREATE OR REPLACE FUNCTION update_audit_log_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        NEW.updated_at = NOW();

        IF NEW.status = 'completed' THEN
            NEW.processed_at = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-updating timestamps
CREATE TRIGGER trg_audit_log_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_log_timestamp();

-- Function to clean up old processing queue entries
CREATE OR REPLACE FUNCTION cleanup_stale_queue()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete entries stuck in processing for more than 5 minutes
    DELETE FROM ingestion_queue
    WHERE status = 'processing'
      AND created_at < NOW() - INTERVAL '5 minutes';

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Reset failed entries that haven't exceeded max attempts
    UPDATE ingestion_queue
    SET status = 'queued', attempts = attempts + 1
    WHERE status = 'failed'
      AND attempts < max_attempts;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enforce ingestion limits per organization
CREATE OR REPLACE FUNCTION enforce_ingestion_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_limit INTEGER := 1000; -- Max queued items per org
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM ingestion_queue
    WHERE org_id = NEW.org_id
      AND status IN ('queued', 'processing');

    IF v_count >= v_limit THEN
        RAISE EXCEPTION 'Ingestion queue limit reached for organization';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for queue limit enforcement
CREATE TRIGGER trg_ingestion_limit
    BEFORE INSERT ON ingestion_queue
    FOR EACH ROW
    EXECUTE FUNCTION enforce_ingestion_limit();

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION validate_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_by_api_key TO service_role;
GRANT EXECUTE ON FUNCTION submit_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_compliance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_stale_queue TO service_role;
