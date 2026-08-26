# Investor Coach backend — AI + Corporate Cloud

Backend рассчитан на Cloudflare Workers + D1. API-ключ OpenAI хранится только в Worker secret.

## 1. Установка

```bash
cd backend
npm install
npx wrangler login
```

## 2. Создать D1

```bash
npx wrangler d1 create investor-coach-production
```

Скопируйте полученный `database_id` в `wrangler.toml` вместо `REPLACE_WITH_D1_DATABASE_ID`.

## 3. Создать таблицы

```bash
npx wrangler d1 execute investor-coach-production --remote --file=./schema.sql
```

## 4. Добавить OpenAI secret

```bash
npx wrangler secret put OPENAI_API_KEY
```

## 5. Deploy

```bash
npm run deploy
```

Скопируйте HTTPS URL Worker в `../config.js` → `apiBase` и опубликуйте frontend заново.

## Corporate API

- `POST /api/account/register-org` — создать организацию и администратора.
- `POST /api/account/login` — вход.
- `GET /api/account/me` — текущая сессия.
- `GET/POST /api/account/state` — загрузить/сохранить учебный прогресс.
- `POST /api/account/invite` — одноразовый код приглашения на 7 дней.
- `POST /api/account/join` — регистрация сотрудника по коду.
- `GET /api/account/team` — команда для admin/manager.
- `POST /api/account/logout` — завершить сессию.

Пароли хешируются PBKDF2-SHA256 (210 000 итераций + уникальная соль). В базе хранится только SHA-256 hash session token, а не сам bearer token.

## Важно перед enterprise production

Для крупного корпоративного deployment следующим слоем нужны SSO (SAML/OIDC), SCIM, audit log, formal retention policy, monitoring/alerts и security review. Текущий слой предназначен для реального корпоративного pilot, а не заявляет готовность к procurement крупной публичной компании.
