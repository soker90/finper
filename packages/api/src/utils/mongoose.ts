/**
 * Casts the result of a Mongoose `.lean()` call (or any Mongoose document) to
 * the desired type T. Centralizes the `as unknown as T` pattern in a single place.
 */
export const leanDoc = <T>(doc: unknown): T => doc as unknown as T
