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


## Professional Simulator v11

AI Coach returns a structured professional rubric for every evaluated spoken answer:
`directness`, `clarity`, `evidence`, `metrics`, `terminology`, `risk_handling`, `structure`.

Investor Simulator supports adaptive follow-up questions, contradiction detection, a meeting summary and a recommended next drill. Default reasoning model remains configurable through `COACH_MODEL`; transcription remains configurable through `TRANSCRIBE_MODEL`.
