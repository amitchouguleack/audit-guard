# B2B Compliance Gateway

A serverless, polyglot enterprise compliance gateway that detects PII, credentials, and regulatory exposures in log data using AI-powered analytics.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Frontend        │  │  Ingestion SDK   │  │  Local Parser    │  │
│  │  (Next.js 14)    │  │  (Vanilla JS)    │  │  (Java + C++)    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
└───────────┼──────────────────────┼──────────────────────┼───────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌───────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│   Supabase Auth   │  │  Serverless Edge   │  │  JNI Native Core  │
│   + PostgreSQL    │◄─┤  (Python/Vercel)   │  │  (C++ Scanner)    │
│   + RLS Policies  │  │  + Gemini AI API   │  │  JNI FFM Bridge   │
└───────────────────┘  └────────────────────┘  └────────────────────┘
```

## Modules

| Module | Stack | Location |
|--------|-------|----------|
| Database Layer | PostgreSQL, SQL, RLS | `/database-migrations` |
| AI Analytics | Python 3.11, Vercel Edge, Gemini | `/serverless-ai-workers` |
| Native Parser | Java 21, Spring Boot, C++20 | `/local-enterprise-parser` |
| Dashboard | Next.js 14, TypeScript, Tailwind | `/frontend-dashboard` |
| Ingestion SDK | Vanilla JavaScript | `/injected-sdk-extension` |

## Quick Start

### 1. Database Setup

Run migrations in your Supabase SQL editor in order:

```bash
# Run each file in database-migrations/ sequentially
001_create_schema.sql
002_rls_policies.sql
003_api_functions.sql
004_webhooks.sql
```

### 2. Serverless AI Workers

```bash
cd serverless-ai-workers
pip install -r requirements.txt
# Set environment variables:
#   SUPABASE_URL=https://your-project.supabase.co
#   SUPABASE_KEY=your-anon-key
#   GEMINI_API_KEY=your-gemini-key
vercel dev
```

### 3. Local Enterprise Parser

```bash
cd local-enterprise-parser
# Build C++ native library first
cd native-core && ./build.sh

# Build and run Java app
cd ..
./mvnw spring-boot:run
```

### 4. Frontend Dashboard

```bash
cd frontend-dashboard
npm install
# Set environment variables:
#   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
npm run dev
```

### 5. Ingestion SDK

```javascript
import AuditGuard from './injected-sdk-extension/audit-guard.js';

const guard = new AuditGuard({
  endpoint: 'https://your-project.supabase.co/functions/v1/ingest',
  apiKey: 'your-api-key',
  orgId: 'your-org-id'
});

guard.track(data); // Sends to serverless analysis pipeline
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_KEY` | Supabase anon/service key | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase URL for frontend | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key for frontend | Yes |

## Security Model

- **Row-Level Security**: All queries scoped to organization via JWT claims
- **API Key Validation**: HMAC SHA-256 hashing for server-to-server auth
- **No Secrets in Code**: All credentials via environment variables
- **Input Sanitization**: All ingestion payloads validated before processing

## License

Proprietary - Internal Use Only
