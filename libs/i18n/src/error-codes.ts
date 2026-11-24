// The FE mirror of the API's ErrorCode contract (ADR 0002): every code the
// apps can translate. Adding a code means, in one change:
//   1. add it here,
//   2. add its text to EVERY language file in src/errors/ (every supported language),
//   3. (API side) add the enum member + regenerate the spec (`pnpm api:types`).
// `scripts/check-error-translations.mjs` (CI + pre-commit) fails on any drift
// between this list, the catalog files and the API ErrorCode enum.
// Codes without a catalog entry render as ERRORS.UNKNOWN — never as raw keys.
export const ERROR_CODES = [
  'UNKNOWN',
  'VALIDATION_FAILED',
  'INTERNAL_ERROR',
  'AUTH_UNAUTHORIZED',
  'AUTH_FORBIDDEN',
  'NOT_FOUND',
  'PAYLOAD_TOO_LARGE',
  'RATE_LIMITED',
] as const;

export type KnownErrorCode = (typeof ERROR_CODES)[number];
