# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.1] - 2026-08-19

### Fixed

- **docker/ci**: Remove obsolete `build-args: API_HOST` from GitHub Actions docker workflow so client Docker image uses the default `/api/` upstream proxy.
- **client**: Add fallback `|| '/api/'` to `API_HOST` in client config to prevent empty baseURL when `VITE_API_HOST` is not set.
- **client**: Pin pnpm version in `packages/client/Dockerfile` to `10.29.3`.

---

## [2.3.0] - 2026-08-19

### Added

- **client/api**: Credit Cards module. Comprehensive credit card management including debt tracking, billing cycles, settlement generation, store name auto-resolution, tag support, and credit card stats integration on the main Dashboard (`CreditCardMiniCard`).
- **api**: New `credit-cards` module endpoints (`/api/credit-cards/*`) backed by `credit_cards` and `credit_card_movements` SQLite tables.
- **client**: Dedicated credit cards page, movement modal matching bank transaction fields, and responsive table/card layout for mobile screens.

---

## [2.2.0] - 2026-08-15

### Added

- **client/api**: Passkey (WebAuthn) login. Users can enable a device passkey right after signing in with username/password; from then on the login screen offers "Entrar con huella" and authenticates with the device's fingerprint/biometric sensor instead of typing credentials again, with a "usar contraseña" fallback always available. ([#881](https://github.com/soker90/finper/pull/881))
- **api**: New `passkeys` module (`/api/auth/webauthn/*`) using `@simplewebauthn/server` to generate/verify WebAuthn registration and authentication ceremonies, backed by a new `passkeys` table (per-device credentials, FK to `users.username`).
- **client**: WebAuthn feature detection (`utils/webauthn.ts`), passkey registration/login in `authService`, and a dedicated login flow (`PasskeyLogin`, `usePasskeyLogin`) with graceful self-healing if a device's passkey is revoked or missing server-side.

### Changed

- **api**: JWT session timeout reduced from `1h` to `30m`.
- **api**: `WEBAUTHN_CHALLENGE_SECRET`/`JWT_SECRET` are now required in production — the server fails fast at startup instead of silently signing challenge tokens with a public default secret.
- **client**: nginx now scopes the `no-cache` header to `index.html` and the service worker files only; hashed static assets (`.js`, `.css`, images) get long-lived, immutable caching. Fixed a pre-existing regex that never actually matched `sw.js`/`registerSW.js`.
- **client**: PWA service worker now sets `skipWaiting`/`clientsClaim`/`cleanupOutdatedCaches` so a new deployment takes effect on the next load instead of requiring the app to be fully closed and reopened.

### Dependencies

- Add `@simplewebauthn/server` (api) and `@simplewebauthn/browser` (client).

---

## [2.1.1] - 2026-08-04

### Fixed

- **client**: Purge invalid or malformed JWT tokens (`"undefined"`, `"null"`, empty strings) from `localStorage` automatically, prevent `jwtDecode` runtime crashes, and resolve infinite loading state on `<SplashScreen />` when initializing offline or after request errors. ([#871](https://github.com/soker90/finper/pull/871))

---

## [2.1.0] - 2026-07-18

### Added

- **client/api**: New yields (rendimientos) module: settlements management, annual breakdown
  tables, category and tax-category support for cashback yields, date range/category filters,
  and direct linking of transactions to yields.

- **client/api**: Track remunerated accounts (TAE, average balance and accrued interest).

### Changed

- **client**: Modularize yields forms, filters, tables and headers into smaller components.

### Dependencies

- Bump `recharts` from 3.8.1 to 3.9.2 ([#841](https://github.com/soker90/finper/pull/841), [#855](https://github.com/soker90/finper/pull/855)).
- Bump `yahoo-finance2` from 3.15.3 to 3.15.4 ([#845](https://github.com/soker90/finper/pull/845)).
- Bump `better-sqlite3` from 12.10.0 to 12.11.1 ([#842](https://github.com/soker90/finper/pull/842)).
- Bump `vite` from 8.0.16 to 8.1.3 ([#846](https://github.com/soker90/finper/pull/846)).
- Bump `vitest` and `@vitest/coverage-v8` from 4.1.6 to 4.1.10 ([#844](https://github.com/soker90/finper/pull/844), [#849](https://github.com/soker90/finper/pull/849)).
- Bump `ts-jest` from 29.4.10 to 29.4.11 ([#848](https://github.com/soker90/finper/pull/848)).
- Bump `tsx` from 4.22.0 to 4.22.5 ([#843](https://github.com/soker90/finper/pull/843)).
- Bump `@types/node` from 25.8.0 to 26.1.0 ([#847](https://github.com/soker90/finper/pull/847)).
- Bump `morgan` from 1.10.1 to 1.11.0 ([#852](https://github.com/soker90/finper/pull/852)).
- Bump `actions/setup-node` from 6 to 7 ([#853](https://github.com/soker90/finper/pull/853)).

---

## [2.0.4] - 2026-07-04

### Changed

- **client**: Simplify `runwayTime` using `Intl.ListFormat` and a `pluralize` helper. ([#834](https://github.com/soker90/finper/pull/834))

- **ci**: Configure Dependabot to scan the root directory for pnpm workspaces. ([#835](https://github.com/soker90/finper/pull/835))

### Dependencies

- Bump `typescript-eslint` from 8.59.3 to 8.62.0 ([#837](https://github.com/soker90/finper/pull/837)).
- Bump `yahoo-finance2` from 3.14.1 to 3.15.3 ([#839](https://github.com/soker90/finper/pull/839)).
- Bump `@ant-design/icons` from 6.2.2 to 6.3.1 ([#836](https://github.com/soker90/finper/pull/836)).
- Bump `uuid` from 14.0.0 to 14.0.1 ([#838](https://github.com/soker90/finper/pull/838)).

---

## [2.0.3] - 2026-07-04

### Fixed

- **api**: Improve application shutdown process to prevent database corruption. The server now
  ensures all pending data is safely saved to the database before completely closing down. ([#831](https://github.com/soker90/finper/pull/831))

- **docker**: Configure a 15-second shutdown grace period for containers to allow the database enough
  time to finish saving all pending data safely. ([#831](https://github.com/soker90/finper/pull/831))

---

## [2.0.2] - 2026-07-02

### Fixed

- **client**: Fix store filter in transactions page. Initialize search filter state with empty default
  filters instead of an empty object to avoid undefined parameters on initial render. ([#830](https://github.com/soker90/finper/pull/830))

---

## [2.0.1] - 2026-06-12

### Fixed

- **api**: Move `drizzle-orm` and `better-sqlite3` from `devDependencies` to `dependencies`.
  Both packages are imported at runtime in `server.ts` to apply Drizzle migrations on startup.
  The Docker production stage (`pnpm deploy --prod`) excludes `devDependencies`, causing the
  container to crash immediately with `MODULE_NOT_FOUND`. ([#819](https://github.com/soker90/finper/pull/819))


- **client**: Restore transaction amount colors broken by the MUI v9 upgrade.
  `Typography` color prop in MUI v9 only accepts first-level palette tokens (`success`, `error`,
  `secondary`). The dot-notation previously used (`success.main`, `error.main`) is no longer
  resolved and produced no color. ([#817](https://github.com/soker90/finper/pull/817))

### Changed

- **docker**: Remove hardcoded `ENV DATABASE_FILE` from the API `Dockerfile` — the database path
  is a deployment concern, not an image concern. ([#819](https://github.com/soker90/finper/pull/819))

- **docker**: Pin pnpm to `10.29.3` in the `Dockerfile` instead of `@latest` for deterministic
  builds. ([#819](https://github.com/soker90/finper/pull/819))

- **docker**: `DATABASE_FILE` in `docker-compose.yml` and `docker-compose.prod.yml` is now
  interpolated from `.env` with a default of `/home/node/app/data/finper.db`
  (`${DATABASE_FILE:-/home/node/app/data/finper.db}`). The SQLite file path inside the volume
  can now be overridden via `.env` without editing the compose file. ([#819](https://github.com/soker90/finper/pull/819))

### Documentation

- **env**: Updated `.env.example` to document `DATABASE_FILE` usage for both local and Docker
  deployments. ([#819](https://github.com/soker90/finper/pull/819))

- **docs**: Replaced stale MongoDB environment variable table in `AGENTS.md` and
  `docs/ARCHITECTURE.md` with the current SQLite variables. ([#819](https://github.com/soker90/finper/pull/819))

---

## [2.0.0] - 2026-06-12

Full migration from MongoDB/Mongoose to **Drizzle ORM + SQLite**. See
[#802](https://github.com/soker90/finper/pull/802) for the complete changeset.

