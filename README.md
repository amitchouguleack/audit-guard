# B2B Compliance Gateway

A fully serverless enterprise compliance gateway that detects PII, credentials, and regulatory exposures in log data using AI-powered analytics.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT LAYER                       │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │  Frontend        │  │  Ingestion SDK            │ │
│  │  (Next.js 14)    │  │  (Vanilla JS / Extension) │ │
│  └────────┬─────────┘  └────────────┬─────────────┘ │
└───────────┼──────────────────────────┼───────────────┘
            │                          │
            ▼                          ▼
┌───────────────────┐  ┌────────────────────────────┐
│   Supabase Auth   │  │  Vercel Serverless Edge     │
│   + PostgreSQL    │◄─┤  • /api/ingest (AI)         │
│   + RLS Policies  │  │  • /api/scan (Bulk Scan)    │
└───────────────────┘  │  + Gemini AI API            │
                       └────────────────────────────┘
```

## Modules

| Module | Stack | Location |
|--------|-------|----------|
| Database Layer | PostgreSQL, SQL, RLS | `/database-migrations` |
| Serverless Workers | Python 3.11, Vercel, Gemini AI | `/serverless-ai-workers` |
| Dashboard | Next.js 14, TypeScript, Tailwind | `/frontend-dashboard` |
| Ingestion SDK | Vanilla JavaScript | `/injected-sdk-extension` |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ingest` | POST | Single log ingestion + AI analysis |
| `/api/scan` | POST | Bulk content scanning (regex only) |
| `/health` | GET | Health check |

### POST /api/ingest

```json
{
  "api_key": "your-org-api-key",
  "content": "text to analyze",
  "source": "form-submission"
}
```

### POST /api/scan

```json
{
  "content": "entry1\n---\nentry2\n---\nentry3",
  "source": "bulk-upload"
}
```

## Quick Start

### 1. Database Setup

Run migrations in your Supabase SQL editor in order:

```sql
001_create_schema.sql
002_rls_policies.sql
003_api_functions.sql
004_webhooks.sql
```

### 2. Deploy Serverless Workers

```bash
cd serverless-ai-workers
pip install -r requirements.txt
# Set env vars in Vercel dashboard
vercel --prod
```

### 3. Deploy Frontend Dashboard

```bash
cd frontend-dashboard
npm install
# Set env vars in Vercel dashboard
vercel --prod
```

### 4. Use the SDK

```html
<script src="injected-sdk-extension/audit-guard.js"></script>
<script>
  const guard = new AuditGuard({
    endpoint: 'https://your-deployment.vercel.app/api/ingest',
    apiKey: 'your-api-key',
    orgId: 'your-org-id'
  });
  guard.track({ action: 'login', user: 'admin@corp.com' });
</script>
```

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | Serverless | Supabase project URL |
| `SUPABASE_KEY` | Serverless | Supabase service_role key |
| `GEMINI_API_KEY` | Serverless | Google Gemini API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard | Public Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard | Public anon key |

## Security Model

- **Row-Level Security**: All queries scoped to organization via JWT claims
- **API Key Validation**: HMAC SHA-256 hashing for server-to-server auth
- **No Secrets in Code**: All credentials via environment variables
- **Input Sanitization**: All ingestion payloads validated before processing
- **$0 Infrastructure**: Runs entirely on Vercel free tier + Supabase free tier
