package com.auditguard.parser;

import java.util.List;
import java.util.ArrayList;

public class ScanResponse {

    private String status;
    private int totalMatches;
    private int riskScore;
    private List<MatchDetail> matches;
    private String source;
    private long scanTimeMs;

    public ScanResponse() {
        this.matches = new ArrayList<>();
    }

    public static ScanResponse success(List<NativeScanner.ScanResult> results, String source, long scanTimeMs) {
        ScanResponse response = new ScanResponse();
        response.status = "completed";
        response.source = source;
        response.scanTimeMs = scanTimeMs;
        response.totalMatches = results.size();

        for (NativeScanner.ScanResult result : results) {
            MatchDetail detail = new MatchDetail();
            detail.patternType = result.patternType;
            detail.severity = result.severity;
            detail.matchedText = result.matchedText;
            detail.startOffset = result.startOffset;
            detail.endOffset = result.endOffset;
            response.matches.add(detail);
        }

        response.riskScore = calculateRiskScore(results);
        return response;
    }

    private static int calculateRiskScore(List<NativeScanner.ScanResult> results) {
        int score = 0;
        for (NativeScanner.ScanResult result : results) {
            switch (result.severity) {
                case "critical" -> score += 40;
                case "high" -> score += 25;
                case "medium" -> score += 15;
                case "low" -> score += 5;
            }
        }
        return Math.min(score, 100);
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getTotalMatches() {
        return totalMatches;
    }

    public void setTotalMatches(int totalMatches) {
        this.totalMatches = totalMatches;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public List<MatchDetail> getMatches() {
        return matches;
    }

    public void setMatches(List<MatchDetail> matches) {
        this.matches = matches;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public long getScanTimeMs() {
        return scanTimeMs;
    }

    public void setScanTimeMs(long scanTimeMs) {
        this.scanTimeMs = scanTimeMs;
    }

    public static class MatchDetail {
        public String patternType;
        public String severity;
        public String matchedText;
        public int startOffset;
        public int endOffset;
    }
}
