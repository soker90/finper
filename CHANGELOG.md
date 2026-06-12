# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
