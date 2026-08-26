# Investor Coach — Observability & Rate Limiting v9.2

Every backend response receives `X-Request-Id`. Structured JSON logs include request ID, method, route, status, duration, Origin, Cloudflare colo when available, and timestamp. Logs intentionally exclude request bodies, passwords, bearer tokens, audio and AI transcripts.

JSON errors preserve the existing `error` field for frontend compatibility and add `error_code`, `request_id` and a readable `message`.

Application rate limits:
- auth/register/join/SSO exchange: 20 / 10 minutes per IP
- SSO start: 30 / 10 minutes per IP
- transcription: 60 / hour per IP
- AI coach: 120 / hour per IP
- SCIM: 600 / 5 minutes per SCIM token

For large enterprise deployments, also configure Cloudflare WAF/rate-limiting and alerts for `/readyz`, 5xx, latency, D1 failures and upstream AI errors.
