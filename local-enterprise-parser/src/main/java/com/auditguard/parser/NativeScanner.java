package com.auditguard.parser;

import java.util.ArrayList;
import java.util.List;

public class NativeScanner {

    private long nativeHandle;
    private boolean initialized = false;

    static {
        String libraryName = System.mapLibraryName("native_core");
        try {
            System.loadLibrary("native_core");
        } catch (UnsatisfiedLinkError e) {
            System.err.println("Warning: Native library not loaded. Falling back to Java implementation.");
            System.err.println("To use native scanner, compile the C++ library first.");
        }
    }

    public NativeScanner() {
        try {
            nativeHandle = createScanner();
            initialized = true;
        } catch (UnsatisfiedLinkError e) {
            initialized = false;
        }
    }

    public List<ScanResult> scan(String content) {
        if (!initialized || content == null || content.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            byte[] bytes = content.getBytes();
            long[] resultHandle = new long[1];
            int count = scanContent(nativeHandle, bytes, bytes.length, resultHandle);

            List<ScanResult> results = new ArrayList<>();
            if (count > 0 && resultHandle[0] != 0) {
                for (int i = 0; i < count; i++) {
                    ScanResult result = extractResult(resultHandle[0], i);
                    results.add(result);
                }
                freeResults(resultHandle[0], count);
            }

            return results;
        } catch (UnsatisfiedLinkError e) {
            return scanWithJava(content);
        }
    }

    private List<ScanResult> scanWithJava(String content) {
        List<ScanResult> results = new ArrayList<>();

        String[][] patterns = {
            {"pii_ssn", "\\b\\d{3}-\\d{2}-\\d{4}\\b", "critical"},
            {"pii_email", "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b", "medium"},
            {"credential_password", "(?i)(?:password|passwd|pwd)\\s*[:=]\\s*\\S+", "critical"},
            {"credential_bearer", "(?i)bearer\\s+[A-Za-z0-9\\-._~+/]+=*", "critical"}
        };

        for (String[] pattern : patterns) {
            try {
                java.util.regex.Pattern regex = java.util.regex.Pattern.compile(pattern[1]);
                java.util.regex.Matcher matcher = regex.matcher(content);

                while (matcher.find()) {
                    ScanResult result = new ScanResult();
                    result.patternType = pattern[0];
                    result.severity = pattern[2];
                    result.matchedText = matcher.group();
                    result.startOffset = matcher.start();
                    result.endOffset = matcher.end();
                    results.add(result);
                }
            } catch (java.util.regex.PatternSyntaxException e) {
                continue;
            }
        }

        return results;
    }

    public void close() {
        if (initialized && nativeHandle != 0) {
            destroyScanner(nativeHandle);
            nativeHandle = 0;
            initialized = false;
        }
    }

    private static class ScanResult {
        String patternType;
        String severity;
        String matchedText;
        int startOffset;
        int endOffset;

        @Override
        public String toString() {
            return String.format("[%s] %s at %d-%d: %s",
                severity, patternType, startOffset, endOffset, matchedText);
        }
    }

    // Native methods
    private native long createScanner();
    private native void destroyScanner(long handle);
    private native int scanContent(long handle, byte[] content, int length, long[] resultHandle);
    private native void freeResults(long handle, int count);
    private native ScanResult extractResult(long handle, int index);
}
