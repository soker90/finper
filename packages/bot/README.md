# ticket-bot

Bot de Telegram para procesar fotos de tickets de compra. Extrae automáticamente la fecha, comercio y total usando Gemini Flash Vision, almacena la imagen en Cloudflare R2 y guarda los datos en Cloudflare D1 para su posterior revisión en Finper.

## Stack

- **Runtime:** Cloudflare Workers (TypeScript)
- **Framework:** Hono
- **Base de datos:** Cloudflare D1 (SQLite serverless)
- **Almacenamiento de imágenes:** Cloudflare R2
- **OCR/IA:** Google Gemini 2.0 Flash Vision (tier gratuito: 1500 req/día)

## Flujo

```
[Telegram foto] → [Worker] → [Gemini Flash OCR] → [D1: ticket guardado]
                                                         ↑
                                               [Finper consulta pendientes]
```

## Acceso y permisos

El bot soporta múltiples usuarios. Hay un **admin** (configurado via secret `TELEGRAM_ADMIN_USER_ID`) y usuarios adicionales que el admin puede gestionar mediante comandos.

Los usuarios no autorizados son ignorados completamente — el bot no responde ni da señales de estar activo.

### Comandos del admin

| Comando | Descripción |
|---|---|
| `/adduser <id>` | Permite a un usuario enviar tickets |
| `/removeuser <id>` | Revoca el acceso de un usuario |
| `/listusers` | Lista todos los usuarios con acceso |

Para obtener el Telegram user ID de alguien, pídele que escriba a [@userinfobot](https://t.me/userinfobot).

Cuando un usuario no-admin sube un ticket exitosamente, el admin recibe una notificación con el resumen del ticket.

## Setup inicial

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Crear recursos en Cloudflare

```bash
# Crear D1 database
wrangler d1 create ticket-bot-db

# Crear R2 bucket
wrangler r2 bucket create ticket-images
```

Copia el `database_id` que devuelve el comando D1 y actualízalo en `wrangler.toml`.

### 3. Aplicar schema a la base de datos

```bash
# Local (para desarrollo)
pnpm db:migrate:local

# Remoto (producción)
pnpm db:migrate:remote
```

### 4. Configurar secrets

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_SECRET_TOKEN    # genera uno aleatorio: openssl rand -hex 32
wrangler secret put TELEGRAM_ADMIN_USER_ID   # tu user ID de Telegram (usa @userinfobot para obtenerlo)
wrangler secret put GEMINI_API_KEY           # https://aistudio.google.com/apikey
wrangler secret put API_SECRET_KEY           # clave para que finper-api se autentique: openssl rand -hex 32
```

### 5. Desplegar el Worker

```bash
pnpm deploy
```

### 6. Registrar el webhook en Telegram

```bash
TELEGRAM_BOT_TOKEN=xxx TELEGRAM_SECRET_TOKEN=yyy WORKER_URL=https://ticket-bot.tu-subdominio.workers.dev pnpm setup:webhook
```

## Variables de entorno (Cloudflare secrets)

| Variable | Descripción |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token del bot de @BotFather |
| `TELEGRAM_SECRET_TOKEN` | Token secreto para validar webhooks de Telegram |
| `TELEGRAM_ADMIN_USER_ID` | User ID de Telegram del administrador |
| `GEMINI_API_KEY` | API key de Google AI Studio (gratuita) |
| `API_SECRET_KEY` | Clave para autenticar peticiones de finper-api |

## API para finper-api

Todos los endpoints requieren el header `X-API-Key: <API_SECRET_KEY>`.

### `GET /api/tickets?status=pending`

Devuelve la lista de tickets. `status` puede ser `pending`, `reviewed` o `all`.

```json
{
  "tickets": [
    {
      "id": "abc123",
      "image_url": "https://ticket-bot.workers.dev/images/tickets/abc123.jpg",
      "date": 1704067200000,
      "store": "Mercadona",
      "amount": 45.67,
      "status": "pending",
      "created_at": 1704100000000
    }
  ],
  "total": 1
}
```

### `PATCH /api/tickets/:id`

Marca un ticket como revisado (tras crear la transacción en Finper).

```json
{ "success": true, "id": "abc123" }
```

### `DELETE /api/tickets/:id`

Elimina un ticket.

```json
{ "success": true, "id": "abc123" }
```

## Desarrollo local

```bash
pnpm dev
```

Para probar el webhook localmente necesitas exponer el puerto con un túnel (cloudflared tunnel o ngrok) ya que Telegram requiere HTTPS público.

```bash
cloudflared tunnel --url http://localhost:8787
```
