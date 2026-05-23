/**
 * Functional equivalent to Bluebird's .tap().
 * Executes a side-effect on the resolved value and returns the value intact.
 * The side-effect can be synchronous or async; if async, it is awaited before continuing.
 *
 * Usage: promise.then(tap(value => doSomething(value)))
 */
export const tap =
  <T>(fn: (value: T) => unknown | Promise<unknown>) =>
    async (value: T): Promise<T> => {
      await fn(value)
      return value
    }
