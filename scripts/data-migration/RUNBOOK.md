# RUNBOOK: Migración de Datos Mongo → SQLite

Este script (`migrate.ts`) realiza una migración unidireccional (ETL) desde una base de datos MongoDB existente hacia una base de datos SQLite nueva, transformando y adaptando todos los datos al esquema estricto y relacional de Drizzle ORM de `@soker90/finper-db`.

## Prerrequisitos

1. Tener instaladas las dependencias en esta carpeta:
   ```bash
   cd scripts/data-migration
   pnpm install
   ```
2. Tener configurada y accesible la variable de entorno `MONGODB` apuntando a la base de datos de origen:
   ```bash
   export MONGODB="mongodb://usuario:password@host:puerto/finper"
   ```

## 1. Dry-Run (Reconocimiento en modo Solo Lectura)

Antes de escribir datos, **siempre** ejecuta el modo *Dry-Run* para validar las transformaciones y el mapeo de colecciones en memoria, sin escribir nada en disco.

```bash
pnpm run dry-run
```

**Verificaciones Esperadas en el Dry-Run:**
- Debe detectar todas las colecciones relevantes.
- Debe imprimir un reporte donde el recuento total de filas a escribir coincida con el esperado de la BBDD (en desarrollo local eran **3486** filas).
- Debería alertar si encuentra colecciones en Mongo que no estén cubiertas por el `COLLECTION_TABLE` (excepto `system.*` o remanentes deliberados).

## 2. Ejecución (Escritura Real)

Ejecuta el script sin la bandera *dry-run* para crear el fichero `finper-migrated.sqlite` desde cero, aplicar las migraciones de Drizzle y volcar todos los datos. Es **idempotente** si antes eliminas el `.sqlite` resultante para evitar añadir filas duplicadas a una BBDD existente sin limpiar.

```bash
rm -f finper-migrated.sqlite
pnpm run migrate
```

**Verificaciones Esperadas en la Ejecución Real:**
- ✅ **Sin violaciones de FK**: Debe superar el chequeo nativo de `PRAGMA foreign_key_check`.
- ✅ **integrity_check: ok**: Debe superar el chequeo nativo de `PRAGMA integrity_check`.
- ✅ **Sin nulls inesperados**: El test de integridad estructural no debe encontrar valores `NULL` filtrados accidentalmente en `loans`, `pensions`, `transactions`, `budgets`, etc.
- ✅ **Tags como Array Crudo**: Confirmar que los arrays JSON nativos de SQLite para `transactions.tags` o `subscription_candidates.subscriptionIds` no hayan sufrido doble serialización. El motor Drizzle asume arrays en inserción (`mode: 'json'`).

## 3. Avisos y Advertencias de Producción (Cutover)

Revisa estos puntos clave **ANTES y DURANTE** el despliegue en Producción:

- ⚠️ **`loanhistories` ignorado:** Esta colección de Mongo es legado muerto confirmado en dev. Si por error en Producción se estuvo escribiendo o usando `loanhistories`, esos datos NO se migrarán a SQLite.
- ⚠️ **Entidades Vacías en Dev:** Las colecciones de `goals`, `debts` y `subscription_candidates` no tenían registros en la base de datos de dev empleada para construir este script. 
  - Al ejecutar esto en producción, observa atentamente los transforms de estas tres entidades para asegurar que SQLite asimila correctamente los formatos (por ejemplo, el `new Date(d.deadline).getTime()` de goals o el `d.createdAt` de candidates). Ante la falta de un campo *opcional* real insertará un `null`, lo cual es deseable, pero ante una desviación de tipo, el ORM fallará ruidosa y deliberadamente para que podamos intervenir.

## 4. Secuencia de Cutover (Paso a Paso)

1. **Backup del Mongo** de producción.
2. Extraer y apuntar `MONGODB` a la cadena de conexión de producción.
3. Correr `pnpm migrate` (esto generará un archivo `.sqlite` fresco).
4. Verificar conteos mostrados por consola en el log vs un `db.collection.countDocuments()` rápido contra Mongo para asegurar un mapeo 1:1.
5. Hacer swap (reemplazar) el fichero `finper-migrated.sqlite` renombrándolo al nombre usado por la app en su volumen (ej: `/app/data/sqlite.db`).
6. Smoke test de la API (`make start-api` o el equivalente en Docker) viendo que carga todas las entidades por los endpoints REST sin error 500.
