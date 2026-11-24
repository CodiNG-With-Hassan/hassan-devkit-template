/**
 * Interpolation values that travel with an error code (ADR 0002): the
 * frontends substitute them into the translated message (e.g. `{ max: 10 }`
 * into "You can upload at most {{max}} files at once." — counts are phrased
 * so the sentence is right for one and for many, never `file(s)`; see
 * libs/i18n/README.md). Values are limited to strings and numbers so every
 * catalog language can render them without locale-sensitive formatting on
 * the API side.
 */
export type ErrorParams = Record<string, string | number>;
