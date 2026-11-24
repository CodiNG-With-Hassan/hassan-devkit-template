import { ERROR_CODES } from '../error-codes';

// Guards for reading the ADR 0002 wire shape `{ error: { code?, params? } }`
// out of an unknown failure, shared by the helpers in this lib so the
// tolerance rules stay identical. Internal on purpose: consumers go through
// toErrorTranslation / errorCodeOf.
export const KNOWN_CODES: ReadonlySet<string> = new Set<string>(ERROR_CODES);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
