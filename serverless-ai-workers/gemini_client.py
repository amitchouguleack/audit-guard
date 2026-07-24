import os
from typing import Dict, Any

import google.generativeai as genai


def configure_gemini():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is required")

    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-pro")


def analyze_compliance(content: str, pattern_matches: list) -> Dict[str, Any]:
    model = configure_gemini()

    match_summary = "\n".join(
        f"- {m['type']}: {m['severity']} severity at offset {m['start']}-{m['end']}"
        for m in pattern_matches
    ) if pattern_matches else "No regex matches found"

    prompt = f"""Analyze the following text for compliance risks. Consider:

1. PII exposure (SSN, email, phone, addresses)
2. Credential leakage (passwords, API keys, tokens)
3. Regulatory violations (GDPR, HIPAA, PCI-DSS)
4. Data sensitivity levels

Text to analyze:
---
{content[:2000]}
---

Regex pattern matches already detected:
{match_summary}

Provide a JSON response with:
- risk_score: integer 0-100 (0=safe, 100=critical risk)
- risk_level: "low", "medium", "high", or "critical"
- findings: array of {category, description, severity, recommendation}
- summary: one-paragraph executive summary
- compliance_issues: array of potential regulatory violations found"""

    try:
        response = model.generate_content(prompt)
        import json
        return json.loads(response.text)
    except Exception as e:
        return {
            "risk_score": 50,
            "risk_level": "unknown",
            "findings": [],
            "summary": f"AI analysis failed: {str(e)}. Manual review recommended.",
            "compliance_issues": []
        }


def generate_remediation(violations: list) -> Dict[str, str]:
    model = configure_gemini()

    violation_summary = "\n".join(
        f"- {v['type']} ({v['severity']}): {v['content'][:50]}..."
        for v in violations
    )

    prompt = f"""Based on these compliance violations, provide remediation steps:

{violation_summary}

Return a JSON object with:
- immediate_actions: array of strings for immediate fixes
- long_term_recommendations: array of strings for process improvements
- compliance_checklist: array of strings for verification steps"""

    try:
        response = model.generate_content(prompt)
        import json
        return json.loads(response.text)
    except Exception as e:
        return {
            "immediate_actions": ["Manual review required"],
            "long_term_recommendations": [],
            "compliance_checklist": []
        }
