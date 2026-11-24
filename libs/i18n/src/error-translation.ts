import type { ERROR_CODE_PARAMS, InterpolatedErrorCode } from './error-code-params';
import type { KnownErrorCode } from './error-codes';
import { isRecord, KNOWN_CODES } from './internal/wire-shape';

export interface ErrorTranslation {
  key: string;
  /** Literal interpolation values (a count, a date, a name) — rendered as they are. */
  params?: Record<string, string | number>;
  /**
   * Interpolation values that are themselves translation keys (a shared enum
   * label such as `ORDER.STATUS.SHIPPED`), keyed by placeholder name.
   * The `translateError` pipes resolve them at render time, so a label follows
   * a live language switch and a late catalog load exactly like the sentence
   * around it. Never resolve such a key yourself and store the text in
   * `params`: that freezes the label in the language of that moment.
   * A name present in both wins here. Producers type it with `ErrorParamKeysFor`.
   */
  paramKeys?: Record<string, string>;
}

export const UNKNOWN_ERROR_KEY = 'ERRORS.UNKNOWN';

// Maps an HttpErrorResponse-shaped failure to an ERRORS.<CODE> translation key
// plus interpolation params (ADR 0002). Framework-light on purpose: it is typed
// against the wire shape `{ error: { code?, params? } }` rather than Angular's
// HttpErrorResponse or the generated ErrorResponse, so it tolerates bodies the
// API never produced (proxy error pages, network failures with a string or
// empty body, ad-hoc client-side throws). Anything without a known code falls
// back to ERRORS.UNKNOWN — raw server detail never reaches users. Callers keep
// the returned ErrorTranslation (in a signal or store) and render it in the
// template through ngx-translate's impure `translate` pipe — never pre-translated
// with instant().
export function toErrorTranslation(error: unknown): ErrorTranslation {
  const body = isRecord(error) ? error['error'] : undefined;
  if (!isRecord(body)) return { key: UNKNOWN_ERROR_KEY };

  const code = body['code'];
  if (typeof code !== 'string' || !KNOWN_CODES.has(code)) return { key: UNKNOWN_ERROR_KEY };

  return buildErrorTranslation(code as KnownErrorCode, toInterpolationParams(body['params']));
}

/** The interpolation params an ERRORS text expects, keyed by ERROR_CODE_PARAMS. */
export type ErrorParamsFor<C extends InterpolatedErrorCode> = Record<
  (typeof ERROR_CODE_PARAMS)[C][number],
  string | number
>;

// The `paramKeys` a producer may fill for an interpolated code: the same
// placeholder names as ErrorParamsFor, each carrying a catalog key. Build every
// `paramKeys` through this alias so a mistyped placeholder fails to compile
// instead of rendering a raw `{{name}}`.
export type ErrorParamKeysFor<C extends InterpolatedErrorCode> = Partial<
  Record<(typeof ERROR_CODE_PARAMS)[C][number], string>
>;

// The ErrorTranslation for a code the CLIENT decided on (a rule it enforces
// ahead of the server, or a lookup that came back empty): the only sanctioned
// way to build an ERRORS.<CODE> key by hand — the argument is a member of the
// contract, never a wire value (ADR 0002). Interpolated codes require exactly
// the placeholders ERROR_CODE_PARAMS lists for them, so a missing or renamed
// param fails to compile instead of rendering a raw `{{name}}`.
export function errorTranslationFor<C extends InterpolatedErrorCode>(
  code: C,
  params: ErrorParamsFor<C>,
): ErrorTranslation;
export function errorTranslationFor(
  code: Exclude<KnownErrorCode, InterpolatedErrorCode>,
): ErrorTranslation;
export function errorTranslationFor(
  code: KnownErrorCode,
  params?: ErrorTranslation['params'],
): ErrorTranslation {
  return buildErrorTranslation(code, params);
}

function buildErrorTranslation(
  code: KnownErrorCode,
  params: ErrorTranslation['params'],
): ErrorTranslation {
  return params ? { key: `ERRORS.${code}`, params } : { key: `ERRORS.${code}` };
}

function toInterpolationParams(value: unknown): ErrorTranslation['params'] {
  if (!isRecord(value)) return undefined;

  const params: Record<string, string | number> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string' || typeof entry === 'number') params[key] = entry;
  }
  return Object.keys(params).length > 0 ? params : undefined;
}
