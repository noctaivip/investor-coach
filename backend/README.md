# Production AI backend

Этот backend нужен потому, что API-ключ нельзя помещать в публичный GitHub Pages JavaScript.

## Deploy (Cloudflare Workers)

```bash
cd backend
npm install
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npm run deploy
```

Команда `deploy` напечатает HTTPS URL вида `https://investor-coach-ai.<account>.workers.dev`. Вставьте его в `config.js` в `apiBase` или один раз в поле **Подключить production AI** внутри приложения.

Секрет `OPENAI_API_KEY` хранится только в Worker. Никогда не добавляйте его в GitHub.

Endpoints: `POST /api/transcribe` и `POST /api/coach`. CORS ограничен `guidoss.com`, `www.guidoss.com` и локальным `localhost:8080`.
