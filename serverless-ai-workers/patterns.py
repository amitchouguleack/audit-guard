import re
from dataclasses import dataclass
from typing import List, Tuple


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
    "pii_ssn_no_dash": {
        "pattern": r"\b\d{9}\b",
        "severity": "high",
        "description": "SSN without dashes"
    },
    "pii_email": {
        "pattern": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
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
        "critical": 40,
        "high": 25,
        "medium": 15,
        "low": 5
    }

    score = 0
    for match in matches:
        score += severity_weights.get(match.severity, 0)

    return min(score, 100)
