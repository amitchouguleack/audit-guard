import json
from http.server import BaseHTTPRequestHandler

from patterns import scan_content, analyze_risk


class Handler(BaseHTTPRequestHandler):

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            request_data = json.loads(body)

            content = request_data.get("content", "")
            source = request_data.get("source", "unknown")

            if not content:
                self._send_error(400, "Content is required")
                return

            matches = scan_content(content)
            analysis = analyze_risk(content, matches)

            response = {
                "status": "completed",
                "source": source,
                "risk_score": analysis["risk_score"],
                "risk_level": analysis["risk_level"],
                "violations_found": analysis["violations_found"],
                "unique_violation_types": analysis["unique_violation_types"],
                "content_stats": analysis["content_stats"],
                "findings": analysis["findings"]
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
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_error(self, status_code: int, message: str):
        self._send_response(status_code, {"error": message})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


handler = Handler
