package com.auditguard.parser;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ScanRequest {

    @NotNull
    @NotBlank(message = "Content is required")
    private String content;

    @NotNull
    @NotBlank(message = "Source identifier is required")
    private String source;

    private String orgId;

    public ScanRequest() {}

    public ScanRequest(String content, String source) {
        this.content = content;
        this.source = source;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }
}
