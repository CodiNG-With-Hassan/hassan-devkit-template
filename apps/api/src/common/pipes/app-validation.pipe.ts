import { HttpStatus, ValidationError, ValidationPipe } from '@nestjs/common';
import { ErrorCode } from '../errors/error-code.enum';
import { DomainException } from '../errors/domain.exception';

/**
 * The app-wide `ValidationPipe`: same options as before (whitelist,
 * forbidNonWhitelisted, transform) but every class-validator failure is
 * raised as `VALIDATION_FAILED` (ADR 0002). The flattened constraint
 * sentences stay in `message` for debugging; the frontends translate the
 * code — signal forms are the real validation layer, the API is a backstop.
 */
export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  }

  override createExceptionFactory(): (
    validationErrors?: ValidationError[],
  ) => unknown {
    return (validationErrors: ValidationError[] = []) =>
      new DomainException(
        ErrorCode.VALIDATION_FAILED,
        this.flattenValidationErrors(validationErrors),
        HttpStatus.BAD_REQUEST,
      );
  }
}
