## Helpers de test para módulos migrados a Drizzle

Los módulos migrados en Fase 3 usan SQLite `:memory:` para tests, en lugar de
`@shelf/jest-mongodb`. Los helpers principales son:

- `createTestDb()`: crea una BD nueva en memoria con todas las migraciones aplicadas.
- `closeTestDb(db)`: cierra la BD. Llamar en `afterEach`.
- `createTestUser(db)`: helper de fixture para crear un usuario mínimo.

### Patrón típico

```ts
import { createTestDb, closeTestDb } from '../../helpers/db';

describe('AccountsService', () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    closeTestDb(db);
  });

  it('does something', () => {
    // usar db aquí
  });
});
```

### Cuándo NO usar estos helpers

Los tests de módulos que **todavía no se han migrado** en Fase 3 siguen usando
`@shelf/jest-mongodb`. No mezclar ambas infraestructuras en el mismo archivo de test.
