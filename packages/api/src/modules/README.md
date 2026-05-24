# Patrón de Módulos (Fase 3)

Este directorio contiene los módulos migrados a SQLite (Drizzle) durante la Fase 3.
Cada módulo sigue un patrón de arquitectura limpia para aislar la capa de base de datos, la lógica de negocio y el enrutamiento HTTP.

## Estructura de Módulo

```text
packages/api/src/modules/<modulo>/
├── <modulo>.controller.ts         # Handlers HTTP (entrada/salida)
├── <modulo>.service.ts            # Lógica de negocio (sin Express, sin DB)
├── <modulo>.repository.ts         # Acceso a Drizzle (única capa que toca db)
├── <modulo>.serializer.ts         # Convierte filas DB → forma JSON HTTP
├── <modulo>.schema.ts             # Schemas Joi de validación de entrada
├── <modulo>.routes.ts             # Cableado Express
└── __tests__/
    ├── <modulo>.repository.test.ts
    ├── <modulo>.service.test.ts
    └── <modulo>.controller.test.ts
```

## Reglas y Responsabilidades

1. **Repository (`*.repository.ts`)**:
   - Es la ÚNICA capa que importa dependencias de base de datos (e.g. `@soker90/finper-db`, `drizzle-orm`).
   - El resto del módulo jamás debe ver la base de datos cruda.
   - Si se necesita emular `populate`, el repositorio debe hacer el JOIN y estructurar el objeto devuelto con la misma forma que el JSON esperado.

2. **Serializer (`*.serializer.ts`)**:
   - Funciones puras que transforman la fila o el resultado crudo de DB a la estructura JSON que espera el cliente.
   - Aquí se aplican conversiones comunes como `roundMoney` si es necesario, o el paso de booleanos de SQLite (1/0) a `true/false`, etc.

3. **Service (`*.service.ts`)**:
   - Contiene toda la lógica de negocio de la aplicación.
   - Recibe el repositorio por inyección de dependencias o importándolo directamente, pero no sabe qué base de datos se usa.
   - Nunca debe importar de Express (nada de `req`, `res`).
   - Lanza errores de dominio (se puede usar `Boom` aquí o errores personalizados para que el controlador los atrape).

4. **Controller (`*.controller.ts`)**:
   - Funciones handler de Express `(req, res, next)`.
   - Extraen los datos de la Request, llaman al Service y devuelven el resultado formateado al cliente usando `res.json()`.
   - Capturan errores (o los delegan a `next` para el manejador global).

5. **Routes (`*.routes.ts`)**:
   - Exclusivamente el cableado.
   - Aplica los middlewares de autenticación (`passport.authenticate`), de validación Joi (`validateBody`, `validateParams`) y engancha la ruta con su función del controlador.

## Testing

- **Repository**: Tests de integración contra base de datos de test (`createTestDb()`), utilizando fixtures o datos reales pero aislados (SQLite `:memory:` es perfecto para esto).
- **Service**: Tests unitarios que mockean el Repository para probar la lógica.
- **Controller/Routes**: Tests de integración end-to-end de API usando `supertest` contra Express, que pueden atacar la DB en memoria.
