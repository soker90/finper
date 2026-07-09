# Rendimientos — Documentación Técnica

## Índice

1. [Visión general](#1-visión-general)
2. [Modelo de datos](#2-modelo-de-datos)
3. [Cálculo del neto acumulado](#3-cálculo-del-neto-acumulado)
4. [API](#4-api)
5. [Frontend](#5-frontend)
6. [Decisiones de diseño](#6-decisiones-de-diseño)

---

## 1. Visión general

Un **Rendimiento** es una entidad genérica, al estilo de las **Suscripciones**:
se crea una vez (nombre, tipo, cuenta) y luego se le **enlazan movimientos
ya existentes** — exactamente el mismo mecanismo de "buscar movimientos sin
asignar y enlazarlos" que ya usan las suscripciones para sus pagos.

Esto permite dar cabida a distintos tipos de "dinero que te devuelven" sin
crear un sistema nuevo por cada uno:

- **`interest`** (intereses de cuentas remuneradas): se enlaza el abono
  (ingreso) y, si el banco lo separa en dos movimientos, también el
  impuesto retenido (gasto). Si el banco hace un único movimiento neto,
  solo se enlaza ese.
- **`cashback`**: se enlaza el abono del cashback (ingreso) y, opcionalmente,
  los recibos concretos que lo generaron (gasto) — para verlos en contexto,
  aunque no formen parte del cálculo.

No hay ningún campo numérico nuevo (ni TAE, ni saldo medio, ni porcentaje):
toda la información es la que ya tienen las transacciones (fecha, importe,
tipo, categoría).

### Ficheros principales

```
packages/
├── db/src/schema/
│   ├── yields.ts          ← tabla yields
│   └── transactions.ts    ← añade la columna nullable yield_id
└── api/src/modules/yields/
    ├── yields.repository.ts
    ├── yields.service.ts
    ├── yields.controller.ts
    ├── yields.serializer.ts
    ├── yields.validators.ts
    └── yields.routes.ts

packages/client/src/pages/Yields/
├── index.tsx                          ← página única (lista + tarjetas)
├── utils.tsx                          ← KPIs, vacío, skeleton
└── components/
    ├── YieldCard/                     ← tarjeta con últimos movimientos
    ├── YieldForm/                     ← alta/edición (nombre, tipo, cuenta)
    └── LinkTransactionsModal/         ← buscar y enlazar movimientos
```

## 2. Modelo de datos

### `yields`

| Campo       | Tipo     | Descripción                                  |
| ----------- | -------- | ----------------------------------------------- |
| `name`      | `string` | Nombre descriptivo (ej. "Intereses Cuenta Naranja") |
| `type`      | `string` | `'interest'` \| `'cashback'` (ampliable)          |
| `accountId` | `string` | Cuenta a la que pertenece                         |

### `transactions` (solo se añade una columna)

| Campo     | Tipo             | Descripción                                                  |
| --------- | ---------------- | ---------------------------------------------------------------- |
| `yieldId` | `string \| null` | Rendimiento al que está enlazado este movimiento (si alguno)      |

El papel de un movimiento enlazado se deduce, sin ningún campo adicional, de
su propio `type` (ingreso/gasto) combinado con el `type` del Rendimiento:

| Rendimiento `type` | Movimiento `type=income` | Movimiento `type=expense` |
| ------------------- | ------------------------- | --------------------------- |
| `interest`          | Abono bruto                | Impuesto retenido            |
| `cashback`           | Abono de cashback           | Recibo que lo generó (contexto, no se resta) |

## 3. Cálculo del neto acumulado

Vive en `yields.serializer.ts` (`calcNetAmount`):

```
interest:  neto = Σ ingresos enlazados − Σ gastos enlazados
cashback:  neto = Σ ingresos enlazados   (los gastos son solo contexto)
```

Esto cubre los dos escenarios bancarios habituales para intereses sin
ningún dato adicional:

- **Dos movimientos** (bruto + impuesto): enlazas ambos → la resta da el neto real.
- **Un solo movimiento neto**: no enlazas ningún gasto → el neto es directamente ese ingreso.

No hay ninguna proyección ni estimación: todo son sumas de movimientos que
ya has enlazado tú mismo.

## 4. API

Base: `/api/yields` (requiere autenticación).

| Método | Ruta                                      | Descripción                                                        |
| ------ | ----------------------------------------- | ---------------------------------------------------------------------- |
| POST   | `/`                                        | Crea un rendimiento (`name`, `type`, `accountId`)                       |
| GET    | `/`                                        | Lista los rendimientos del usuario con `netAccumulated`/`entriesCount`/`paymentsCount` |
| GET    | `/:id`                                     | Detalle: rendimiento + sus movimientos enlazados (`entries`)             |
| PUT    | `/:id`                                     | Edita nombre, tipo o cuenta                                              |
| DELETE | `/:id`                                     | Elimina el rendimiento (los movimientos enlazados quedan sin enlazar, no se borran) |
| GET    | `/:id/matching-transactions`               | Movimientos sin enlazar de la misma cuenta, para elegir cuáles enlazar    |
| POST   | `/:id/link-transactions`                   | Enlaza un array de `transactionIds` (abonos, impuestos y/o recibos)       |
| DELETE | `/:id/unlink-transactions/:transactionId`  | Desenlaza un movimiento                                                  |

## 5. Frontend

Una única página, **`/rendimientos`**, con el mismo patrón que Suscripciones:

- KPIs: neto acumulado total, nº de rendimientos, nº de movimientos enlazados.
- Una tarjeta por rendimiento: tipo (chip), cuenta, neto acumulado, y los
  últimos movimientos enlazados con su papel ("Abono" / "Impuesto" / "Recibo")
  y un botón para desenlazarlos.
- Botón "Enlazar movimientos" por tarjeta → modal que busca movimientos sin
  enlazar de esa cuenta y permite marcar varios a la vez (p. ej. el abono y
  el impuesto del mismo mes).
- "Nuevo" / editar → formulario simple (nombre, tipo, cuenta).

## 6. Decisiones de diseño

- **Entidad genérica en vez de flags en categorías**: permite tener varios
  rendimientos distintos (p. ej. intereses y cashback) aunque compartan
  cuenta o categoría, y añadir tipos nuevos sin tocar el resto del modelo.
- **Enlazar transacciones existentes, no duplicar datos**: un Rendimiento no
  "tiene" movimientos propios — apunta a transacciones reales del usuario,
  igual que hacen las Suscripciones con sus pagos.
- **Ningún campo numérico nuevo**: nada de TAE, saldo medio ni porcentaje.
  Todo el cálculo sale de sumar/restar importes de movimientos reales que
  el usuario ya ha enlazado explícitamente.
- **El papel de un movimiento se deduce, no se declara**: ingreso vs. gasto,
  combinado con el tipo de rendimiento, basta para saber si hay que restarlo
  del neto o no — sin pedir al usuario que etiquete cada movimiento.
- **Sin gráfico ni proyección en esta iteración**: al no haber tasa/porcentaje
  que proyectar, se ha preferido mostrar solo el histórico real (a través de
  los movimientos enlazados) en lugar de fabricar una estimación.
