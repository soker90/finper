# AGENTS — `@soker90/finper-bot`

Bot de Telegram desplegado como **Cloudflare Worker** (edge, serverless). Recibe fotos de tickets o texto, extrae datos con **Gemini Vision**, los almacena en **Cloudflare D1** (SQLite) e imágenes en **Cloudflare R2**, y expone una REST API para que `finper-api` los consuma.

> Este paquete NO usa Node.js, MongoDB ni Express. El runtime es el de Cloudflare Workers.

---

## Reglas críticas

1. **Cloudflare Worker, no Node**: no uses APIs de Node (`fs`, `path`, `process`). El runtime es `workerd` — solo Web APIs + bindings de Cloudflare.
2. **`wrangler` gestiona el ciclo de vida**: dev local con `wrangler dev`, deploy con `wrangler deploy`.
3. **Secrets via `wrangler secret put`**, nunca en `.env` ni en `wrangler.toml`. Los 5 secrets requeridos son: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_SECRET_TOKEN`, `TELEGRAM_ADMIN_USER_ID`, `GEMINI_API_KEY`, `API_SECRET_KEY`.
4. **D1 y R2 son bindings de Cloudflare**: se acceden via el objeto `Env` que Hono inyecta en el contexto (`c.env.DB`, `c.env.TICKET_IMAGES`). No son instancias de ninguna librería.
5. **Sin tests**: no hay configuración de test framework. No añadir Jest ni Vitest sin aprobación explícita.
6. **ESLint flat config** (`eslint.config.mjs`) basado en `neostandard` + `@typescript-eslint`. Sin `.eslintrc`.
7. **`wrangler.toml`** declara el nombre del worker, el entrypoint, y los bindings a D1 y R2. Al renombrar recursos de Cloudflare, actualizar este archivo.

---

## Estructura

```
src/
  index.ts          — Entrypoint. Router Hono con las 5 rutas
  types.ts          — Tipos: Ticket, GeminiExtraction, Env, tipos de Telegram
  utils.ts          — generateId() usando crypto.randomUUID()
  handlers/
    telegram.ts     — Webhook de Telegram (whitelist, admin cmds, fotos/texto)
    api.ts          — REST handlers para finper-api (list, review, delete)
  middleware/
    auth.ts         — apiKeyMiddleware: valida X-API-Key en /api/*
  services/
    gemini.ts       — extractReceiptData (imagen) y extractExpenseFromText (texto)
    telegram.ts     — downloadTelegramPhoto y sendTelegramMessage
    r2.ts           — uploadToR2 y getR2Key
  db/
    tickets.ts      — CRUD de tickets en D1
    users.ts        — Whitelist de usuarios de Telegram en D1
scripts/
  setup-webhook.ts  — Registra el webhook con la API de Telegram (tsx)
schema.sql          — DDL de las tablas tickets y allowed_users para D1
wrangler.toml       — Configuración del Cloudflare Worker
```

---

## Rutas HTTP

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/webhook` | Updates de Telegram (valida `X-Telegram-Bot-Api-Secret-Token`) |
| `GET` | `/images/*` | Sirve imágenes desde R2 |
| `GET` | `/api/tickets?status=` | Lista tickets (`pending`/`reviewed`/`all`). Requiere `X-API-Key` |
| `PATCH` | `/api/tickets/:id` | Marca ticket como revisado. Requiere `X-API-Key` |
| `DELETE` | `/api/tickets/:id` | Elimina ticket de D1 y R2. Requiere `X-API-Key` |
| `GET` | `/health` | Health check |

---

## Comandos

```bash
make start-bot          # wrangler dev (local)
make deploy-bot         # wrangler deploy (Cloudflare)
make lint-bot           # ESLint
make type-check-bot     # tsc --noEmit

# Migraciones D1
pnpm --filter @soker90/finper-bot db:migrate:local
pnpm --filter @soker90/finper-bot db:migrate:remote

# Registrar webhook de Telegram
pnpm --filter @soker90/finper-bot setup:webhook
```

---

## Checklist: añadir una ruta nueva

1. Añadir handler en `src/handlers/` o inline en `src/index.ts` si es trivial.
2. Si accede a D1: añadir función en `src/db/tickets.ts` o `src/db/users.ts`.
3. Si accede a R2: añadir función en `src/services/r2.ts`.
4. Si requiere autenticación de `finper-api`: pasar por `apiKeyMiddleware`.
5. Registrar la ruta en `src/index.ts`.
6. Ejecutar `make lint-bot` y `make type-check-bot` antes de hacer commit.
