## Convención sobre importes monetarios

Los importes monetarios se almacenan como `REAL` (IEEE 754 double precision).
Para evitar acumulación de errores de coma flotante, **toda operación aritmética que produzca un importe debe pasar por el helper `roundMoney`** antes de:

  - Devolverse al cliente en una respuesta HTTP.
  - Almacenarse de vuelta en la base de datos.
  - Compararse con otro importe (en tests o en lógica de negocio).

Para valores leídos directamente de la base de datos sin operación aritmética, `roundMoney` no es necesario (el valor está ya guardado con la precisión que se eligió al insertar).

Ejemplo:

```ts
// Valor calculado: aplicar roundMoney
const portfolioValue = roundMoney(stock.shares * stock.price);

// Valor leído directo: no necesario
const balance = account.balance;
```
