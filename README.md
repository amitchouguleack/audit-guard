# B2B Compliance Gateway

Fully serverless compliance scanner. Zero external services, zero setup. Deploy to Vercel and it works.

## What It Does

Scans text for:
- **PII**: SSNs, emails, phone numbers, credit cards
- **Credentials**: Passwords, API keys, bearer tokens, private keys

Returns a risk score (0-100) and detailed findings.

## Architecture

```
┌──────────────────┐      ┌─────────────────────────┐
│  Frontend        │─────▶│  Vercel Serverless       │
│  (Next.js 14)    │      │  /api/ingest (analysis)  │
│                  │      │  /api/scan  (bulk)       │
└──────────────────┘      └─────────────────────────┘
```

No database. No auth service. No AI API. Just regex pattern matching and risk scoring.

## Deploy

```bash
# 1. Push to GitHub
# 2. Import on vercel.com
# 3. Done. No env vars needed.
```

Or locally:

```bash
cd serverless-ai-workers
pip install -r requirements.txt
vercel dev

cd ../frontend-dashboard
npm install
npm run dev
```

## API

### POST /api/ingest

Single content analysis with risk scoring.

```json
{
  "content": "My SSN is 123-45-6789 and password=secret123",
  "source": "form-submission"
}
```

Response:
```json
{
  "status": "completed",
  "risk_score": 70,
  "risk_level": "high",
  "violations_found": 2,
  "findings": [
    {"type": "pii_ssn", "severity": "critical", "matched": "123-45-6789"},
    {"type": "credential_password", "severity": "critical", "matched": "password=secret123"}
  ]
}
```

### POST /api/scan

Bulk scan multiple entries (separated by `---`).

```json
{
  "content": "entry 1\n---\nentry 2\n---\nentry 3",
  "source": "bulk-upload"
}
```

### GET /health

Returns `{"status": "healthy"}`.

## SDK

```html
<script src="injected-sdk-extension/audit-guard.js"></script>
<script>
  const guard = new AuditGuard({
    endpoint: 'https://your-app.vercel.app/api/ingest'
  });
  guard.track({ email: 'user@example.com', action: 'login' });
</script>
```

## Detection Patterns

| Pattern | Severity | Regex |
|---------|----------|-------|
| SSN | Critical | `\d{3}-\d{2}-\d{4}` |
| Email | Medium | `user@domain.com` |
| Phone | Low | `+1 (555) 123-4567` |
| Password | Critical | `password=...` |
| Bearer Token | Critical | `Bearer eyJ...` |
| API Key | High | `api_key=...` |
| Private Key | Critical | `-----BEGIN PRIVATE KEY-----` |
| Credit Card | High | `16-digit numbers` |

## Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Python serverless functions on Vercel
- **Pattern Engine**: Python regex with risk scoring
- **Infrastructure**: $0 (Vercel free tier)
