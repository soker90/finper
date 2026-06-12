# Guía de migración a Finper v2 (MongoDB → SQLite)

Finper **v2** sustituye MongoDB/Mongoose por **SQLite + Drizzle ORM**. Toda la
persistencia pasa a vivir en un único fichero SQLite, por lo que ya no necesitas
un servidor de base de datos externo.

Esta guía describe cómo migrar tus datos de una instalación **v1 (Mongo)** a
**v2 (SQLite)** mediante el script `finper-migrate.cjs` que se adjunta en la
release de v2. La migración es **unidireccional y de una sola vez** (ETL):
lee de tu MongoDB y genera un fichero SQLite nuevo; no modifica tu Mongo.

> ⚠️ **Haz siempre una copia de seguridad de tu MongoDB antes de empezar.** El
> script no escribe en Mongo, pero un backup te garantiza el rollback.

---

## Qué cambia en v2

| | v1 (Mongo) | v2 (SQLite) |
| --- | --- | --- |
| Base de datos | MongoDB (servidor) | Fichero SQLite local |
| Configuración | `DATABASE_NAME`, `DATABASE_HOST`, `MONGODB_USER`, `MONGODB_PASS`, `MONGODB` | `DATABASE_FILE` (ruta al fichero) |
| Docker | contenedor `mongo` + API | solo API; el `.db` se persiste en un volumen |
| Migraciones de esquema | — | la API las aplica sola al arrancar |

En v2 la API lee la ruta de su base de datos de la variable **`DATABASE_FILE`**
(por defecto `./finper-dev.db` en local). En Docker, el fichero se guarda en el
volumen `finperdb`, montado en `/home/node/app/data/finper.db`.

> La **extensión del fichero es irrelevante** para SQLite (`.db`, `.sqlite`, lo
> que sea); lo único que importa es que `DATABASE_FILE` apunte exactamente al
> fichero que generes. En esta guía usamos `finper.db` por consistencia con el
> `docker-compose`.

---

## Requisitos

- **Node.js 20 o superior** (el proyecto usa 24).
- Acceso de **lectura a tu MongoDB de v1** (cadena de conexión `mongodb://…`).
- El artefacto **`finper-migrate.cjs`** descargado de la release de v2.
- Las dos dependencias nativas/cliente que el script espera como externas:
  `better-sqlite3` y `mongodb`.

El script es **autocontenido**: embebe el esquema y la lógica de transformación.
Solo necesita que `better-sqlite3` y `mongodb` estén instalados junto a él.

---

## Paso 1 — Preparar una carpeta de trabajo

```bash
mkdir finper-migracion && cd finper-migracion

# Coloca aquí el finper-migrate.cjs descargado de la release, y luego:
npm init -y
npm install better-sqlite3 mongodb
```

## Paso 2 — Dry-run (solo lectura, no escribe nada)

Valida el mapeo y los recuentos **en memoria**, sin generar ningún fichero:

```bash
MONGODB="mongodb://usuario:password@host:puerto/finper" \
  node finper-migrate.cjs --dry-run
```

Comprueba en el reporte que el número de filas por colección coincide con lo que
esperas. Si una colección no aparece o los conteos no cuadran, **no continúes**.

## Paso 4 — Migración real

Genera el fichero SQLite (por defecto `finper.db`; configurable con `OUTPUT`):

```bash
MONGODB="mongodb://usuario:password@host:puerto/finper" \
OUTPUT="finper.db" \
  node finper-migrate.cjs
```

El script, al terminar, ejecuta verificaciones automáticas y **aborta con código
de error** si algo falla:

- ✅ `PRAGMA foreign_key_check` sin violaciones de integridad referencial.
- ✅ `PRAGMA integrity_check: ok`.
- ✅ Sin `NULL` inesperados en columnas que deben venir pobladas
  (`loans`, `pensions`, `transactions`, `budgets`, …).
- ✅ Recuento de filas por tabla impreso por consola para cotejar con Mongo.

> El script **recrea el fichero de salida desde cero** en cada ejecución (borra
> el `OUTPUT` previo si existe), así que es repetible sin duplicar datos.

## Paso 5 — Colocar el fichero en v2

### Opción A — Instalación local (sin Docker)

Apunta `DATABASE_FILE` al fichero generado y arranca la API:

```bash
# en el .env de v2
DATABASE_FILE=/ruta/absoluta/a/finper.db
```

```bash
make build-db && make start-api
```

### Opción B — Docker Compose

El `docker-compose` de v2 monta el volumen `finperdb` en
`/home/node/app/data`. Copia tu `finper.db` dentro de ese volumen:

```bash
# 1) Crea el volumen y el contenedor (puedes pararlo justo después)
docker compose up -d api
docker compose stop api

# 2) Copia el fichero migrado dentro del contenedor (ruta del volumen)
docker compose cp finper.db api:/home/node/app/data/finper.db

# 3) Arranca de nuevo
docker compose up -d api
```

> Alternativa sin contenedor en marcha (copiar directo al volumen con nombre,
> que suele prefijarse con el del proyecto, p.ej. `finper_finperdb`):
> ```bash
> docker run --rm -v finper_finperdb:/data -v "$PWD":/src alpine \
>   sh -c "cp /src/finper.db /data/finper.db"
> ```

## Paso 6 — Verificación (smoke test)

1. Arranca la API. En el log debe aparecer `Drizzle SQLite migrations applied`
   sin errores.
2. Healthcheck:
   ```bash
   curl http://localhost:3008/api/monit/health
   ```
3. **Login con un usuario existente** (sus credenciales de v1 siguen siendo
   válidas, ver más abajo) y comprueba que devuelve `200` + token:
   ```bash
   curl -X POST http://localhost:3008/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"tuusuario","password":"tupassword"}'
   ```
4. Revisa que los endpoints principales (`/api/accounts`, `/api/transactions`,
   `/api/loans`, …) responden sin error 500 y con tus datos.

---

## Rollback

La migración no toca tu MongoDB. Si algo va mal:

1. No despliegues v2 (o detén el contenedor de v2).
2. Vuelve a arrancar tu instalación **v1** apuntando al Mongo original (o
   restaura el `mongodump` del Paso 2).

Conserva el backup de Mongo y el `finper.db` generado hasta confirmar que v2
funciona correctamente en producción.

---

## Notas importantes

- **Las contraseñas se conservan.** El script copia el hash `bcrypt` tal cual
  desde Mongo, así que los usuarios siguen entrando con sus credenciales de v1.
  No hace falta volver a sembrar usuarios.
- **SQLite en modo WAL.** En ejecución, la API abre el fichero en modo WAL y
  genera ficheros hermanos `finper.db-wal` y `finper.db-shm`. Si haces copias o
  mueves la base de datos, manténlos juntos (o haz la copia con la app parada).
- **Colecciones vacías.** Si en tu Mongo no hay registros de `goals`, `debts` o
  `subscription_candidates`, simplemente migrarán 0 filas; no es un error.
- **Producción:** revisa que `JWT_SECRET` sea un valor fuerte y considera subir
  `SALT_ROUNDS` (10–12). Estos no cambian con la migración de datos.

---

## Resolución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `✗ Falta la variable MONGODB` | No se pasó la cadena de conexión | Exporta/pon `MONGODB=…` delante del comando |
| `MongoServerSelectionError` | No conecta a Mongo | Revisa host/puerto/credenciales y que Mongo sea accesible |
| `Cannot find module 'better-sqlite3'` | Faltan las dependencias del script | `npm install better-sqlite3@12.10.0 mongodb@6.12.0` en la carpeta del `.cjs` |
| Login da `401` tras migrar | La API lee otra base de datos | Verifica que `DATABASE_FILE` (o el volumen Docker) apunta al `finper.db` migrado |
| La verificación falla (FK/NULL) | Datos inesperados en Mongo | Revisa el detalle que imprime el script; corrige en Mongo y repite el dry-run |

---

## Para mantenedores: generar el artefacto de la release

El `finper-migrate.cjs` que se adjunta a la release se genera desde el monorepo
(empaqueta el esquema y la lógica en un único fichero autocontenido):

```bash
make build-db
pnpm --filter finper-data-migration build
# → scripts/data-migration/finper-migrate.cjs
```

Para probarlo en local contra un Mongo de desarrollo: `pnpm --filter
finper-data-migration dry-run` (o `migrate`), que compilan y ejecutan el bundle.
</content>
