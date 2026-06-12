import { ObjectId } from 'bson';

export const generateId = (): string => new ObjectId().toHexString();

export const isValidId = (id: unknown): id is string =>
  typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id);

const collator = new Intl.Collator('es', { sensitivity: 'base' });
export const spanishCompare = (a: string, b: string): number => collator.compare(a, b);

/**
 * Redondea un importe a 2 decimales. Aplicar:
 *  - En serializadores de endpoints que devuelven importes calculados
 *    (productos como shares × price, sumas reconstruidas, agregaciones).
 *  - En operaciones aritméticas que producen importes antes de almacenar
 *    o devolver.
 * Sustituye al patrón manual `Math.round(x * 100) / 100` que la API usaba con Mongoose.
 */
// Maneja problemas de precisión IEEE 754 (alineado con roundNumber de la API)
export const roundMoney = (value: number): number =>
  Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100;
