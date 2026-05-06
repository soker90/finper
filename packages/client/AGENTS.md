# AGENTS — `@soker90/finper-client`

> Patrones detallados (estructura, providers, hooks SWR, mutaciones, routing, testing, MSW, ejemplos): [`docs/client-patterns.md`](../../docs/client-patterns.md).

---

## Reglas críticas (rompen cosas si las ignoras)

1. **Lectura ⇒ hooks SWR** (`src/hooks/` o `src/pages/<X>/hooks/`). **Escritura ⇒ funciones planas** en `services/apiService.ts` con retorno `{ data?, error? }`. No mezclar.
2. **Key SWR = constante de `constants/api-paths.ts`**. Nunca hardcodear URLs en hooks.
3. **Fetcher global** en `SwrProvider.tsx:10`. Hooks llaman `useSWR(KEY)` sin pasar fetcher.
4. **Alias TS sin prefijo `@`**. Imports como `import { Loader } from 'components'`. Definidos en **dos sitios** que deben mantenerse sincronizados:
   - `packages/client/tsconfig.json:18-32` (`baseUrl: "./src"` + `paths`).
   - `packages/client/vite.config.ts:14-28` (`resolve.alias`).
   Al añadir carpeta raíz importable: actualizar **ambos**.
5. **React Router v7** importado desde `'react-router'` (no `react-router-dom`).
6. **Token JWT** en `localStorage[FINPER_TOKEN]` (`config/index.ts`). Interceptor en `utils/axios.ts:7-14` lo inyecta y refresca al recibir el header `Token`.
7. **React 19**: para código nuevo, `ref` como prop normal (sin `forwardRef`) y `use()` en vez de `useContext()`. 5 formularios y `useAuth` siguen el patrón legado — no propagar.
8. **Tests co-localizados** (a diferencia de la API). Usar siempre el `render` de `src/test/testUtils.tsx`, nunca el de `@testing-library/react` directamente.
9. **Aislar SWR por test** con `<SWRConfig provider={() => new Map()} dedupingInterval={0}>` para evitar cache compartido entre casos.
10. **`services/` ≠ servicios por dominio**: sólo `apiService.ts` y `authService.ts`. No crear `services/account.ts`.

---

## Checklist: añadir página/módulo (`Foo`)

1. `src/constants/api-paths.ts`: `export const FOOS = 'foos'` y `export const FOO_DETAIL = (id) => 'foos/${id}'`.
2. Tipos en `src/types/foo.ts` y reexport en `src/types/index.ts`.
3. Hook SWR de lectura: global → `src/hooks/useFoos.ts`; local → `src/pages/Foos/hooks/useFoos.ts` + barrel.
4. Mutaciones en `src/services/apiService.ts` (`addFoo`, `editFoo`, `deleteFoo`) con `{ data?, error? }`.
5. Hook de revalidación: `src/pages/Foos/hooks/useFooMutate.ts` (si hay detalle por id).
6. Página: `src/pages/Foos/index.tsx` con `export default`, subcomponentes en `components/` (con barrel).
7. Lazy import + ruta en `src/routes/MainRoutes.tsx`.
8. Mock: `src/mock/handlers/foos.ts` + entrada en `src/mock/handlers/index.ts`.
9. Tests co-localizados: `src/pages/Foos/Foos.test.tsx` (render, empty, error, mutación).
10. Si añades **carpeta raíz importable nueva**: sincronizar `tsconfig.json` y `vite.config.ts`.
11. Verificar: tests, lint y typecheck del paquete (ver comandos en raíz).

---

## Comandos específicos

> Comandos genéricos (build, test, lint, typecheck) en el [`AGENTS.md` raíz](../../AGENTS.md#commands-use-make-not-raw-pnpm).

```bash
pnpm --filter @soker90/finper-client exec vitest run <archivo>
pnpm --filter @soker90/finper-client exec vitest -t "render"
pnpm --filter @soker90/finper-client exec vitest --watch         # sin cobertura
```
