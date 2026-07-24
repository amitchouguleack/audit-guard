import json
from http.server import BaseHTTPRequestHandler

from patterns import scan_content, calculate_risk_score


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

            entries = [e.strip() for e in content.split("---") if e.strip()]

            results = []
            for entry in entries:
                matches = scan_content(entry)
                risk_score = calculate_risk_score(matches)

                results.append({
                    "risk_score": risk_score,
                    "violations": len(matches),
                    "matches": [
                        {
                            "type": m.pattern_type,
                            "severity": m.severity,
                            "content": m.matched_text[:50],
                            "offset": m.start_offset
                        }
                        for m in matches
                    ]
                })

            total_violations = sum(r["violations"] for r in results)
            avg_score = (
                sum(r["risk_score"] for r in results) / len(results)
                if results else 0
            )

            response = {
                "status": "completed",
                "source": source,
                "entries_scanned": len(results),
                "total_violations": total_violations,
                "average_risk_score": round(avg_score, 2),
                "results": results
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
