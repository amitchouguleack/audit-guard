package com.auditguard.parser;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ScanController {

    private final NativeScanner scanner;

    public ScanController() {
        this.scanner = new NativeScanner();
    }

    @PostMapping("/scan")
    public ResponseEntity<?> scan(@Valid @RequestBody ScanRequest request) {
        try {
            long startTime = System.currentTimeMillis();

            var results = scanner.scan(request.getContent());

            long scanTime = System.currentTimeMillis() - startTime;

            ScanResponse response = ScanResponse.success(
                results,
                request.getSource(),
                scanTime
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Scan failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "healthy");
        status.put("scanner", scanner != null ? "initialized" : "failed");
        return ResponseEntity.ok(status);
    }

    @GetMapping("/patterns")
    public ResponseEntity<Map<String, Object>> patterns() {
        Map<String, Object> info = new HashMap<>();
        info.put("patterns", new String[]{
            "pii_ssn", "pii_email", "pii_phone",
            "credential_password", "credential_bearer", "credential_api_key"
        });
        info.put("version", "1.0.0");
        info.put("native", "C++20 Pattern Matcher");
        return ResponseEntity.ok(info);
    }
}
