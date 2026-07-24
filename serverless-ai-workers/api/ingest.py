import json
import os
from http.server import BaseHTTPRequestHandler

from patterns import scan_content, calculate_risk_score
from gemini_client import analyze_compliance
from supabase_client import (
    update_audit_log,
    insert_violation,
    get_audit_log,
    submit_audit_log,
    get_supabase
)


class Handler(BaseHTTPRequestHandler):

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            request_data = json.loads(body)

            api_key = request_data.get("api_key")
            if not api_key:
                self._send_error(401, "API key required")
                return

            supabase = get_supabase()
            org_result = supabase.rpc(
                "get_org_by_api_key",
                {"p_api_key": api_key}
            ).execute()

            if not org_result.data:
                self._send_error(403, "Invalid API key")
                return

            org = org_result.data[0]

            content = request_data.get("content", "")
            source = request_data.get("source", "unknown")

            if not content:
                self._send_error(400, "Content is required")
                return

            log_id = submit_audit_log(
                org_id=org["org_id"],
                source_identifier=source,
                raw_content=content
            )

            if not log_id:
                self._send_error(500, "Failed to create audit log")
                return

            update_audit_log(log_id, {"status": "processing"})

            pattern_matches = scan_content(content)
            risk_score = calculate_risk_score(pattern_matches)

            match_dicts = [
                {
                    "type": m.pattern_type,
                    "severity": m.severity,
                    "content": m.matched_text,
                    "start": m.start_offset,
                    "end": m.end_offset
                }
                for m in pattern_matches
            ]

            ai_analysis = analyze_compliance(content, match_dicts)

            final_score = max(risk_score, ai_analysis.get("risk_score", 0))
            final_score = min(final_score, 100)

            update_audit_log(log_id, {
                "status": "completed",
                "risk_score": final_score
            })

            for match in pattern_matches:
                insert_violation({
                    "log_id": log_id,
                    "org_id": org["org_id"],
                    "violation_type": match.pattern_type,
                    "severity": match.severity,
                    "matched_content": match.matched_text,
                    "match_offset": match.start_offset,
                    "match_length": match.end_offset - match.start_offset
                })

            response = {
                "status": "success",
                "log_id": log_id,
                "risk_score": final_score,
                "risk_level": ai_analysis.get("risk_level", "unknown"),
                "violations_found": len(pattern_matches),
                "ai_analysis": ai_analysis,
                "pattern_matches": match_dicts
            }

            self._send_response(200, response)

        except Exception as e:
            self._send_error(500, str(e))

    def do_GET(self):
        if self.path == "/health":
            self._send_response(200, {"status": "healthy"})
        else:
            self._send_error(404, "Not found")

    def _send_response(self, status_code: int, data: dict):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_error(self, status_code: int, message: str):
        self._send_response(status_code, {"error": message})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()


handler = Handler
