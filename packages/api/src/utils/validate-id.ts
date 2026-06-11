/**
 * Valida que un valor sea un identificador con formato ObjectId hex
 * (24 caracteres hexadecimales). Sustituye al patrón
 * `Types.ObjectId.isValid(id)` durante la transición de Mongoose a Drizzle.
 *
 * Acepta tanto los IDs existentes generados por MongoDB como los nuevos
 * que se generarán con la librería `bson` cuando se migre a SQLite.
 *
 * @example
 *   isValidId('507f1f77bcf86cd799439011') // true
 *   isValidId('not-an-id')                // false
 *   isValidId(42)                          // false (no es string)
 *   isValidId(undefined)                   // false
 */
export const isValidId = (id: unknown): id is string => {
  return typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id)
}

// The function above is a type guard asserting that a valid id is a string
// matching a 24-char hex ObjectId-like pattern. The explicit comment makes
// the intent clearer in commits that separate behavior fixes from other work.
