# Investor Coach AI Backend

Cloudflare Worker for:
- `/api/transcribe` — accurate speech transcription;
- `/api/coach` — AI feedback for Coach, Pitch and investor simulation.

Required secret:

```bash
npx wrangler secret put OPENAI_API_KEY
```

Set `ALLOWED_ORIGINS` to your production site.

Health:
- `GET /healthz`
- `GET /readyz`
