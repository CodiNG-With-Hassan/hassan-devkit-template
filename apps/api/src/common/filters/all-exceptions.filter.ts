import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DomainException } from '../errors/domain.exception';
import { ErrorCode } from '../errors/error-code.enum';
import type { ErrorParams } from '../errors/error-params';

/**
 * The runtime shape of every error body this API sends — exactly the
 * `ErrorResponse` DTO fields, nothing else. `code` is never absent: every
 * path through the filter ends in an enum member.
 */
interface ShapedErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  code: ErrorCode;
  params?: ErrorParams;
}

/** Every wire-legal code — the only strings the `code` field may carry. */
const CONTRACT_CODES: ReadonlySet<string> = new Set<string>(
  Object.values(ErrorCode),
);

/**
 * The errors express and body-parser raise before Nest's pipeline runs
 * (`http-errors`): a plain Error carrying its own HTTP status.
 */
interface HttpErrorLike extends Error {
  status?: unknown;
  statusCode?: unknown;
  expose?: unknown;
}

/**
 * Global exception filter (ADR 0002): every error leaves the API as an
 * `ErrorResponse` body — `statusCode`, English debug `message`, `error`
 * (HTTP reason phrase), and a machine-readable `code` the frontends
 * translate plus its interpolation `params`. What reaches it, and how each
 * gets its code:
 *
 * - `DomainException` — the contract's native shape and the only way this
 *   codebase raises a client-facing error (ESLint bans constructing any
 *   other `HttpException`), forwarded as-is;
 * - framework-raised `HttpException`s (Nest's unknown-route 404, parse
 *   pipes, multer limits, the throttler, passport's 401, the roles guard's
 *   403) — the status default;
 * - express/body-parser `http-errors` raised before Nest sees the request
 *   (oversized, unreadable, unsupported-charset or -encoding bodies) —
 *   shaped like a framework 4xx;
 * - anything else — a 500 `INTERNAL_ERROR`, detail logged, never sent.
 *
 * The status-default table is total, so no body leaves without a `code`.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = this.shape(exception);

    const { httpAdapter } = this.httpAdapterHost;
    httpAdapter.reply(host.switchToHttp().getResponse(), body, body.statusCode);
  }

  private shape(exception: unknown): ShapedErrorBody {
    if (exception instanceof HttpException) {
      return this.shapeHttpException(exception);
    }
    if (exception instanceof Error) {
      const clientErrorStatus = exposedClientErrorStatus(exception);
      if (clientErrorStatus !== undefined) {
        return shapeExpressError(exception, clientErrorStatus);
      }
    }
    return this.shapeUnknownException(exception);
  }

  private shapeHttpException(exception: HttpException): ShapedErrorBody {
    const status = exception.getStatus();
    const response = exception.getResponse();

    // `throw new HttpException('some message', status)` — the bare-string
    // style Nest would otherwise answer without an `error` field. The
    // throttler's 429 arrives this way.
    if (typeof response === 'string') {
      return {
        statusCode: status,
        message: response,
        error: reasonPhraseFor(status),
        code: defaultCodeFor(status),
      };
    }

    const raw = response as Record<string, unknown>;
    const { message, error, code, params } = raw;

    // DomainException is the contract's native shape — forwarded as-is.
    if (exception instanceof DomainException) {
      return {
        statusCode: status,
        message: isMessage(message) ? message : exception.message,
        error: reasonPhraseFor(status),
        code: exception.code,
        params: exception.params,
      };
    }

    // Every other HttpException with an object response is framework-raised
    // (Nest's 404 body, multer's 413, a guard's bare 401/403) and carries no
    // `code`, so it gets the status default. Only the owned ErrorResponse
    // fields leave the API — any other top-level key is dropped. Reading
    // `code`/`params` off the response at all is a defensive backstop for a
    // third-party Nest module raising its own coded exception; lint keeps
    // this codebase from doing so.
    return {
      statusCode: status,
      message: isMessage(message) ? message : exception.message,
      error: typeof error === 'string' ? error : reasonPhraseFor(status),
      code: this.contractCodeFor(code, status),
      params: isErrorParams(params) ? params : undefined,
    };
  }

  /**
   * Only enum members reach the wire. Framework exceptions carry no `code`
   * and get the status default. A `code` that is not an enum member cannot
   * come from this codebase — every throw is a DomainException — so if one
   * ever arrives (a third-party module's own coded exception) it is logged
   * and replaced by the status default too, and the frontends never receive
   * a code the shared catalog cannot translate.
   */
  private contractCodeFor(code: unknown, status: number): ErrorCode {
    if (isErrorCode(code)) {
      return code;
    }
    const fallback = defaultCodeFor(status);
    if (code !== undefined) {
      const offender =
        typeof code === 'string' ? code : `a non-string ${typeof code}`;
      this.logger.warn(
        `Non-contract error code ${offender} on a ${status} response replaced by ${fallback} — client-facing errors are DomainExceptions over the ErrorCode enum (ADR 0002)`,
      );
    }
    return fallback;
  }

  private shapeUnknownException(exception: unknown): ShapedErrorBody {
    // Unexpected failure: log the full detail server-side, leak none of it.
    this.logger.error(describeUnknownException(exception));

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
      code: ErrorCode.INTERNAL_ERROR,
    };
  }
}

/**
 * The code an error gets when it reaches the filter without one — framework-
 * raised errors and express/body-parser rejections. Total by design, which is
 * what lets `ErrorResponse.code` be required: the statuses with a dedicated
 * generic code map to it; every other client status falls through to
 * `VALIDATION_FAILED` (the request as sent cannot be processed — body-parser's
 * 415 on an unsupported charset or content encoding is the one this API is
 * known to produce; nothing raises a sub-400 status as an exception); 5xx is
 * `INTERNAL_ERROR`.
 */
function defaultCodeFor(status: number): ErrorCode {
  if (status >= HttpStatus.INTERNAL_SERVER_ERROR.valueOf()) {
    return ErrorCode.INTERNAL_ERROR;
  }
  if (status === HttpStatus.UNAUTHORIZED.valueOf()) {
    return ErrorCode.AUTH_UNAUTHORIZED;
  }
  if (status === HttpStatus.FORBIDDEN.valueOf()) {
    return ErrorCode.AUTH_FORBIDDEN;
  }
  if (status === HttpStatus.NOT_FOUND.valueOf()) {
    return ErrorCode.NOT_FOUND;
  }
  if (status === HttpStatus.PAYLOAD_TOO_LARGE.valueOf()) {
    return ErrorCode.PAYLOAD_TOO_LARGE;
  }
  if (status === HttpStatus.TOO_MANY_REQUESTS.valueOf()) {
    return ErrorCode.RATE_LIMITED;
  }
  return ErrorCode.VALIDATION_FAILED;
}

/**
 * express/body-parser reject a request before Nest's pipeline runs — an
 * oversized body (`entity.too.large`, 413), an unsupported charset or content
 * encoding (415), too many parameters — with an `http-errors` Error that
 * carries its own client status and `expose: true`. Nest re-wraps only the
 * JSON SyntaxError case, so the rest would otherwise leave as a 500.
 */
function exposedClientErrorStatus(exception: Error): number | undefined {
  const { status, statusCode, expose } = exception as HttpErrorLike;
  const candidate = typeof statusCode === 'number' ? statusCode : status;
  if (expose !== true || typeof candidate !== 'number') return undefined;
  const isClientError =
    candidate >= HttpStatus.BAD_REQUEST.valueOf() &&
    candidate < HttpStatus.INTERNAL_SERVER_ERROR.valueOf();
  return isClientError ? candidate : undefined;
}

function shapeExpressError(exception: Error, status: number): ShapedErrorBody {
  return {
    statusCode: status,
    message: exception.message,
    error: reasonPhraseFor(status),
    code: defaultCodeFor(status),
  };
}

/** 409 -> "Conflict", 500 -> "Internal Server Error" — Nest's `error` field. */
function reasonPhraseFor(status: number): string {
  const enumKey: string | undefined = HttpStatus[status];
  if (!enumKey) return 'Error';
  return enumKey
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function describeUnknownException(exception: unknown): string {
  if (exception instanceof Error) {
    return exception.stack ?? exception.message;
  }
  try {
    return `Unhandled non-Error exception: ${JSON.stringify(exception)}`;
  } catch {
    // Circular or otherwise unstringifiable value — never crash the filter.
    return `Unhandled non-Error exception: ${String(exception)}`;
  }
}

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && CONTRACT_CODES.has(value);
}

function isMessage(value: unknown): value is string | string[] {
  return (
    typeof value === 'string' ||
    (Array.isArray(value) && value.every((item) => typeof item === 'string'))
  );
}

function isErrorParams(value: unknown): value is ErrorParams {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (item) => typeof item === 'string' || typeof item === 'number',
    )
  );
}
