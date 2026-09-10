# AGENTS

### Rules for AI assistants and contributors

- **Use pnpm instead of npm**
- **Never use `^` or `~`** in dependency version specifiers. Always pin exact versions.
- **Always commit the lockfile** (`pnpm-lock.yaml`). Never delete it or add it to `.gitignore`.
- **Install scripts are disabled**. If a new dependency requires a build step, it must be explicitly approved.
- **New package versions must be at least 1 day old** before they can be installed (release age gating is enabled).
- When adding a dependency, verify it on [npmjs.com](https://www.npmjs.com) before installing.
- Prefer well-maintained packages with verified publishers and provenance.
- Run `pnpm install` with the lockfile present — never bypass it.
- Do not add git-based or tarball URL dependencies unless explicitly approved.
- **Do not run `npm update`**, `npx npm-check-updates`, or any blind upgrade command. Review each update individually.
- **Use deterministic installs**: prefer `pnpm install --frozen-lockfile` over `pnpm install` in CI and scripts.
- **Always communicate in Spanish**: You must answer, explain, and summarize all your work strictily in conversational Spanish.
- **Code and variables in English**: all variable names, function names, comments, and code must be written in English.
- **Descriptive variable names**: never use single letters (like `a`, `b`, `x`, `i`, `j`) as variable names except for well-known loop counters (`i`, `j`, `k`). Always use descriptive, self-explanatory names.
- **Object params for functions with more than two parameters**: when a function requires more than two parameters, pass them as a single named object instead of positional arguments. This improves readability and avoids argument-order mistakes.

---

## Monorepo structure

```
packages/
  db/       @soker90/finper-db      — SQLite database schema and Drizzle ORM
  types/    @soker90/finper-types   — Shared types
  api/      @soker90/finper-api     — Express REST API, port 3008
  client/   @soker90/finper-client  — React 19 + Vite SPA, port 5173
```

`api` depends on `db` and `types` via `workspace:*`. Without building the packages, the API server won't start and imports fail at runtime.

---

## Commands (use `make`, not raw pnpm)

```bash
# Install
pnpm install

# Critical: build types and db BEFORE starting or building the API
make build-types
make build-db

# Dev servers (run in separate terminals after build steps)
make start-api       # http://localhost:3008
make start-client    # http://localhost:5173

# Build all
make build-types && make build-db && make build-api && make build-client

# Tests (all packages in parallel)
make test

# Tests per package
make test-db         # Vitest (SQLite in-memory)
make test-api        # Jest (SQLite)
make test-client     # Vitest (runs with --coverage by default)

# Lint per package
make lint-db
make lint-api
make lint-client
```

### Run a single test file

```bash
# API (Jest)
pnpm --filter @soker90/finper-api exec jest src/controllers/account.test.ts
pnpm --filter @soker90/finper-api exec jest --testNamePattern="should return 200"

# Client / DB (Vitest)
pnpm --filter @soker90/finper-client exec vitest run src/pages/Accounts/Accounts.test.tsx
pnpm --filter @soker90/finper-client exec vitest run -t "should render"
pnpm --filter @soker90/finper-client exec vitest --watch   # watch mode, no coverage
```

### Typecheck (no dedicated script)

```bash
pnpm --filter @soker90/finper-client exec tsc --noEmit
pnpm --filter @soker90/finper-api exec tsc --noEmit
pnpm --filter @soker90/finper-db exec tsc --noEmit
```

---

## Toolchain quirks

- **Two test frameworks**: `api` uses Jest (`jest.config.cjs`); `client` and `db` use Vitest.
- **SQLite Database**: The database is a local SQLite file. Docker Compose relies on a mounted volume.
- **ESLint flat config** (`eslint.config.mjs`) in all packages. No `.eslintrc`. Uses `neostandard` + `@typescript-eslint`.
- **PWA**: `vite-plugin-pwa` with `registerType: 'autoUpdate'`. Service worker registers automatically; may interfere in integration test environments.
- **Node 24** required (`.nvmrc` + `"engines": { "node": ">=24.x" }` in api).
- **`packageManager` pinned**: root `package.json` declares `pnpm@10.29.3`; `preinstall` script blocks npm/yarn.

---

## Environment variables

Copy `.env.example` to `.env` at repo root:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_FILE` | No | SQLite file path. Local default: `./finper-dev.db`. With Docker Compose, the compose sets `/home/node/app/data/finper.db` (volume root) unless overridden here. |
| `JWT_SECRET` | Yes | JWT signing secret. |
| `SALT_ROUNDS` | Yes | bcrypt rounds. |
| `GRAFANA_LOGGER_USER` / `GRAFANA_LOGGER_PASSWORD` | No | External Loki logger. |
| `LOKI_USER` / `LOKI_PASSWORD` | No | Alias used by the compose files (same credential). |
| `TICKET_BOT_URL` / `TICKET_BOT_API_KEY` | No | Tickets module integration with `finper-bot`. |

Client also needs `packages/client/.env`:
```dotenv
VITE_API_HOST=http://localhost:3008/api/
```
No fallback is hardcoded; without this variable all API calls fail in development.

---

## Common agent mistakes

- Running `make start-api` or building the API without first running `make build-types` and `make build-db`.
- Adding dependencies with `^` or `~` — always use exact versions.
- Looking for a `vitest.config.*` in the client — it doesn't exist; Vitest config is in `vite.config.ts`.
- Running `tsc` expecting a `typecheck` npm script — there isn't one; run `tsc --noEmit` directly.
- Assuming `make test` is safe to debug a single failing test — it runs all packages in parallel; target the specific package instead.

---

## Mapa de documentación

Para cualquier tarea no trivial, consultar primero el `AGENTS.md` del paquete afectado: contiene patrones, quirks y checklists detallados.

### Contexto general (leer primero para tareas que cruzan paquetes)

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — arquitectura del monorepo, flujo de petición end-to-end, build order, auth, persistencia, tooling, env vars, decisiones técnicas.
- [`docs/DOMAIN.md`](./docs/DOMAIN.md) — modelo de dominio: entidades, relaciones, enums, convenciones transversales y glosario.
- [`docs/API-CATALOG.md`](./docs/API-CATALOG.md) — catálogo completo de endpoints REST agrupado por recurso.

### Documentación por paquete

Cada `AGENTS.md` de paquete contiene **solo reglas críticas + checklist + comandos** (~70 líneas). El detalle (patrones, ejemplos, quirks completos) vive en `docs/<paquete>-patterns.md` y se carga bajo demanda.

- [`packages/api/AGENTS.md`](./packages/api/AGENTS.md) → detalle en [`docs/api-patterns.md`](./docs/api-patterns.md).
- [`packages/client/AGENTS.md`](./packages/client/AGENTS.md) → detalle en [`docs/client-patterns.md`](./docs/client-patterns.md).

### Documentación técnica de módulos

- [`docs/loan-module.md`](./docs/loan-module.md) — préstamos: amortización francesa, eventos, pagos ordinarios/extraordinarios.
- [`docs/subscription-module.md`](./docs/subscription-module.md) — suscripciones: candidatos, vinculación de transacciones.
