# Plan de pruebas: Módulo de Suscripciones

> **Rama de referencia:** `subscriptions`
> **Última revisión:** 2026-04-08
> **Alcance:** backend (`packages/api`) + frontend (`packages/client`)

---

## Estado actual de cobertura

| Capa | Cobertura existente | Gaps detectados |
|------|---------------------|-----------------|
| API routes | 11 casos (CRUD básico + candidates) | Sin tests unitarios de servicio; sin tests de linking/unlinking |
| Frontend componentes | 6 casos (skeleton, empty, cards, KPIs, banner) | Sin tests de formulario, LinkTransactionsModal ni hooks |
| Frontend hooks | 0 | Gap completo |

### Bugs conocidos que afectan el plan

| # | Descripción | Impacto en tests |
|---|-------------|------------------|
| B1 | Ruta `DELETE /:id/unlink-transactions/:transactionId` **no registrada** | Tests 2.8 bloqueados hasta resolver |
| B2 | `unlinkSubscriptionTransaction` **no existe** en `apiService.ts` | Tests del hook marcados como TODO |
| B3 | `SubscriptionCard` no recibe ni implementa `onUnlinkTransaction` | Tests del componente cubren el estado actual |

---

## Fase 1 — Backend: tests unitarios de servicios

**Archivos a crear:**
- `packages/api/test/services/subscription.service.test.ts`
- `packages/api/test/services/subscription-candidate.service.test.ts`

---

### 1.1 `subscription.service.ts`

#### `getSubscriptions(user)`
- [ ] Devuelve array vacío cuando no hay suscripciones del usuario
- [ ] Devuelve solo las suscripciones del usuario autenticado (no las de otros)
- [ ] Los resultados vienen ordenados por `nextPaymentDate` ascendente
- [ ] Suscripciones con `nextPaymentDate: null` aparecen al final

#### `getSubscription(id, user)`
- [ ] Devuelve `null` si la suscripción no existe
- [ ] Devuelve `null` si la suscripción pertenece a otro usuario
- [ ] Los campos `categoryId` y `accountId` vienen populados con `name` y `bank`
- [ ] Devuelve el documento correcto cuando id y user coinciden

#### `addSubscription(subscription)`
- [ ] Crea la suscripción sin `nextPaymentDate` (se omite al crear)
- [ ] Persiste todos los campos obligatorios: `name`, `amount`, `cycle`, `categoryId`, `accountId`, `user`
- [ ] Persiste el campo opcional `logoUrl` cuando se provee
- [ ] Devuelve el documento creado

#### `editSubscription(id, value)`
- [ ] Devuelve `null` si la suscripción no existe
- [ ] Actualiza solo los campos proporcionados (partial update)
- [ ] Devuelve el documento actualizado (con `new: true`)
- [ ] No altera `nextPaymentDate` si no se pasa expresamente

#### `deleteSubscription(id)`
- [ ] Elimina el documento correctamente
- [ ] No lanza error si el id no existe

#### `getActiveSubscriptions(user)`
- [ ] Devuelve solo suscripciones del usuario indicado
- [ ] Devuelve array vacío si el usuario no tiene suscripciones

#### `getTransactionsBySubscription(id, user)`
- [ ] Devuelve transacciones cuyo `subscriptionId` coincide con el id dado
- [ ] Solo devuelve transacciones del usuario indicado
- [ ] Resultado ordenado por fecha descendente

#### `getMatchingTransactions(id, user)`
- [ ] Devuelve transacciones sin `subscriptionId`, con misma categoría y cuenta que la suscripción
- [ ] Excluye transacciones ya vinculadas a cualquier suscripción
- [ ] Respeta el límite de 50 resultados
- [ ] Devuelve array vacío si no hay coincidencias

#### `linkTransactions(id, transactionIds)`
- [ ] Asigna `subscriptionId` a cada transacción del array
- [ ] No modifica transacciones que no están en el array
- [ ] Recalcula `nextPaymentDate` después de vincular
- [ ] Funciona con un único `transactionId`
- [ ] Funciona con múltiples `transactionIds`

#### `unlinkTransaction(id, transactionId)`
- [ ] Elimina `subscriptionId` de la transacción indicada
- [ ] No modifica otras transacciones vinculadas
- [ ] Recalcula `nextPaymentDate` después de desvincular
- [ ] No lanza error si la transacción ya no tenía `subscriptionId`

#### `recalculateNextPaymentDate(subscriptionId)`
- [ ] Calcula `nextPaymentDate` como `advanceDate(últimoPago, cycle)` cuando hay pagos vinculados
- [ ] Establece `nextPaymentDate: null` cuando no hay transacciones vinculadas
- [ ] Funciona correctamente para cada ciclo: `daily`, `weekly`, `monthly`, `quarterly`, `semi-annually`, `annually`

#### `advanceDate(timestamp, cycle)` — helper interno
- [ ] `daily` → avanza exactamente 1 día
- [ ] `weekly` → avanza 7 días
- [ ] `monthly` → avanza 1 mes (caso borde: 31 ene → 28/29 feb)
- [ ] `quarterly` → avanza 3 meses
- [ ] `semi-annually` → avanza 6 meses
- [ ] `annually` → avanza 1 año (caso borde: 29 feb bisiesto → 28 feb siguiente)

---

### 1.2 `subscription-candidate.service.ts`

#### `detectCandidates(transaction)`
- [ ] No hace nada si no hay suscripciones activas del usuario
- [ ] Detecta suscripciones cuyo `nextPaymentDate` está en rango ±7 días de la fecha de la transacción
- [ ] No crea candidato si ya existe uno para esa transacción
- [ ] Crea candidato con las suscripciones que encajan
- [ ] Ignora suscripciones de otros usuarios
- [ ] Nunca propaga errores al caller (fire-and-forget)

#### `getCandidates(user)`
- [ ] Devuelve array vacío si no hay candidatos
- [ ] Devuelve solo candidatos del usuario indicado
- [ ] `transactionId` populado con `date`, `amount`, `category`, `account`, `note`
- [ ] `subscriptionIds` populado con `name`, `logoUrl`, `amount`, `cycle`, `nextPaymentDate`

#### `assignSubscription(candidateId, subscriptionId)`
- [ ] Vincula `subscriptionId` a la transacción del candidato
- [ ] Llama a `recalculateNextPaymentDate` para la suscripción asignada
- [ ] Elimina el candidato tras la asignación
- [ ] Lanza error si el candidato no existe

#### `dismissCandidate(candidateId)`
- [ ] Elimina el candidato sin modificar la transacción ni la suscripción
- [ ] Lanza error si el candidato no existe

---

## Fase 2 — Backend: tests de integración de rutas

**Archivo a ampliar:** `packages/api/test/routes/subscription.routes.test.ts`

---

### 2.1 `POST /api/subscriptions`
- [x] 401 sin token *(existente)*
- [x] 422 campos faltantes *(existente)*
- [x] 200 creación válida *(existente)*
- [ ] 422 `amount` negativo o cero
- [ ] 422 `cycle` con valor no válido
- [ ] 404 `categoryId` no existe para el usuario
- [ ] 404 `accountId` no existe para el usuario
- [ ] 200 creación sin `logoUrl` (campo opcional)
- [ ] 200 `nextPaymentDate` es `null` al crear

### 2.2 `GET /api/subscriptions`
- [x] 401 sin token *(existente)*
- [x] 200 devuelve solo las del usuario autenticado *(existente)*
- [ ] 200 devuelve array vacío si no hay suscripciones
- [ ] 200 devuelve ordenadas por `nextPaymentDate` ascendente

### 2.3 `PUT /api/subscriptions/:id`
- [x] 401 sin token *(existente)*
- [x] 404 suscripción no existe *(existente)*
- [x] 200 actualización válida *(existente)*
- [ ] 404 suscripción pertenece a otro usuario
- [ ] 422 `amount` negativo
- [ ] 422 `cycle` inválido
- [ ] 404 `categoryId` no existe
- [ ] 200 actualización parcial sin tocar otros campos

### 2.4 `DELETE /api/subscriptions/:id`
- [x] 401 sin token *(existente)*
- [x] 404 no existe *(existente)*
- [x] 204 eliminación exitosa *(existente)*
- [ ] 404 suscripción pertenece a otro usuario

### 2.5 `GET /api/subscriptions/:id/transactions`
- [ ] 401 sin token
- [ ] 404 suscripción no existe
- [ ] 200 array vacío sin transacciones vinculadas
- [ ] 200 solo transacciones con ese `subscriptionId`
- [ ] 200 no devuelve transacciones de otro usuario

### 2.6 `GET /api/subscriptions/:id/matching-transactions`
- [ ] 401 sin token
- [ ] 404 suscripción no existe
- [ ] 200 transacciones sin `subscriptionId` con misma categoría y cuenta
- [ ] 200 excluye las ya vinculadas
- [ ] 200 respeta límite de 50

### 2.7 `POST /api/subscriptions/:id/link-transactions`
- [ ] 401 sin token
- [ ] 404 suscripción no existe
- [ ] 422 `transactionIds` no es array o está vacío
- [ ] 200 vincula correctamente
- [ ] 200 `nextPaymentDate` se actualiza automáticamente tras vincular
- [ ] 200 funciona con un solo id

### 2.8 `DELETE /api/subscriptions/:id/unlink-transactions/:transactionId` *(ruta no registrada — B1)*
- [ ] **TODO** verificar que actualmente devuelve 404
- [ ] **TODO** 401 sin token
- [ ] **TODO** 404 suscripción no existe
- [ ] **TODO** 200 desvincula y actualiza `nextPaymentDate`

### 2.9 `GET /api/subscriptions/candidates`
- [x] 401 sin token *(existente)*
- [x] 200 devuelve candidatos del usuario *(existente)*
- [ ] 200 array vacío si no hay candidatos
- [ ] 200 solo del usuario autenticado

### 2.10 `POST /api/subscriptions/candidates/:id/assign`
- [x] 401 sin token *(existente)*
- [x] 404 candidato no existe *(existente)*
- [x] 204 asignación exitosa *(existente)*
- [ ] 404 `subscriptionId` no existe
- [ ] 204 `nextPaymentDate` de la suscripción se actualiza

### 2.11 `POST /api/subscriptions/candidates/:id/dismiss`
- [x] 401 sin token *(existente)*
- [x] 404 no existe *(existente)*
- [x] 204 exitoso *(existente)*
- [ ] 204 no modifica la transacción ni la suscripción relacionada

---

## Fase 3 — Frontend: hooks

**Archivos a crear:**
- `packages/client/src/hooks/useSubscriptions.test.ts`
- `packages/client/src/hooks/useSubscriptionCandidates.test.ts`

---

### 3.1 `useSubscriptions`

#### Estado de carga
- [ ] `isLoading: true` en el primer render
- [ ] `isLoading: false` tras recibir datos
- [ ] `error` se popula cuando el fetch falla

#### Datos
- [ ] `subscriptions` devuelve el array recibido del servidor
- [ ] `subscriptions` es `[]` cuando la respuesta es un array vacío

#### `createSubscription(params)`
- [ ] Llama a `addSubscription` del apiService con los params correctos
- [ ] Devuelve `{}` en éxito y actualiza la cache SWR
- [ ] Devuelve `{ error }` si el servidor responde con error
- [ ] No actualiza la cache si hay error

#### `updateSubscription(id, params)`
- [ ] Llama a `editSubscription` con id y params correctos
- [ ] Actualiza la cache con el documento nuevo en éxito
- [ ] Devuelve `{ error }` si el servidor responde con error

#### `removeSubscription(id)`
- [ ] Llama a `deleteSubscription` con el id correcto
- [ ] Elimina el item de la cache en éxito
- [ ] Devuelve `{ error }` si el servidor responde con error

---

### 3.2 `useSubscriptionCandidates`

#### Estado de carga
- [ ] `isLoading: true` en el primer render
- [ ] `isLoading: false` tras recibir datos

#### `assign(candidateId, subscriptionId)`
- [ ] Llama a `assignSubscriptionCandidate` con los ids correctos
- [ ] Elimina el candidato de la cache tras éxito
- [ ] Devuelve `{ error }` si falla

#### `dismiss(candidateId)`
- [ ] Llama a `dismissSubscriptionCandidate` con el id correcto
- [ ] Elimina el candidato de la cache tras éxito
- [ ] Devuelve `{ error }` si falla

---

## Fase 4 — Frontend: componentes

**Archivos a crear/ampliar:**
- `packages/client/src/pages/Subscriptions/Subscriptions.test.tsx` *(ampliar)*
- `packages/client/src/pages/Subscriptions/components/SubscriptionForm.test.tsx`
- `packages/client/src/pages/Subscriptions/components/SubscriptionCard.test.tsx`
- `packages/client/src/pages/Subscriptions/components/CandidatesBanner.test.tsx`
- `packages/client/src/pages/Subscriptions/components/LinkTransactionsModal.test.tsx`

---

### 4.1 `Subscriptions` (página principal)

**Existentes:**
- [x] Muestra skeleton durante carga
- [x] Estado vacío cuando no hay suscripciones
- [x] Renderiza tarjetas de suscripción
- [x] Renderiza KPIs summary
- [x] Muestra botón "Nueva"
- [x] Muestra banner de candidatos cuando existen

**Nuevos:**
- [ ] Click en "Nueva" → abre `SubscriptionForm` en modo creación
- [ ] Click en editar de una card → abre `SubscriptionForm` con datos precargados
- [ ] Click en eliminar de una card → llama a `removeSubscription`
- [ ] Click en "Buscar pagos" → abre `LinkTransactionsModal`
- [ ] Tras crear, el modal se cierra
- [ ] Tras eliminar, el grid se actualiza
- [ ] KPIs muestran valores correctos a partir de las suscripciones mock

### 4.2 `SubscriptionCard`
- [ ] Muestra el nombre de la suscripción
- [ ] Muestra el importe y ciclo formateados (ej: "9,99 € / mes")
- [ ] Muestra el logo si `logoUrl` está presente
- [ ] Muestra avatar con iniciales si no hay `logoUrl`
- [ ] Chip "Próximo pago" con días correctos si `nextPaymentDate` es futuro
- [ ] Chip "Vencido" si `nextPaymentDate` es pasado
- [ ] Sin chip si `nextPaymentDate: null`
- [ ] Muestra máximo 3 últimos pagos vinculados
- [ ] No muestra sección de pagos si no hay transacciones vinculadas
- [ ] Botón "Buscar pagos" → llama a `onSearchPayments` con la suscripción
- [ ] Botón "Editar" → llama a `onEdit` con la suscripción
- [ ] Botón "Eliminar" → llama a `onDelete` con la suscripción

### 4.3 `SubscriptionForm`
- [ ] Modo creación: todos los campos vacíos al abrir
- [ ] Modo edición: campos precargados con los datos de la suscripción
- [ ] Valida que `name` no esté vacío
- [ ] Valida que `amount` sea un número positivo
- [ ] Select de `cycle` muestra todas las opciones con etiquetas en español
- [ ] Select de `categoryId` carga las categorías del usuario
- [ ] Select de `accountId` carga las cuentas del usuario
- [ ] Submit en modo creación → llama a `createSubscription` con los valores correctos
- [ ] Submit en modo edición → llama a `updateSubscription` con id y valores modificados
- [ ] Muestra error si la operación falla
- [ ] Botón de submit en estado de carga mientras se espera respuesta
- [ ] `logoUrl` es opcional; se puede guardar sin él

### 4.4 `CandidatesBanner`
- [ ] No renderiza nada si `candidates` está vacío
- [ ] Renderiza una fila por cada candidato
- [ ] Muestra importe, fecha y categoría de la transacción detectada
- [ ] Muestra cada suscripción sugerida con nombre, importe y ciclo
- [ ] Botón "Asignar" → llama a `assign(candidateId, subscriptionId)` correctamente
- [ ] Botón "Descartar" → llama a `dismiss(candidateId)` correctamente
- [ ] Botones en estado de carga durante la operación
- [ ] Candidato desaparece tras assign/dismiss exitoso
- [ ] Muestra error si la asignación falla

### 4.5 `LinkTransactionsModal`
- [ ] No renderiza con `isOpen: false`
- [ ] Muestra spinner mientras carga transacciones
- [ ] Muestra estado vacío si no hay transacciones de matching
- [ ] Renderiza cada transacción con fecha, importe, categoría y cuenta
- [ ] Permite seleccionar varias transacciones con checkboxes
- [ ] Botón "Vincular" deshabilitado si no hay ninguna seleccionada
- [ ] Submit → llama a `linkSubscriptionTransactions(id, transactionIds)` con los ids seleccionados
- [ ] Modal se cierra tras vinculación exitosa
- [ ] Muestra error si la vinculación falla
- [ ] Botón cancelar cierra el modal sin hacer cambios

---

## Fase 5 — Flujos end-to-end

**Metodología:** tests de integración de alto nivel con Vitest + jsdom + MSW, o Playwright si se incorpora.

---

### Flujo 1: Ciclo de vida completo de una suscripción
1. [ ] Usuario crea suscripción → aparece en el grid con `nextPaymentDate: null`
2. [ ] Abre "Buscar pagos" → ve transacciones matching
3. [ ] Selecciona y vincula transacciones → `nextPaymentDate` se actualiza en la card
4. [ ] Edita el nombre → la card refleja el cambio
5. [ ] Elimina la suscripción → desaparece del grid

### Flujo 2: Detección y gestión de candidatos
1. [ ] Registrar una transacción coincidente (±7 días de `nextPaymentDate`) → banner aparece
2. [ ] Asignar candidato → desaparece del banner, `nextPaymentDate` recalculado
3. [ ] Descartar candidato → desaparece sin cambios en la suscripción

### Flujo 3: Aislamiento entre usuarios
1. [ ] Usuario A crea suscripciones; usuario B no las ve
2. [ ] Usuario B recibe 404 al intentar editar/eliminar suscripciones de usuario A
3. [ ] Los candidatos de usuario A no son visibles para usuario B

### Flujo 4: Regresión de cálculo de fechas
1. [ ] Última transacción el 31 enero + ciclo `monthly` → próximo pago = 28/29 feb
2. [ ] Ciclo `annually` con fecha 29 feb bisiesto → próximo pago = 28 feb año siguiente
3. [ ] Desvincular la última transacción → `nextPaymentDate` vuelve a `null`

### Flujo 5: KPIs de la página
1. [ ] Sin suscripciones: gasto mensual = 0, anual = 0
2. [ ] Suscripciones con ciclos distintos: gasto mensual proyectado es correcto
3. [ ] Eliminar una suscripción → KPIs se actualizan

---

## Criterios de aceptación por fase

| Fase | Umbral de cobertura objetivo | Bloqueante para merge |
|------|------------------------------|-----------------------|
| 1 — Servicios unitarios | 90% líneas en ambos servicios | Sí |
| 2 — Rutas integración | Todos los casos sin *(existente)* completados | Sí |
| 3 — Hooks | 85% ramas en ambos hooks | Sí |
| 4 — Componentes | Todos los casos de `SubscriptionCard` y `SubscriptionForm` | Sí |
| 5 — E2E/flujos | Flujos 1, 2 y 3 completados | No (deseable) |

---

## Deuda técnica previa (prereqs para casos TODO)

Antes de abordar los tests marcados como **TODO** en la sección 2.8 y los de `unlinkTransaction`:

1. **B1** — Registrar ruta `DELETE /:id/unlink-transactions/:transactionId` en `subscription.routes.ts`
2. **B2** — Implementar `unlinkSubscriptionTransaction(id, transactionId)` en `apiService.ts`
3. **B3** — Añadir prop `onUnlinkTransaction` a `SubscriptionCard` e implementar el botón de desvincular en la lista de pagos
