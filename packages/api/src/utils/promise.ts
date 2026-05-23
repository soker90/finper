/**
 * Equivalente funcional al .tap() de Bluebird.
 * Ejecuta un side-effect sobre el valor resuelto y devuelve el valor intacto.
 * El side-effect puede ser síncrono o async; si es async se espera antes de continuar.
 *
 * Uso: promise.then(tap(value => doSomething(value)))
 */
export const tap =
  <T>(fn: (value: T) => unknown | Promise<unknown>) =>
    async (value: T): Promise<T> => {
      await fn(value)
      return value
    }
