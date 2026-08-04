/**
 * Guards against tokens that are missing or have been serialized as the
 * literal strings "undefined"/"null" (e.g. via `` `Bearer ${token}` `` when
 * `token` was actually `undefined`), which would otherwise be persisted as
 * valid-looking values in localStorage/headers.
 */
export const isTokenPresent = (token?: string | null): token is string =>
  Boolean(token) && token !== 'undefined' && token !== 'null' && (token as string).trim() !== ''
