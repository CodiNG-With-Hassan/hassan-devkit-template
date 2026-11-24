import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorCode } from '../errors/error-code.enum';
import type { ErrorParams } from '../errors/error-params';

// The body AllExceptionsFilter sends for every error (4xx/5xx), per ADR 0002:
// `code` + `params` are the translatable contract the frontends render;
// `message` is the English debug detail (a string[] when the global
// ValidationPipe rejects a payload) that users never see.
export class ErrorResponse {
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message!: string | string[];

  error?: string;

  // Always an enum member: every domain failure is a DomainException carrying
  // one, and the filter maps everything else — framework-raised errors
  // (unknown route, parse pipes, upload limits, rate limiting, bare 401/403,
  // uncoded 5xx) and the express/body-parser rejections raised before Nest
  // sees a request — to a status default whose table is total: dedicated
  // generic codes for 401/403/404/413/429, VALIDATION_FAILED for any other
  // 4xx (body-parser's 415 on an unsupported charset), INTERNAL_ERROR for
  // 5xx. Hence required in the spec. The frontends' ERRORS.UNKNOWN fallback
  // covers bodies that never came from this filter (proxy error pages,
  // network failures) and codes the deployed frontend bundle does not know
  // yet (an API newer than the frontend) — never a code-less body from this
  // API.
  @ApiProperty({
    enum: ErrorCode,
    enumName: 'ErrorCode',
    description:
      'Stable machine-readable error code (ADR 0002) — the unit of error translation in the frontends.',
  })
  code!: ErrorCode;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { oneOf: [{ type: 'string' }, { type: 'number' }] },
    description:
      'Interpolation values for the translated message of `code`, e.g. `{ "max": 10 }`.',
  })
  params?: ErrorParams;
}
