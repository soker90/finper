# Finper

Finper es una aplicación para gestionar finanzas personales: cuentas, movimientos, presupuestos, deudas, préstamos, pensión, suscripciones y suministros. El repositorio está organizado como un monorepo con `pnpm` y separa claramente frontend, API y capa de modelos.

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![codecov](https://codecov.io/gh/soker90/finper/branch/master/graph/badge.svg?token=gWKDyCALuU)](https://codecov.io/gh/soker90/finper)

## Tabla de contenidos

- [Inicio rápido](#inicio-rápido)
- [Qué incluye](#qué-incluye)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Ecosistema Finper](#ecosistema-finper)
- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Arranque en local](#arranque-en-local)
- [Creación de usuarios](#creación-de-usuarios)
- [Comandos principales](#comandos-principales)
- [Tests y calidad](#tests-y-calidad)
- [Docker](#docker)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Documentación adicional](#documentación-adicional)
- [Healthcheck](#healthcheck)
- [Capturas](#capturas)
- [Licencia](#licencia)

## Inicio rápido

Si quieres probar Finper en local con el flujo recomendado:

```bash
git clone https://github.com/soker90/finper.git
cd finper
cp .env.example .env
pnpm install
make build-models
make start-api
```

En otra terminal:

```bash
make start-client
```

Y si necesitas crear un usuario inicial:

```bash
make seed-user USERNAME=miusuario PASSWORD=mipassword
```

## Qué incluye

Actualmente Finper cubre, entre otros, estos módulos:

- Gestión de cuentas
- Movimientos e ingresos/gastos categorizados
- Presupuestos mensuales
- Vista anual de finanzas
- Gestión de deudas
- Control de préstamos y amortización
- Seguimiento de pensión
- Gestión de suscripciones recurrentes
- Gestión de suministros e inmuebles
- Tickets y utilidades auxiliares

## Arquitectura del proyecto

El repositorio está dividido en tres paquetes principales dentro de `packages/`:

- `packages/api`: API REST en Express y TypeScript
- `packages/client`: frontend en React + Vite
- `packages/models`: modelos y tipos compartidos basados en Mongoose

Relación entre paquetes:

- El **cliente** consume la **API**
- La **API** utiliza `@soker90/finper-models` como dependencia de workspace
- Los **models** encapsulan esquemas, tipos y utilidades de conexión con MongoDB

## Ecosistema Finper

Además de los paquetes incluidos hoy en este monorepo, Finper ya se integra con un proyecto externo llamado **[`finper-bot`](https://github.com/soker90/finper-bot)**.

### ¿Qué es `finper-bot`?

`finper-bot` es un servicio auxiliar relacionado con la gestión de tickets. A día de hoy vive en un repositorio separado ([`soker90/finper-bot`](https://github.com/soker90/finper-bot)), pero la intención es incorporarlo próximamente a este repositorio principal.

### ¿Cómo se integra ahora mismo?

La integración actual se hace desde la API mediante estas variables de entorno:

- `TICKET_BOT_URL`
- `TICKET_BOT_API_KEY`

Desde el código actual, Finper utiliza `finper-bot` para:

- listar tickets pendientes o revisados
- marcar tickets como revisados
- eliminar tickets

Las llamadas salientes que hace la API son, conceptualmente:

- `GET {TICKET_BOT_URL}/api/tickets?status=pending`
- `PATCH {TICKET_BOT_URL}/api/tickets/:id`
- `DELETE {TICKET_BOT_URL}/api/tickets/:id`

En Finper esto se refleja en:

- la API bajo `GET/PATCH/DELETE` del módulo de tickets en `packages/api`
- la pantalla de tickets del cliente en `packages/client/src/pages/Tickets`

> Si no vas a usar la funcionalidad de tickets, puedes dejar `TICKET_BOT_URL` y `TICKET_BOT_API_KEY` sin configurar. La aplicación principal puede seguir funcionando, aunque esa integración externa no estará disponible.

## Stack tecnológico

### Backend

- Node.js
- Express
- TypeScript
- Mongoose
- Passport + JWT
- Joi para validación

### Frontend

- React
- Vite
- Material UI
- React Router
- SWR
- Vitest + Testing Library

### Tooling

- `pnpm` workspaces
- `make` para comandos habituales
- ESLint
- Jest / Vitest
- Docker / Docker Compose

## Requisitos previos

Para trabajar en local, lo recomendable es contar con:

- **Node.js 24 o superior**
- **pnpm 10**
- **MongoDB** accesible en local o por red
- **make**
- **Docker** y **Docker Compose** si quieres levantar la API y MongoDB en contenedores

> El repositorio fuerza el uso de `pnpm` en la instalación.

## Instalación

Clona el repositorio:

```bash
git clone https://github.com/soker90/finper.git
cd finper
```

Instala dependencias:

```bash
pnpm install
```

Si prefieres usar `make`:

```bash
make install
```

## Configuración

### 1. Variables de entorno para desarrollo local

Crea un `.env` en la raíz del proyecto a partir de `/.env.example`:

```bash
cp .env.example .env
```

Variables principales para desarrollo local:

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_NAME` | Sí | Nombre de la base de datos |
| `DATABASE_HOST` | Sí | Host de MongoDB |
| `MONGODB_USER` | No | Usuario de MongoDB |
| `MONGODB_PASS` | No | Contraseña de MongoDB |
| `MONGODB` | No | URI completa de MongoDB; si existe, tiene prioridad |
| `JWT_SECRET` | Sí | Secreto para firmar tokens |
| `SALT_ROUNDS` | Sí | Rondas de hash para contraseñas |
| `GRAFANA_LOGGER_USER` | No | Usuario del logger externo |
| `GRAFANA_LOGGER_PASSWORD` | No | Password del logger externo |
| `TICKET_BOT_URL` | No | URL del servicio externo de tickets |
| `TICKET_BOT_API_KEY` | No | API key del servicio de tickets |

### 2. Variables adicionales si usas Docker Compose

Los `docker-compose` del repo también interpolan variables específicas para inicializar MongoDB y para compatibilidad con el archivo Compose actual:

| Variable | Obligatoria en Compose | Descripción |
| --- | --- | --- |
| `DATABASE_ROOT_USERNAME` | Sí | Usuario root para el contenedor MongoDB |
| `DATABASE_ROOT_PASSWORD` | Sí | Password root para el contenedor MongoDB |
| `LOKI_USER` | No | Variable interpolada actualmente por Compose |
| `LOKI_PASSWORD` | No | Variable interpolada actualmente por Compose |

> Importante: la API lee `GRAFANA_LOGGER_USER` y `GRAFANA_LOGGER_PASSWORD`, mientras que los archivos Compose actuales interpolan también `LOKI_USER` y `LOKI_PASSWORD`. Si usas Docker Compose y esa integración de logging te importa, lo más seguro es definir ambos pares con el mismo valor.

### 3. Configuración del cliente

El cliente incluye un `packages/client/.env` con la URL de la API en local.

Valor actual esperado:

```dotenv
VITE_API_HOST=http://localhost:3008/api/
```

Si tu API corre en otra URL, ajusta ese valor antes de arrancar el frontend.

## Arranque en local

### Opción recomendada: desarrollo por paquetes

1. Arranca MongoDB
2. Instala dependencias
3. Construye los modelos
4. Arranca la API
5. Arranca el cliente

Comandos:

```bash
make build-models
make start-api
```

En otra terminal:

```bash
make start-client
```

URLs locales conocidas desde el código actual:

- Cliente: normalmente `http://localhost:5173`
- API: `http://localhost:3008`
- Base path API: `http://localhost:3008/api`

> `make start-api` ejecuta el script de arranque de `@soker90/finper-api`.
> Si estás trabajando con cambios en `packages/models`, construir los modelos antes de arrancar la API evita inconsistencias.

## Creación de usuarios

Hay dos maneras prácticas de crear usuarios.

### Opción A — Script seed manual

Útil para bootstrap inicial o administración manual desde terminal.

```bash
make seed-user USERNAME=miusuario PASSWORD=mipassword
```

Qué hace:

- Lee `USERNAME` y `PASSWORD` desde el `Makefile`
- Los transforma en `INIT_USERNAME` e `INIT_PASSWORD`
- Ejecuta `packages/api/src/scripts/seed-user.ts`
- Crea el usuario si no existe
- Si ya existe, termina sin error

Reglas de validación actuales:

- `username`: entre **3** y **15** caracteres
- `password`: mínimo **5** caracteres

### Opción B — Endpoint REST `POST /api/auth/register`

El endpoint sigue estando abierto y permite crear usuarios adicionales.

Ejemplo con `curl`:

```bash
curl -X POST http://localhost:3008/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"miusuario","password":"mipassword"}'
```

Respuesta esperada:

```json
{ "token": "<jwt>" }
```

Ejemplo de login:

```bash
curl -X POST http://localhost:3008/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"miusuario","password":"mipassword"}'
```

## Comandos principales

### Con `make`

| Comando | Descripción |
| --- | --- |
| `make install` | Instala dependencias del monorepo |
| `make build-models` | Compila `packages/models` |
| `make build-api` | Compila la API |
| `make build-client` | Genera la build del frontend |
| `make start-api` | Arranca la API |
| `make start-client` | Arranca el frontend en modo desarrollo |
| `make seed-user USERNAME=... PASSWORD=...` | Crea un usuario inicial/manual |
| `make lint-api` | Ejecuta lint de la API |
| `make lint-client` | Ejecuta lint del cliente |
| `make lint-models` | Ejecuta lint de models |
| `make test-api` | Ejecuta tests de la API |
| `make test-client` | Ejecuta tests del cliente |
| `make test-models` | Ejecuta tests de models |
| `make test` | Ejecuta tests de todos los paquetes |
| `make` | Muestra la ayuda |

### Con `pnpm`

```bash
pnpm --filter @soker90/finper-models build
pnpm --filter @soker90/finper-api start
pnpm --filter @soker90/finper-client dev
INIT_USERNAME=miusuario INIT_PASSWORD=mipassword pnpm --filter @soker90/finper-api seed-user
```

## Tests y calidad

El proyecto usa:

- **Jest** en `packages/api`
- **Jest** en `packages/models`
- **Vitest** en `packages/client`

Ejecutar toda la batería:

```bash
make test
```

Ejecutar por paquete:

```bash
make test-api
make test-client
make test-models
```

Lint por paquete:

```bash
make lint-api
make lint-client
make lint-models
```

## Docker

El repositorio incluye dos ficheros Compose:

- `docker-compose.yml`: entorno base con **MongoDB + API**
- `docker-compose.prod.yml`: variante orientada a despliegue usando imagen publicada de la API

### Qué levanta el Compose actual

Según la configuración actual, el Compose raíz levanta:

- `database` en `mongo:4.4`
- `api` en el puerto `3008`

No levanta el cliente web.

### Variables necesarias para Compose

El `docker-compose.yml` utiliza variables como:

- `DATABASE_NAME`
- `DATABASE_ROOT_USERNAME`
- `DATABASE_ROOT_PASSWORD`
- `JWT_SECRET`
- `SALT_ROUNDS`
- `LOKI_USER` / `LOKI_PASSWORD`
- `TICKET_BOT_URL`
- `TICKET_BOT_API_KEY`

Arranque típico:

```bash
docker compose up --build
```

> Si trabajas con Docker Compose, revisa que tu `.env` incluya también las variables específicas de Compose para MongoDB root, ya que no coinciden exactamente con las usadas por la API en modo local.

## Estructura del repositorio

```text
finper/
├── docs/
│   ├── loan-module.md
│   └── subscription-module.md
├── packages/
│   ├── api/
│   ├── client/
│   └── models/
├── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── Makefile
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## Documentación adicional

Hay documentación técnica más detallada para algunos módulos:

- `docs/loan-module.md`
- `docs/subscription-module.md`

## Healthcheck

La API expone un endpoint de salud:

```bash
curl http://localhost:3008/api/monit/health
```

## Capturas

![imagen](https://user-images.githubusercontent.com/8345188/220207754-a890756d-243a-4e10-815a-df1a597512fc.png)

![imagen](https://user-images.githubusercontent.com/8345188/220208160-9d14644b-dd7c-4875-9edf-6ec7f4604b52.png)

![imagen](https://user-images.githubusercontent.com/8345188/220720830-ccc67462-d724-49a6-b33e-6c9602eb47cf.png)

![imagen](https://user-images.githubusercontent.com/8345188/220721312-7f5fa22d-f607-49bd-85d4-3c4abf288eae.png)

![imagen](https://user-images.githubusercontent.com/8345188/220721599-00ec2cdd-e832-4890-a2e8-e4d781c35a8c.png)

![imagen](https://user-images.githubusercontent.com/8345188/220208380-0d1ff108-1c1d-4bc0-9784-bb114b1add81.png)

![220721852-6ba9a65c-3b76-40ad-b3a0-5457cd28a6f7](https://user-images.githubusercontent.com/8345188/220723111-9a8f4dd8-07bc-4090-a738-fcc8317c1535.png)

![220721972-da101b9f-aa5a-4c74-9a7b-d34f096b3393](https://user-images.githubusercontent.com/8345188/220722791-bea8c0cc-24ff-4a5f-8bff-b2a382bc9bcc.png)

## Licencia

[GPLv3 o superior](https://github.com/soker90/finper/blob/master/LICENSE)
