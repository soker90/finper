# Rendimientos — Documentación Técnica

## Índice

1. [Visión general](#1-visión-general)
2. [Modelo de datos](#2-modelo-de-datos)
3. [Liquidaciones y cálculo del neto](#3-liquidaciones-y-cálculo-del-neto)
4. [API](#4-api)
5. [Frontend](#5-frontend)
6. [Decisiones de diseño](#6-decisiones-de-diseño)

---

## 1. Visión general

Un **Rendimiento** es una entidad genérica, al estilo de las **Suscripciones**:
se crea una vez (tipo, cuenta, categorías principales) y luego se le
**enlazan movimientos ya existentes** — el mismo mecanismo de "buscar
movimientos sin asignar y enlazarlos" que usan las suscripciones para sus
pagos.

Esto permite dar cabida a distintos tipos de "dinero que te devuelven" sin
crear un sistema nuevo por cada uno:

- **`interest`** (intereses de cuentas remuneradas): se enlaza el abono
  (ingreso) y, si el banco lo separa en dos movimientos, también el
  impuesto retenido (gasto). Opcionalmente se puede indicar la **TAE** y/o
  el **saldo medio** de cada liquidación; si falta uno de los dos, se
  calcula a partir del otro y del neto.
- **`cashback`**: se enlaza el abono del cashback (ingreso) y, opcionalmente,
  los recibos concretos que lo generaron (gasto), para calcular el
  **% devuelto** de cada liquidación.

Los movimientos enlazados se agrupan en **liquidaciones**
(`yield_settlements`): cada vez que enlazas movimientos puedes crear una
liquidación nueva o añadirlos a una ya existente, y cada liquidación calcula
sus propias métricas (neto, TAE, % devuelto, etc.).

### Ficheros principales

```
packages/
├── db/src/schema/
│   ├── yields.ts          ← tablas yields y yield_settlements
│   └── transactions.ts    ← añade yield_id y yield_settlement_id
└── api/src/modules/yields/
    ├── yields.repository.ts
    ├── yields.service.ts
    ├── yields.controller.ts
    ├── yields.serializer.ts
    ├── yields.validators.ts
    └── yields.routes.ts

packages/client/src/pages/
├── Yields/
│   ├── index.tsx                       ← listado (tarjetas + filtro por año)
│   ├── utils.tsx                       ← KPIs, vacío, skeleton del listado
│   └── components/
│       ├── YieldCard/                  ← tarjeta con últimos movimientos
│       ├── YieldForm/                  ← alta/edición (tipo, cuenta, categorías)
│       ├── LinkTransactionsModal/      ← buscar y enlazar movimientos a una liquidación
│       └── YieldRemoveModal/           ← confirmación de borrado (autocontenida)
└── YieldDetail/
    ├── index.tsx                       ← detalle: KPIs, gráfico, tabla de liquidaciones
    ├── utils.ts                        ← reglas compartidas (p. ej. año de una liquidación)
    └── components/
        ├── YieldDetailKpi.tsx
        ├── YieldSettlementChart.tsx    ← gráfico de barras (Recharts, carga perezosa)
        ├── EditSettlementModal.tsx     ← editar TAE / saldo medio de una liquidación
        └── YieldSettlementsTable/      ← tabla por liquidación y vista anual
            ├── index.tsx
            ├── SettlementTable.tsx
            ├── AnnualTable.tsx
            ├── SourceChip.tsx
            ├── NoIncomeWarning.tsx
            └── EmptyRow.tsx
```

## 2. Modelo de datos

### `yields`

| Campo         | Tipo       | Descripción                                                        |
| ------------- | ---------- | ------------------------------------------------------------------ |
| `type`        | `string`   | `'interest'` \| `'cashback'` (ampliable)                            |
| `accountId`   | `string`   | Cuenta a la que pertenece (FK a `accounts`)                         |
| `categoryIds` | `string[]` | Categorías principales, usadas para sugerir movimientos a enlazar   |

No tiene campo `name`: la UI compone el título a partir de la cuenta y el
tipo (p. ej. "Cuenta Naranja - Remunerada").

Restricción única en BD: `(user, accountId, type)` — un usuario no puede
tener dos rendimientos del mismo tipo para la misma cuenta. Se comprueba a
nivel de aplicación al crear/editar y, como defensa en profundidad frente a
condiciones de carrera, también con un índice único en BD que se traduce al
mismo error `YIELD.ALREADY_EXISTS`.

### `yield_settlements`

| Campo           | Tipo             | Descripción                                                  |
| --------------- | ---------------- | ------------------------------------------------------------- |
| `yieldId`       | `string`         | Rendimiento al que pertenece (FK a `yields`)                   |
| `tae`           | `number \| null` | TAE introducida manualmente (solo `interest`)                  |
| `averageBalance`| `number \| null` | Saldo medio introducido manualmente (solo `interest`)          |

Si solo se aporta uno de `tae`/`averageBalance`, el otro se calcula a partir
del neto de la liquidación (ver §3). Una liquidación sin `tae` ni
`averageBalance` ni movimientos de ingreso queda marcada con
`warning: 'no_income'`.

### `transactions` (columnas añadidas)

| Campo               | Tipo             | Descripción                                             |
| -------------------- | ---------------- | -------------------------------------------------------- |
| `yieldId`             | `string \| null` | Rendimiento al que está enlazado este movimiento          |
| `yieldSettlementId`   | `string \| null` | Liquidación concreta dentro de ese rendimiento             |

Ambas columnas se escriben y se borran siempre juntas (nunca una sin la
otra). La BD lo garantiza con una FK compuesta
`(yield_settlement_id, yield_id) → yield_settlements(id, yield_id)`: si
`yield_settlement_id` no es `null`, su `yield_id` tiene que coincidir con el
de la liquidación referenciada.

El papel de un movimiento enlazado se deduce, sin ningún campo adicional, de
su propio `type` (ingreso/gasto) combinado con el `type` del Rendimiento:

| Rendimiento `type` | Movimiento `type=income` | Movimiento `type=expense`                     |
| ------------------- | ------------------------- | ------------------------------------------------ |
| `interest`           | Abono bruto                | Impuesto retenido                                |
| `cashback`            | Abono de cashback           | Recibo que lo generó (cuenta para el % devuelto) |

## 3. Liquidaciones y cálculo del neto

La agrupación y los cálculos viven en `yields.serializer.ts`.

**Por liquidación** (`groupEntriesBySettlement`):

```
interest:  net = Σ ingresos enlazados − Σ gastos enlazados
           si falta tae o averageBalance, se calcula el que falte a partir
           del otro y de `net` (interés compuesto mensual); si ambos faltan
           no se calcula ninguno.
cashback:  cashbackAmount = Σ ingresos enlazados
           billsTotal     = Σ gastos enlazados (recibos)
           percentage     = cashbackAmount / billsTotal · 100 (si billsTotal > 0)
           status         = 'pending' si hay recibos pero cashbackAmount == 0
```

Una liquidación sin ningún movimiento de ingreso enlazado (`income === 0`)
no deriva TAE/saldo medio ni participa en el TAE ponderado anual, y queda
marcada con `warning: 'no_income'` para avisar en la UI.

**Resumen anual** (`annualBreakdown`, usado por el listado, el detalle, la
tabla y el gráfico en modo "Vista Anual"): agrupa las liquidaciones por el
año de su `settlementDate`. Las liquidaciones **pendientes**
(`settlementDate: null`, sin ingreso confirmado todavía) se excluyen del
desglose anual — no se atribuyen al año en curso, porque eso distorsionaría
el histórico de años cerrados a medida que pasa el tiempo.

No hay ninguna proyección ni estimación en los importes cerrados: todo son
sumas de movimientos que ya has enlazado tú mismo; la única "estimación"
visible es orientativa, en la tarjeta del listado y en el gráfico, para
recibos de cashback aún pendientes de abono.

## 4. API

Base: `/api/yields` (requiere autenticación).

| Método | Ruta                                       | Descripción                                                                 |
| ------ | ------------------------------------------- | ---------------------------------------------------------------------------- |
| POST   | `/`                                          | Crea un rendimiento (`type`, `accountId`, `categoryIds`)                      |
| GET    | `/`                                          | Lista los rendimientos del usuario con `netAccumulated` y `annualBreakdown`  |
| GET    | `/:id`                                       | Detalle: rendimiento + `entries` + `settlements`                              |
| PUT    | `/:id`                                       | Edita tipo, cuenta o categorías principales                                  |
| DELETE | `/:id`                                       | Elimina el rendimiento y sus liquidaciones (los movimientos quedan sin enlazar) |
| GET    | `/:id/matching-transactions`                | Movimientos sin enlazar de la cuenta/categorías del rendimiento               |
| POST   | `/:id/link-transactions`                    | Enlaza `transactionIds` a una liquidación (nueva o existente vía `settlementId`, con `tae`/`averageBalance` opcionales) |
| DELETE | `/:id/unlink-transactions/:transactionId`   | Desenlaza un movimiento de ese rendimiento (si su liquidación queda vacía, se borra) |
| PUT    | `/:id/settlements/:settlementId`            | Edita `tae`/`averageBalance` de una liquidación existente                    |

Errores de negocio (`ERROR_MESSAGE.YIELD`): `NOT_FOUND`, `SETTLEMENT_NOT_FOUND`
(la liquidación no existe o no pertenece a ese rendimiento),
`TRANSACTION_IDS_REQUIRED`, `ALREADY_EXISTS`.

## 5. Frontend

Dos páginas, con el mismo patrón que Suscripciones:

- **`/rendimientos`** — listado: KPIs (neto acumulado, nº de rendimientos,
  movimientos enlazados) con un filtro por año, una tarjeta por rendimiento
  (tipo, cuenta, neto, últimos movimientos enlazados) y accesos rápidos para
  editar, borrar, enlazar movimientos o desenlazar uno desde la propia
  tarjeta.
- **`/rendimientos/:id`** — detalle: acciones (enlazar, editar, eliminar),
  KPIs contextuales al tipo de rendimiento, un gráfico de barras (Recharts,
  cargado de forma perezosa) y una tabla de liquidaciones con dos vistas
  ("Por liquidación" / "Vista Anual"), cada una expandible para ver sus
  movimientos o liquidaciones.

Ambas vistas comparten los mismos flujos de mutación (crear/editar/borrar
rendimiento, enlazar/desenlazar movimientos) a través de los hooks en
`hooks/useYields.ts`, que se encargan de refrescar tanto la caché del
listado como la del detalle.

## 6. Decisiones de diseño

- **Entidad genérica en vez de flags en categorías**: permite tener varios
  rendimientos distintos (p. ej. intereses y cashback) aunque compartan
  cuenta, y añadir tipos nuevos sin tocar el resto del modelo.
- **Enlazar transacciones existentes, no duplicar datos**: un Rendimiento no
  "tiene" movimientos propios — apunta a transacciones reales del usuario,
  igual que hacen las Suscripciones con sus pagos.
- **Liquidaciones en vez de un único acumulado**: agrupar los movimientos en
  liquidaciones permite introducir TAE/saldo medio por periodo, mostrar un
  histórico real (gráfico + tabla) y calcular un desglose anual, sin inventar
  ninguna proyección.
- **El papel de un movimiento se deduce, no se declara**: ingreso vs. gasto,
  combinado con el tipo de rendimiento, basta para saber si hay que restarlo
  del neto o no — sin pedir al usuario que etiquete cada movimiento.
- **Liquidaciones pendientes fuera del histórico anual**: una liquidación sin
  `settlementDate` (p. ej. un cashback con recibos pero sin abono todavía) no
  se cuenta en ningún año cerrado, para no distorsionar el histórico según el
  momento en que se consulte.
- **Nombre auto-generado, no elegido por el usuario**: se eliminó el campo
  `name` del formulario; el título se compone en la UI a partir de la cuenta
  y el tipo, evitando nombres inconsistentes o duplicados.
