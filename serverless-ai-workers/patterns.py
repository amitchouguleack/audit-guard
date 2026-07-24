import re
from dataclasses import dataclass
from typing import List


@dataclass
class PatternMatch:
    pattern_type: str
    severity: str
    matched_text: str
    start_offset: int
    end_offset: int


PATTERNS = {
    "pii_ssn": {
        "pattern": r"\b\d{3}-\d{2}-\d{4}\b",
        "severity": "critical",
        "description": "Social Security Number"
    },
    "pii_email": {
        "pattern": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        "severity": "medium",
        "description": "Email address"
    },
    "pii_phone": {
        "pattern": r"\b(?:\+1)?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
        "severity": "low",
        "description": "Phone number"
    },
    "credential_password": {
        "pattern": r"(?i)(?:password|passwd|pwd)\s*[:=]\s*\S+",
        "severity": "critical",
        "description": "Password in plaintext"
    },
    "credential_bearer": {
        "pattern": r"(?i)bearer\s+[A-Za-z0-9\-._~+/]+=*",
        "severity": "critical",
        "description": "Bearer token"
    },
    "credential_api_key": {
        "pattern": r"(?i)(?:api[_-]?key|apikey)\s*[:=]\s*['\"]?[A-Za-z0-9\-._]{20,}['\"]?",
        "severity": "high",
        "description": "API key"
    },
    "credential_private_key": {
        "pattern": r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----",
        "severity": "critical",
        "description": "Private key header"
    },
    "pii_credit_card": {
        "pattern": r"\b(?:\d[ -]*?){13,16}\b",
        "severity": "high",
        "description": "Credit card number"
    }
}


def scan_content(content: str) -> List[PatternMatch]:
    matches = []

    for pattern_name, pattern_config in PATTERNS.items():
        regex = re.compile(pattern_config["pattern"])

        for match in regex.finditer(content):
            matches.append(
                PatternMatch(
                    pattern_type=pattern_name,
                    severity=pattern_config["severity"],
                    matched_text=match.group(),
                    start_offset=match.start(),
                    end_offset=match.end()
                )
            )

    matches.sort(key=lambda m: m.start_offset)
    return matches


def calculate_risk_score(matches: List[PatternMatch]) -> int:
    if not matches:
        return 0

    severity_weights = {
        "critical": 35,
        "high": 20,
        "medium": 10,
        "low": 5
    }

    score = 0
    seen_types = set()

    for match in matches:
        weight = severity_weights.get(match.severity, 0)
        if match.pattern_type not in seen_types:
            score += weight
            seen_types.add(match.pattern_type)
        else:
            score += weight // 2

    return min(score, 100)


def analyze_risk(content: str, matches: List[PatternMatch]) -> dict:
    risk_score = calculate_risk_score(matches)

    if risk_score < 15:
        risk_level = "low"
    elif risk_score < 40:
        risk_level = "medium"
    elif risk_score < 70:
        risk_level = "high"
    else:
        risk_level = "critical"

    findings = []
    for match in matches:
        findings.append({
            "type": match.pattern_type,
            "severity": match.severity,
            "matched": match.matched_text[:50],
            "offset": match.start_offset
        })

    content_length = len(content)
    word_count = len(content.split())

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "violations_found": len(matches),
        "unique_violation_types": len(set(m.pattern_type for m in matches)),
        "content_stats": {
            "characters": content_length,
            "words": word_count
        },
        "findings": findings
    }
