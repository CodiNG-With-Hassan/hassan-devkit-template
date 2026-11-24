// @ts-check
import config from '@coding-with-hassan/eslint-config-api';

// Every HttpException class @nestjs/common ships (plus HttpException itself)
// and the HttpException subclasses of the Nest packages an API commonly adds.
const NEST_HTTP_EXCEPTIONS = [
  'HttpException',
  'BadGatewayException',
  'BadRequestException',
  'ConflictException',
  'ForbiddenException',
  'GatewayTimeoutException',
  'GoneException',
  'HttpVersionNotSupportedException',
  'ImATeapotException',
  'InternalServerErrorException',
  'MethodNotAllowedException',
  'MisdirectedException',
  'NotAcceptableException',
  'NotFoundException',
  'NotImplementedException',
  'PayloadTooLargeException',
  'PreconditionFailedException',
  'RequestTimeoutException',
  'ServiceUnavailableException',
  'UnauthorizedException',
  'UnprocessableEntityException',
  'UnsupportedMediaTypeException',
  // @nestjs/throttler (banned ahead of its arrival)
  'ThrottlerException',
].join('|');

const IS_NEST_HTTP_EXCEPTION = `/^(${NEST_HTTP_EXCEPTIONS})$/`;

const CONTRACT_MESSAGE =
  'Nest HttpExceptions bypass the error-code contract (ADR 0002). Throw new DomainException(ErrorCode.X, debugMessage, status, params?) instead.';

export default config({
  tsconfigRootDir: import.meta.dirname,
  extra: [
    {
      // ADR 0002: client-facing errors carry a stable ErrorCode, so
      // constructing any Nest HttpException directly is banned whatever the
      // argument shape — string, template, concatenation, object literal,
      // identifier or no argument at all. Throw DomainException instead; it
      // is the only sanctioned subclass (its `super(...)` call is not a
      // NewExpression, so it needs no exemption). The ban also covers the
      // ways around a bare identifier: constructing through a namespace or
      // member access (`new common.NotFoundException()`), renaming the class
      // on import (`import { NotFoundException as NF }`) and declaring a new
      // subclass (`class Foo extends HttpException`) — DomainException's own
      // declaration carries the one targeted exemption, and it is the only
      // one: every throw under src/ is a DomainException, so there is no
      // per-file ignore list and no other eslint-disable for these selectors — a new direct
      // construction anywhere fails lint. Spec files are exempt: constructing
      // an expected exception in a legacy test is not a throw site.
      files: ['src/**/*.ts'],
      ignores: ['src/**/*.spec.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: `NewExpression[callee.name=${IS_NEST_HTTP_EXCEPTION}]`,
            message: CONTRACT_MESSAGE,
          },
          {
            selector: `NewExpression[callee.type='MemberExpression'][callee.property.name=${IS_NEST_HTTP_EXCEPTION}]`,
            message: CONTRACT_MESSAGE,
          },
          {
            selector: `ImportSpecifier[imported.name=${IS_NEST_HTTP_EXCEPTION}]:not([local.name=${IS_NEST_HTTP_EXCEPTION}])`,
            message:
              'Renaming a Nest HttpException on import hides it from the error-code contract ban (ADR 0002). Import it under its own name.',
          },
          {
            selector: `:matches(ClassDeclaration, ClassExpression):matches([superClass.name=${IS_NEST_HTTP_EXCEPTION}], [superClass.property.name=${IS_NEST_HTTP_EXCEPTION}])`,
            message:
              'Subclassing a Nest HttpException bypasses the error-code contract (ADR 0002). DomainException is the only sanctioned subclass — extend it or throw it directly.',
          },
        ],
      },
    },
  ],
});
