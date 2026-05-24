# HTTP Snapshots

Este directorio contiene snapshots de las respuestas de la API durante la migración
de MongoDB a SQLite + Drizzle. Sirven como red de seguridad: cuando migramos un módulo,
comparamos su nueva respuesta contra el snapshot pre-migración para detectar regresiones.

## Estructura

- `pre-migration/` — Snapshots de la API actual contra MongoDB. Generados al inicio
  de Fase 3, **antes de migrar ningún módulo**.
- `post-migration/` (futuro) — Snapshots tras la migración completa. Útiles para CI/CD
  o re-validación posterior.

## Cómo regenerar los snapshots pre-migration

**No usar el Mongo principal de desarrollo.** Los snapshots se generan contra un Mongo
aislado con datos sintéticos para no exponer datos reales en commits públicos.

### Pasos

1. Levantar el Mongo aislado:
   ```bash
   docker compose -f docker-compose.snapshots.yml up -d
   ```

2. Poblar con datos sintéticos:
   ```bash
   cd packages/api
   pnpm dlx tsx scripts/seed-snapshots-db.ts
   ```

3. Arrancar la API contra ese Mongo (en una terminal):
   ```bash
   MONGODB_URI=mongodb://localhost:27018/finper-snapshots pnpm --filter @soker90/finper-api dev
   ```

4. Capturar (en otra terminal):
   ```bash
   cd packages/api
   pnpm dlx tsx scripts/capture-snapshots.ts
   ```

5. Revisar el directorio `pre-migration/` y commitear los cambios.

6. Parar todo:
   ```bash
   # Ctrl+C en la terminal de la API
   docker compose -f docker-compose.snapshots.yml down
   ```

## Credenciales del usuario sintético

- username: `testuser`
- password: `testpass1234`

(No usar estas credenciales fuera del Mongo aislado.)

## Política de datos en snapshots

- **Todo lo que aparezca en los JSON debe provenir del seed sintético.**
- Si revisas un snapshot y ves algo que no creaste tú deliberadamente, no lo commitees
  y reporta el caso.
- Los snapshots se commitean tal cual al repositorio, con la confianza de que el seed
  controla 100% el contenido.
