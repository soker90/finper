# Client patterns

Detalle operativo de `packages/client`. Cargar bajo demanda. Para reglas críticas y checklist, ver [`packages/client/AGENTS.md`](../packages/client/AGENTS.md).

---

## Estructura de `src/`

| Carpeta | Rol |
|---|---|
| `main.tsx` | Bootstrap React 19 + `BrowserRouter` + `AuthProvider`. |
| `App.tsx` | Composición de providers. |
| `components/` | UI compartido (con barrel parcial). |
| `config/` | Constantes runtime: `API_HOST`, `FINPER_TOKEN`, `drawerWidth`. |
| `constants/` | `api-paths.ts` (rutas API) y `transactions.ts` (constantes dominio). |
| `contexts/` | `AuthContext` y `SwrProvider` (sólo dos contexts globales). |
| `guards/` | `AuthGuard` y `GuestGuard`. |
| `hooks/` | Hooks SWR globales (compartidos por varias páginas). |
| `layout/` | `MainLayout` (autenticado) y `AuthLayout` (guest). |
| `mock/` | Handlers MSW por dominio + `server.ts`. |
| `pages/` | Una carpeta por sección/ruta. |
| `routes/` | `useRoutes` + `lazy` + layouts. |
| `services/` | Sólo `apiService.ts` (mutaciones) y `authService.ts`. **No hay servicio por dominio.** |
| `test/` | `setup.ts` y `testUtils.tsx` (`render` envuelto en providers). |
| `themes/` | MUI theme custom (palette, typography, locale `esES`). |
| `types/` | Tipos por dominio + barrel. |
| `utils/` | `axios.ts` (interceptor token), `format`, `getColors`, … |

---

## Composición raíz

`main.tsx:10-17` → `App.tsx:11-25`:

```
<AuthProvider>
  <BrowserRouter>
    <App>
      <ThemeCustomization>           // src/themes/index.tsx
        <LocalizationProvider>       // dayjs + es
          <SwrProvider>
            <Auth>                   // src/components/Auth — inicializa token
              <Suspense fallback={<Loader/>}>
                <Routes />
              </Suspense>
            </Auth>
          </SwrProvider>
        </LocalizationProvider>
      </ThemeCustomization>
    </App>
  </BrowserRouter>
</AuthProvider>
```

`utils/axios` se importa por **side effect** desde `App.tsx:7` para registrar el interceptor del header `Token`.

---

## Patrón de página (`pages/<Module>/`)

| Elemento | Convención |
|---|---|
| `index.tsx` | Entry con `export default`. Hook SWR → `useState` para modales → `<HeaderButtons>` → render condicional `isLoading`/empty → modales al final. |
| `components/` | Subcomponentes con barrel `index.ts`. Simples → `Foo.tsx`; complejos → `Foo/index.tsx`. |
| `hooks/` | Opcional. Hooks SWR/locales propios + barrel. |
| `utils/` | Opcional. Lógica pura del módulo. |
| Sub-rutas | Carpetas hermanas: `pages/Loans/LoanDetail/index.tsx`. |
| Tipos | En `src/types/<dominio>.ts`. **No** crear `types.ts` por página. |
| Tests | Co-localizados: `Foo.test.tsx` junto a `Foo.tsx`. |

---

## Hooks SWR (lectura)

Plantilla canónica `pages/Loans/hooks/useLoans.ts`:

```ts
import useSWR from 'swr'
import { LOANS } from 'constants/api-paths'
import { Loan } from 'types'

export const useLoans = () => {
  const { data, error, isLoading } = useSWR<Loan[]>(LOANS)
  return { loans: data ?? [], isLoading, error: error as Error | undefined }
}
```

- Naming `use<Recurso>`. Retorno `{ <recurso>, isLoading, error }` con default `[]` o `null`.
- **SWR condicional** para detalle: `useSWR(id ? LOAN_DETAIL(id) : null)`.
- Globales (varios consumidores) → `src/hooks/`. Locales → `src/pages/<X>/hooks/`.

---

## Mutaciones (escritura)

`services/apiService.ts:7-14`:

```ts
export const editAccount = (id, params): Promise<{ data?: Account, error?: string }> =>
  axios.patch(`${ACCOUNTS}/${id}`, params)
    .then((data: any) => ({ data: data as Account }))
    .catch((error: any) => ({ error: extractError(error) }))
```

- Naming: `add<Recurso>`, `edit<Recurso>`, `delete<Recurso>` + verbos específicos (`transferAccountMoney`, `payDebt`, `linkSubscriptionTransactions`).
- Retorno **siempre** `{ data?, error? }` para `if (error) showError(error)`.
- `extractError` extrae `error.response?.data?.message` con fallback a `error.message`.

### Revalidación tras mutación

`pages/Loans/hooks/useLoanMutate.ts`:

```ts
import { mutate } from 'swr'
import { LOANS, LOAN_DETAIL } from 'constants/api-paths'

export const useLoanMutate = (id?: string) => () => {
  mutate(LOANS)
  if (id) mutate(LOAN_DETAIL(id))
}
```

---

## Routing & guards

- Entry `src/routes/index.ts` con `useRoutes([MainRoutes, LoginRoutes])`.
- `MainRoutes.tsx` con `lazy(() => import(...))` y `MainLayout` como `element`. Slugs en español (`/cuentas`, `/movimientos`, `/prestamos/:id`).
- `LoginRoutes.tsx` con `AuthLayout` y `path: 'login'`.
- `AuthGuard` (`guards/AuthGuard.tsx:4-10`): si `!hasToken()` → `/login`. Envuelve `MainLayout`.
- `GuestGuard` (`guards/GuestGuard.tsx:4-12`): si `hasToken()` → `/`. Envuelve `AuthLayout`.
- Redirección raíz: `/` → `/dashboard/default`.

---

## Testing

Setup en `src/test/setup.ts:1-25` (registrado vía bloque `test` de `vite.config.ts`):

- Mock de `localStorage` para happy-dom.
- MSW: `server.listen({ onUnhandledRequest: 'error' })` en `beforeAll`; `server.resetHandlers()` + clear localStorage en `afterEach`; `server.close()` en `afterAll`.

`testUtils.tsx:12-32` define `AllTheProviders` reproduciendo el árbol de `App` y un `customRender` reexportado como `render`.

### Patrón de test

```ts
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import { SWRConfig } from 'swr'

describe('Goals', () => {
  it('renders list', async () => {
    server.use(http.get('*/goals', () => HttpResponse.json([...])))

    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <Goals />
      </SWRConfig>
    )
  })
})
```

- **Aislar SWR por test** con `<SWRConfig provider={() => new Map()} dedupingInterval={0}>`.
- **Override handlers** con `server.use(...)`; se resetean automáticamente.
- Wildcards: `http.get('*/loans', ...)` cubre el `baseURL` de axios.

```bash
make test-client
pnpm --filter @soker90/finper-client exec vitest run <archivo>
pnpm --filter @soker90/finper-client exec vitest -t "render"
pnpm --filter @soker90/finper-client exec vitest --watch
```

### Mocks MSW

- `src/mock/handlers/<dominio>.ts` exporta array de handlers.
- `src/mock/handlers/index.ts` agrega todos.
- `src/mock/server.ts:1-4`: `setupServer(...handlers)`.

---

## Quirks (no propagar)

- **`forwardRef` legado** en 5 formularios (`components/forms/InputForm.tsx:36`, `SelectForm.tsx:76`, `AutocompleteForm.tsx:64`, `SelectGroupForm/index.tsx:81`, `pages/Accounts/components/AccountEdit/InputForm.tsx:33`). Para nuevo: `ref` como prop normal (React 19).
- **`useContext` clásico** en `hooks/useAuth.ts`. Para nuevo: preferir `use()` de React 19.
- **Alias en dos sitios** que pueden desincronizarse: `tsconfig.json:18-32` declara `MuiTable/*` que no está en `vite.config.ts`; `tsconfig` no declara `mock`, `pages`, `routes`, `layout`, `test` (paths relativos). Mantener consistencia al editar.
- **`config/index.ts` `i18n: 'es'` y `mode: 'light'`** son strings del objeto `config` pero **no se aplican dinámicamente**: theme y textos hardcodeados.
- **Sin alias `@/`**. No introducirlo sin migración global.
- **`services/` no es servicios por dominio**: sólo `apiService.ts` y `authService.ts`. No crear `services/account.ts`.
- **Slugs en español** (`/cuentas`, `/movimientos`). Mantener idioma al añadir.
