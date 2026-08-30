/**
 * The `client-only` marker, stood in for.
 *
 * SolidStart resolves the real one to nothing in the browser and
 * refuses it on the server, which is exactly what it is for. Vitest is
 * neither, and the published package's whole body is a `throw`, so the
 * engine tests import this instead: see the alias in `vite.config.ts`.
 */
export {};
