import type { KnownErrorCode } from './error-codes';

// The interpolation placeholders each ERRORS catalog text uses (ADR 0002):
// the machine-readable counterpart of the `Params:` notes on the API's
// ErrorCode enum members. Every `{{name}}` in src/errors/*.json must appear
// here under its code, and every name listed here must be interpolated by
// every language file — `scripts/check-error-translations.mjs` (CI +
// pre-commit) fails on any drift, so a placeholder cannot be renamed or
// dropped in one language only. Codes absent from this map interpolate
// nothing (their wire params, if any, are debug detail the texts ignore).
//
// Adding an interpolated code means, in one change: the enum member with its
// `Params:` note and the throw site's params (API), the entry here, and the
// placeholder in every catalog file.
export const ERROR_CODE_PARAMS = {} as const satisfies Partial<
  Record<KnownErrorCode, readonly string[]>
>;

export type InterpolatedErrorCode = keyof typeof ERROR_CODE_PARAMS;
