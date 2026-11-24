import { type KnownErrorCode } from './error-codes';
import { isRecord, KNOWN_CODES } from './internal/wire-shape';

// Reads the machine-readable error code (ADR 0002) from a failed request so a
// caller can branch on it — `errorCodeOf(err) === ErrorCode.X` — before it
// falls back to inline display through toErrorTranslation. Same wire-shape
// tolerance as that helper: anything that is not `{ error: { code } }` with a
// code the shared ERRORS catalog knows yields undefined (bodies without a code
// such as proxy error pages or network failures, codes newer than this checkout).
export function errorCodeOf(error: unknown): KnownErrorCode | undefined {
  if (!isRecord(error) || !isRecord(error['error'])) return undefined;
  const code = error['error']['code'];
  return typeof code === 'string' && KNOWN_CODES.has(code) ? (code as KnownErrorCode) : undefined;
}
