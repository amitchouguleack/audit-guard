# Audit Guard Ingestion SDK

Portable data interception mechanism for compliance analysis.

## Browser SDK Usage

### Basic Usage

```html
<script src="audit-guard.js"></script>
<script>
  const guard = new AuditGuard({
    endpoint: 'https://your-project.supabase.co/functions/v1/ingest',
    apiKey: 'your-api-key',
    orgId: 'your-org-id'
  });

  // Track arbitrary data
  guard.track({ username: 'user@example.com', action: 'login' });

  // Track form submissions
  const form = document.getElementById('my-form');
  guard.trackForm(form, {
    excludeFields: ['csrf_token'],
    preventDefault: false
  });
</script>
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | string | `''` | Serverless function URL |
| `apiKey` | string | `''` | Your organization's API key |
| `orgId` | string | `''` | Organization identifier |
| `batchSize` | number | `10` | Entries before auto-flush |
| `flushInterval` | number | `5000` | Auto-flush interval (ms) |
| `debug` | boolean | `false` | Enable console logging |

## Chrome Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `injected-sdk-extension` directory

### Extension Configuration

1. Click the Audit Guard icon in the toolbar
2. Enter your endpoint, API key, and organization ID
3. Click "Save Configuration"

The extension will automatically intercept form submissions and network requests.

## Security Notes

- Sensitive field names (passwords, tokens, etc.) are automatically detected
- Form data is sanitized before transmission
- All requests include version and organization headers
- Use HTTPS endpoints only in production
