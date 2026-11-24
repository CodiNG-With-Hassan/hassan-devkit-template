/**
 * The single source of every machine-readable error code the API can return
 * (ADR 0002). Codes are domain-prefixed SCREAMING_SNAKE identifiers; the
 * frontends translate them — the English `message` next to a code is debug
 * detail that users never see.
 *
 * Every member must have a translation in every frontend language (enforced
 * by `scripts/check-error-translations.mjs` in CI and pre-commit), so only
 * add a code together with its catalog entries. Member order is part of the
 * committed OpenAPI spec (`ErrorCode` is a named enum there, compared in
 * order by the same check), so adding or moving a member means running
 * `pnpm api:types` against your own stack and committing the regenerated
 * spec and packages with it.
 *
 * The generic codes at the top are the status defaults `AllExceptionsFilter`
 * applies to the only errors that reach it without a code — the
 * framework-raised ones: Nest's unknown-route 404, parse pipes, body-parser
 * limits, and — once a project adds them — a rate limiter's 429, an auth
 * guard's bare 401 or 403, and uncoded 5xx. Only enum members reach the wire.
 *
 * Members are grouped per domain; a new code is appended to its domain block
 * (the `/add-error-code` skill). A code that no UI can
 * trigger says so in its JSDoc ("Server-side-only: …") so reachability stays
 * auditable. The `Params:` notes document what travels on the wire with a
 * code.
 */
export enum ErrorCode {
  // Generic codes — the status defaults of AllExceptionsFilter.
  /** A request payload failed class-validator checks, or any other uncoded client error — parse pipes, multer field limits, malformed JSON (400); also the filter's fallthrough for every 4xx without a dedicated default. */
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  /** An unexpected server-side failure; detail is logged, never returned (500). */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  /** Missing/invalid credentials — the caller is not logged in (401). */
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  /** Logged in, but the caller's role does not allow this action (403). */
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  /** No route or resource at this URL — Nest's unknown-route handler, or any other uncoded 404 (404). */
  NOT_FOUND = 'NOT_FOUND',
  /** An uploaded file or the request body exceeds the configured size limit — multer `fileSize`, body-parser (413). */
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  /** Too many requests from this client inside the throttle window (429). */
  RATE_LIMITED = 'RATE_LIMITED',
}
