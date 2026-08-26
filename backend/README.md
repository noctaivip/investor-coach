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


## v8.6 — Manager Dashboard

Дополнительные Corporate API:

- `GET /api/account/dashboard` — фактические cohort KPI для admin/manager.
- `GET /api/account/assignments` — назначения организации; learner видит только свои.
- `POST /api/account/assignments` — назначить программу 7/30/365 дней, deadline и target score.
- `GET /api/account/audit` — последние 50 audit events, только admin.

Если D1 была создана в v8.5, примените:

```bash
npx wrangler d1 execute investor-coach-production --remote --file=./migrations/0002_assignments_dashboard.sql
```


## v8.7 — RBAC, Audit, SSO-ready

Добавлен серверный RBAC:

- `admin`: роли, завершение пользовательских сессий, manager/learner invites, dashboard, assignments, audit, SSO configuration;
- `manager`: team view, learner invites, dashboard, assignments;
- `learner`: собственный progress и assignments.

Новые API:

- `POST /api/account/team/role` — admin меняет `learner ↔ manager`;
- `POST /api/account/team/revoke-sessions` — admin завершает активные сессии сотрудника;
- `GET /api/account/audit` — audit trail, только admin;
- `GET/POST /api/account/sso` — metadata-конфигурация OIDC, только admin.

SSO metadata **не содержит client secret**. Секрет конкретного Identity Provider должен храниться только как Cloudflare Worker secret. Эта версия создаёт безопасный configuration/RBAC foundation; фактический OIDC redirect/callback flow подключается следующим deployment-слоем.

Если база была создана до v8.7:

```bash
npx wrangler d1 execute investor-coach-production --remote --file=./migrations/0003_rbac_audit_sso.sql
```


## v8.8 — реальный OIDC SSO + PKCE

Реализован Authorization Code flow с PKCE. Worker проверяет OIDC discovery, `state`, `nonce`, подпись `id_token` по JWKS (RS256), `iss`, `aud`, `exp`, email domain и `email_verified`. Новый сотрудник автоматически provision-ится как `learner`.

Session token не помещается в URL. После callback сайт получает только одноразовый exchange-code со сроком 2 минуты и сразу меняет его на серверную session.

Для confidential OIDC client задайте Worker secret `OIDC_CLIENT_SECRETS_JSON` как JSON map `client_id -> client_secret`. IdP secret не хранится в D1/frontend.

Для существующей базы:

```bash
npx wrangler d1 execute investor-coach-production --remote --file=./migrations/0004_oidc_pkce.sql
```

Текущая проверка подписи ID Token поддерживает `RS256`; перед enterprise deployment проверьте алгоритм конкретного IdP.


## v8.9 — SCIM 2.0 provisioning

Добавлено автоматическое provisioning/deprovisioning сотрудников через SCIM:

- `GET /scim/v2/ServiceProviderConfig`
- `GET /scim/v2/Schemas`
- `GET /scim/v2/Users`
- `GET /scim/v2/Users/{id}`
- `POST /scim/v2/Users`
- `PATCH /scim/v2/Users/{id}`
- `DELETE /scim/v2/Users/{id}` (деактивация)
- filter `userName eq "email@company.com"`

Admin создаёт bearer token в разделе «Компания → SCIM provisioning». Raw token показывается один раз; D1 хранит только SHA-256 hash. Деактивация через SCIM немедленно завершает server sessions пользователя. SCIM не может менять/деактивировать organization admin.

Для базы v8.8:

```bash
npx wrangler d1 execute investor-coach-production --remote --file=./migrations/0005_scim_provisioning.sql
```


## v9.0 — Reporting

- `GET /api/account/reports/summary` — JSON отчет для admin/manager.
- `GET /api/account/reports/export?type=learners` — employee outcomes CSV.
- `GET /api/account/reports/export?type=assignments` — assignment CSV.
- `GET /api/account/reports/export?type=audit` — audit CSV, admin only.

Report exports are written to the audit trail.
