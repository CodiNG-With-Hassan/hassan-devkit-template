import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code.enum';
import type { ErrorParams } from './error-params';

/**
 * The one way domain code raises a client-facing error (ADR 0002): a stable
 * `ErrorCode` the frontends translate, an English debug `message` that users
 * never see, the HTTP status, and optional interpolation `params` for the
 * translation. Constructing Nest's `HttpException` classes directly is
 * banned by ESLint whatever the argument shape — throw this instead.
 *
 * The response body is shaped by `AllExceptionsFilter`, which adds
 * `statusCode` and `error` around the fields given here.
 */
// eslint-disable-next-line no-restricted-syntax -- the one sanctioned HttpException subclass (ADR 0002); every other subclass fails lint
export class DomainException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string | string[],
    status: HttpStatus,
    readonly params?: ErrorParams,
  ) {
    super({ message, code, ...(params ? { params } : {}) }, status);
  }
}
