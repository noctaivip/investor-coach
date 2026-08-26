# Production monitoring — v9.1

Backend предоставляет:

- `GET /healthz` — процесс Worker отвечает; не проверяет внешние зависимости.
- `GET /readyz` — проверяет D1 и наличие `OPENAI_API_KEY`; возвращает HTTP 503, если критический компонент не готов.

Рекомендуемый production monitor:
- `/healthz`: каждые 1–5 минут;
- `/readyz`: каждые 5 минут;
- alert после нескольких последовательных ошибок, а не после единичного timeout;
- отдельный synthetic test login/SSO в staging;
- Cloudflare Worker logs/analytics с request IDs и alerting по 5xx.

Health endpoints не возвращают секреты, пользовательские данные или конфигурацию IdP.
